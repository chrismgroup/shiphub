/**
 * useCharterSocket — establishes a WebSocket connection to the charter hub
 * and invalidates React Query caches when the server pushes an update.
 *
 * Usage:
 *   useCharterSocket();               // in charters list screen
 *   useCharterSocket(charterId);      // in charter detail screen
 *
 * The hook manages its own lifecycle: it connects on mount, reconnects after
 * network interruptions with exponential back-off, and disconnects on unmount.
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getToken } from "@/lib/api";

function getWsUrl(token: string): string {
  const encodedToken = encodeURIComponent(token);
  const ownersApiUrl = process.env.EXPO_PUBLIC_OWNERS_API_BASE_URL;
  const apiBaseUrl = ownersApiUrl || process.env.EXPO_PUBLIC_API_URL;
  if (apiBaseUrl) {
    const apiUrl = new URL(apiBaseUrl);
    const protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
    const apiPath = apiUrl.pathname.replace(/\/+$/, "");
    return `${protocol}//${apiUrl.host}${apiPath}/ws/charters?token=${encodedToken}`;
  }

  const domain = process.env.EXPO_PUBLIC_DOMAIN;

  if (domain) {
    return `wss://${domain}/api/ws/charters?token=${encodedToken}`;
  }

  // Web browser — derive protocol + host from current page
  if (typeof window !== "undefined" && window.location) {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/api/ws/charters?token=${encodedToken}`;
  }

  // Fallback for native dev without EXPO_PUBLIC_DOMAIN set
  return `ws://localhost/api/ws/charters?token=${encodedToken}`;
}

export function useCharterSocket(charterId?: number): void {
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);
  const retryDelayRef = useRef(1000);

  useEffect(() => {
    unmountedRef.current = false;

    // Token is managed by AuthContext via setTokenGetter; read it at connect time.
    const token = getToken();
    if (!token) return;

    function connect() {
      if (unmountedRef.current || !token) return;

      const url = getWsUrl(token);
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch {
        scheduleRetry();
        return;
      }

      wsRef.current = ws;

      ws.onopen = () => {
        retryDelayRef.current = 1000; // reset back-off on successful connect
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(String(event.data)) as {
            type: string;
            charterId?: number;
          };

          if (msg.type === "charter_updated") {
            // Invalidate the specific charter if we're watching one
            if (charterId != null) {
              qc.invalidateQueries({ queryKey: ["charter", charterId] });
            }
            // Also invalidate if the updated charter is the one we're on
            if (msg.charterId != null && msg.charterId === charterId) {
              qc.invalidateQueries({ queryKey: ["charter", msg.charterId] });
            }
          }

          if (
            msg.type === "charter_list_updated" ||
            msg.type === "charter_updated"
          ) {
            qc.invalidateQueries({ queryKey: ["charter-parties"] });
          }
        } catch {
          /* ignore malformed messages */
        }
      };

      ws.onerror = () => {
        // onclose will fire after onerror; reconnect logic lives there
      };

      ws.onclose = () => {
        wsRef.current = null;
        scheduleRetry();
      };
    }

    function scheduleRetry() {
      if (unmountedRef.current) return;
      retryRef.current = setTimeout(() => {
        // Exponential back-off capped at 30 s
        retryDelayRef.current = Math.min(retryDelayRef.current * 2, 30_000);
        connect();
      }, retryDelayRef.current);
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional close
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [qc, charterId]);
}

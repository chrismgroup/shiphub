import React, { useRef, useState } from 'react';
import {
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutRectangle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { vesselPhotoUrl } from '@/lib/api';
import type { VesselPhoto } from '@/lib/types';

type Palette = {
  background: string;
  card: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  border: string;
  destructive: string;
};

type Props = {
  photos: VesselPhoto[];
  colors: Palette;
  isSaving: boolean;
  onReorder: (photos: VesselPhoto[]) => void;
  onDelete: (photoId: number) => void;
};

type DragStart = {
  id: number;
  layout: LayoutRectangle;
};

export function VesselPhotoManager({
  photos,
  colors,
  isSaving,
  onReorder,
  onDelete,
}: Props) {
  const layouts = useRef<Record<number, LayoutRectangle>>({});
  const dragStart = useRef<DragStart | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const findDropIndex = (id: number, dx: number, dy: number) => {
    const start = dragStart.current;
    if (!start || start.id !== id) return null;

    const point = {
      x: start.layout.x + start.layout.width / 2 + dx,
      y: start.layout.y + start.layout.height / 2 + dy,
    };
    let nearestIndex = photos.findIndex((photo) => photo.id === id);
    let nearestDistance = Number.POSITIVE_INFINITY;

    photos.forEach((photo, index) => {
      const layout = layouts.current[photo.id];
      if (!layout) return;
      const distance = Math.hypot(
        point.x - (layout.x + layout.width / 2),
        point.y - (layout.y + layout.height / 2),
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  };

  const finishDrag = (dx: number, dy: number) => {
    const start = dragStart.current;
    const targetIndex = start ? findDropIndex(start.id, dx, dy) : null;

    if (
      start &&
      targetIndex !== null &&
      targetIndex !== photos.findIndex((photo) => photo.id === start.id)
    ) {
      const nextPhotos = [...photos];
      const sourceIndex = nextPhotos.findIndex((photo) => photo.id === start.id);
      const [movedPhoto] = nextPhotos.splice(sourceIndex, 1);
      nextPhotos.splice(targetIndex, 0, movedPhoto);
      onReorder(
        nextPhotos.map((photo, index) => ({ ...photo, sortOrder: index })),
      );
    }

    dragStart.current = null;
    setDraggingId(null);
    setDragOffset({ x: 0, y: 0 });
    setDropIndex(null);
  };

  if (photos.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="image" size={22} color={colors.mutedForeground} />
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          No photos uploaded yet
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.helperRow}>
        <Feather name="move" size={14} color={colors.primary} />
        <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
          Drag to reorder · the first photo is your hero image
        </Text>
      </View>
      {isSaving ? (
        <Text style={[styles.savingText, { color: colors.primary }]}>Saving new order…</Text>
      ) : null}
      <View style={styles.grid}>
        {photos.map((photo, index) => {
          const isDragging = draggingId === photo.id;
          const responder = PanResponder.create({
            onStartShouldSetPanResponder: () => false,
            onMoveShouldSetPanResponder: (_event, gestureState) =>
              !isSaving &&
              (Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6),
            onPanResponderGrant: () => {
              const layout = layouts.current[photo.id];
              if (!layout || isSaving) return;
              dragStart.current = { id: photo.id, layout };
              setDraggingId(photo.id);
              setDropIndex(index);
            },
            onPanResponderMove: (_event, gestureState) => {
              setDragOffset({ x: gestureState.dx, y: gestureState.dy });
              setDropIndex(findDropIndex(photo.id, gestureState.dx, gestureState.dy));
            },
            onPanResponderRelease: (_event, gestureState) => {
              finishDrag(gestureState.dx, gestureState.dy);
            },
            onPanResponderTerminate: () => finishDrag(0, 0),
          });

          return (
            <View
              key={photo.id}
              {...responder.panHandlers}
              onLayout={(event) => {
                layouts.current[photo.id] = event.nativeEvent.layout;
              }}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: dropIndex === index && draggingId !== null
                    ? colors.primary
                    : colors.border,
                  opacity: isDragging ? 0.9 : 1,
                  zIndex: isDragging ? 2 : 1,
                  transform: isDragging
                    ? [{ translateX: dragOffset.x }, { translateY: dragOffset.y }]
                    : undefined,
                },
              ]}
            >
              <Image
                source={{ uri: vesselPhotoUrl(photo.objectPath) }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <View style={styles.cardFooter}>
                <View style={styles.orderLabel}>
                  {index === 0 ? (
                    <View style={[styles.heroBadge, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.heroText, { color: colors.primaryForeground }]}>
                        Hero
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.photoLabel, { color: colors.mutedForeground }]}>
                      Photo {index + 1}
                    </Text>
                  )}
                </View>
                <Pressable
                  accessibilityLabel={`Delete photo ${index + 1}`}
                  hitSlop={8}
                  onPress={() => onDelete(photo.id)}
                  disabled={isSaving}
                >
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  helperRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
  helperText: { fontFamily: 'Inter_400Regular', fontSize: 12, flex: 1 },
  savingText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '48%',
    minHeight: 153,
    borderWidth: 1,
    borderRadius: 12,
    padding: 7,
    gap: 7,
  },
  thumbnail: { width: '100%', height: 105, borderRadius: 8, backgroundColor: '#202521' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 },
  orderLabel: { flex: 1 },
  photoLabel: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  heroBadge: { alignSelf: 'flex-start', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3 },
  heroText: { fontFamily: 'Inter_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  empty: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});
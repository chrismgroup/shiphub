function dateValue(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function canActivateCharter(
  auth: { userId: number; role: string },
  charter: { ownerId: number },
) {
  return auth.role === "admin" || auth.userId === charter.ownerId;
}

export function validateHireDates(
  body: Record<string, unknown>,
  charter: { durationDays: number | null; laycanEarliest: Date | null },
  now = new Date(),
) {
  const requestedStart = dateValue(body.hireStart);
  const requestedEnd = dateValue(body.hireEnd);
  if (
    (body.hireStart !== undefined && body.hireStart !== null && !requestedStart) ||
    (body.hireEnd !== undefined && body.hireEnd !== null && !requestedEnd)
  ) {
    return { error: "Hire dates must be valid dates" } as const;
  }

  const hireStart = requestedStart ?? charter.laycanEarliest ?? now;
  const hireEnd =
    requestedEnd ??
    new Date(hireStart.getTime() + (charter.durationDays ?? 0) * 24 * 60 * 60 * 1000);
  if (hireEnd <= hireStart) {
    return { error: "hireEnd must be after hireStart" } as const;
  }

  return { hireStart, hireEnd } as const;
}
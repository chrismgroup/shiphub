import colors from '@/constants/colors';

/**
 * Returns ShipHub Charterer's light maritime chart-room palette.
 * A single high-contrast palette keeps the marketplace consistent across devices.
 */
export function useColors() {
  const { light, radius } = colors;
  return { ...light, radius };
}

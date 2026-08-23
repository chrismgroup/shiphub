import colors from '@/constants/colors';

/**
 * Returns the design tokens for the Direction B (Lagos Blue Economy) dark palette.
 * The app ships as a dark-mode-first product; the dark palette is always active.
 */
export function useColors() {
  const { dark, radius } = colors;
  return { ...dark, radius };
}

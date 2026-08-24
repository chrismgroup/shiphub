/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#111111',
    tint: '#7AA51F',

    // Core surfaces
    background: '#F5F5F2',
    foreground: '#111111',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#111111',

    // Primary action color (buttons, links, active states)
    primary: '#A8D936',
    primaryForeground: '#111111',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E8E8E2',
    secondaryForeground: '#3A3A35',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#ECECE7',
    mutedForeground: '#70706A',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#7AA51F',
    accentForeground: '#FFFFFF',

    // Destructive actions (delete, error states)
    destructive: '#D64545',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#D7D7D0',
    input: '#D7D7D0',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;

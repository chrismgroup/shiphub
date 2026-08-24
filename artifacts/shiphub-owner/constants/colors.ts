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
    text: '#f7f8f5',
    tint: '#46c37b',

    // Core surfaces
    background: '#0b0d0c',
    foreground: '#f7f8f5',

    // Cards / elevated surfaces
    card: '#151917',
    cardForeground: '#f7f8f5',

    // Primary action color (buttons, links, active states)
    primary: '#46c37b',
    primaryForeground: '#08130c',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#202521',
    secondaryForeground: '#f7f8f5',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#202521',
    mutedForeground: '#98a19a',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#d7f8e3',
    accentForeground: '#08130c',

    // Destructive actions (delete, error states)
    destructive: '#ef6464',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#2b332e',
    input: '#2b332e',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;

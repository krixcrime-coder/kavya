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
    text: '#F6F7FF',
    tint: '#9B8CFF',

    // Core surfaces
    background: '#0A0920',
    foreground: '#F6F7FF',

    // Cards / elevated surfaces
    card: '#151333',
    cardForeground: '#F6F7FF',

    // Primary action color (buttons, links, active states)
    primary: '#9B8CFF',
    primaryForeground: '#0A0920',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#211D49',
    secondaryForeground: '#F6F7FF',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#211D49',
    mutedForeground: '#A7A4C1',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#2A2357',
    accentForeground: '#F6F7FF',

    // Destructive actions (delete, error states)
    destructive: '#FF7474',
    destructiveForeground: '#0A0920',

    // Borders and input outlines
    border: '#332D62',
    input: '#332D62',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;

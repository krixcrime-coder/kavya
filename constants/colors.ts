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
    text: '#132136',
    tint: '#e86558',

    // Core surfaces
    background: '#f7f1e9',
    foreground: '#132136',

    // Cards / elevated surfaces
    card: '#fffdf8',
    cardForeground: '#132136',

    // Primary action color (buttons, links, active states)
    primary: '#e86558',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#e8eef4',
    secondaryForeground: '#24415a',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#eee7de',
    mutedForeground: '#71808d',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#dbe8ed',
    accentForeground: '#24415a',

    // Destructive actions (delete, error states)
    destructive: '#bc4d46',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#dfd6ca',
    input: '#d6ccc0',
  },

  dark: {
    text: '#f7f1e9',
    tint: '#f07869',
    background: '#0f1d2d',
    foreground: '#f7f1e9',
    card: '#17283b',
    cardForeground: '#f7f1e9',
    primary: '#f07869',
    primaryForeground: '#0f1d2d',
    secondary: '#20374b',
    secondaryForeground: '#dbe8ed',
    muted: '#1b2b3c',
    mutedForeground: '#a9b8c2',
    accent: '#284557',
    accentForeground: '#dbe8ed',
    destructive: '#e46b61',
    destructiveForeground: '#0f1d2d',
    border: '#284052',
    input: '#355064',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 18,
};

export default colors;

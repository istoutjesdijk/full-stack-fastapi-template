// Single place the app name comes from. Driven by VITE_APP_NAME, which
// vite.config injects from PROJECT_NAME in the root .env (set by Copier), so a
// new project rebrands from one answer. Falls back to a neutral default.
export const APP_NAME = import.meta.env.VITE_APP_NAME || "App"

// Base name of the logo files in public/assets/images (default "logo" ships a
// neutral placeholder set: <LOGO>.svg, <LOGO>-light.svg, <LOGO>-icon.svg,
// <LOGO>-icon-light.svg). Point at your own set by setting VITE_LOGO.
export const LOGO = import.meta.env.VITE_LOGO || "logo"

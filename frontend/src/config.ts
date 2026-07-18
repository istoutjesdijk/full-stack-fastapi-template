// Single place the app name comes from. Driven by VITE_APP_NAME, which
// vite.config injects from PROJECT_NAME in the root .env (set by Copier), so a
// new project rebrands from one answer. Falls back to a neutral default.
export const APP_NAME = import.meta.env.VITE_APP_NAME || "App"

import { APP_NAME } from "@/config"

/**
 * Set the favicon from the app name's initial (matching the text Logo), so a
 * project's favicon follows the same VITE_APP_NAME / PROJECT_NAME variable
 * instead of a static file. Injected at runtime as an inline SVG.
 */
export function setAppFavicon(): void {
  const initial = APP_NAME.trim().charAt(0).toUpperCase() || "A"
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
    `<rect width="32" height="32" rx="6" fill="#18181b"/>` +
    `<text x="16" y="22" font-family="system-ui, sans-serif" font-size="18" ` +
    `font-weight="600" fill="#fff" text-anchor="middle">${initial}</text></svg>`

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement("link")
    link.rel = "icon"
    document.head.appendChild(link)
  }
  link.type = "image/svg+xml"
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`
}

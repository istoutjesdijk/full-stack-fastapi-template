import { OpenAPI } from "@/client"

/** Fetch a file from the API with the current auth token, as a Blob. */
export async function fetchAuthedFile(path: string): Promise<Blob> {
  const token = localStorage.getItem("access_token") || ""
  const res = await fetch(`${OpenAPI.BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`)
  }
  return res.blob()
}

/**
 * Download an authenticated API file to disk. The generated client can't do
 * this (a bare `<a href>` can't send Authorization, and a plain request
 * corrupts binary blobs), so this is the shared helper for it.
 */
export async function downloadFile(
  path: string,
  filename: string,
): Promise<void> {
  const blob = await fetchAuthedFile(path)
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

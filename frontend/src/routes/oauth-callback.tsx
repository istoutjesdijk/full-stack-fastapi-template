import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { APP_NAME } from "@/config"

// Landing page the backend redirects to after a successful SSO login: the app
// JWT arrives as a URL fragment (#access_token=...) so it stays out of server
// logs and referrers, and is stored in localStorage (same key as useAuth)
// before the app continues as if logged in normally.
export const Route = createFileRoute("/oauth-callback")({
  component: OauthCallback,
  head: () => ({
    meta: [
      {
        title: `Logging in - ${APP_NAME}`,
      },
    ],
  }),
})

function OauthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = params.get("access_token")
    if (token) {
      localStorage.setItem("access_token", token)
      // Strip the token from the address bar/history before navigating on.
      window.history.replaceState(null, "", window.location.pathname)
      navigate({ to: "/" })
    } else {
      navigate({ to: "/login" })
    }
  }, [navigate])

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="size-8 animate-spin text-muted-foreground" />
    </div>
  )
}

import { Link } from "@tanstack/react-router"

import { useTheme } from "@/components/theme-provider"
import { APP_NAME, LOGO } from "@/config"
import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

export function Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps) {
  const { resolvedTheme } = useTheme()
  // Logo files live in public/assets/images and are named after the VITE_LOGO
  // base (default "logo"). The "-light" variants are the light-ink versions for
  // dark backgrounds. Rebrand by dropping in your own <name>*.svg set and
  // setting VITE_LOGO=<name>.
  const suffix = resolvedTheme === "dark" ? "-light" : ""
  const fullSrc = `/assets/images/${LOGO}${suffix}.svg`
  const iconSrc = `/assets/images/${LOGO}-icon${suffix}.svg`

  const content =
    variant === "responsive" ? (
      <>
        <img
          src={fullSrc}
          alt={APP_NAME}
          className={cn(
            "h-6 w-auto group-data-[collapsible=icon]:hidden",
            className,
          )}
        />
        <img
          src={iconSrc}
          alt={APP_NAME}
          className={cn(
            "size-5 hidden group-data-[collapsible=icon]:block",
            className,
          )}
        />
      </>
    ) : (
      <img
        src={variant === "full" ? fullSrc : iconSrc}
        alt={APP_NAME}
        className={cn(variant === "full" ? "h-6 w-auto" : "size-5", className)}
      />
    )

  if (!asLink) {
    return content
  }

  return <Link to="/">{content}</Link>
}

import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"

import { APP_NAME } from "@/config"
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
  const initial = APP_NAME.charAt(0).toUpperCase()

  let content: ReactNode
  if (variant === "icon") {
    content = (
      <span className={cn("text-lg font-semibold text-foreground", className)}>
        {initial}
      </span>
    )
  } else if (variant === "responsive") {
    content = (
      <span
        className={cn(
          "text-lg font-semibold tracking-tight text-foreground",
          className,
        )}
      >
        <span className="group-data-[collapsible=icon]:hidden">{APP_NAME}</span>
        <span className="hidden group-data-[collapsible=icon]:inline">
          {initial}
        </span>
      </span>
    )
  } else {
    content = (
      <span
        className={cn(
          "text-lg font-semibold tracking-tight text-foreground",
          className,
        )}
      >
        {APP_NAME}
      </span>
    )
  }

  if (!asLink) {
    return content
  }

  return <Link to="/">{content}</Link>
}

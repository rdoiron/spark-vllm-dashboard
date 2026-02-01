"use client"

import * as React from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { cn } from "@/lib/utils"

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, loading, loadingText, children, disabled, ...props }, ref) => {
    const isDisabled = loading || disabled

    return (
      <Button
        className={cn("relative", className)}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {loading ? (
          <>
            <LoadingSpinner className="h-4 w-4 animate-spin" />
            <span className="ml-2">{loadingText || "Loading..."}</span>
          </>
        ) : (
          children
        )}
      </Button>
    )
  }
)
LoadingButton.displayName = "LoadingButton"
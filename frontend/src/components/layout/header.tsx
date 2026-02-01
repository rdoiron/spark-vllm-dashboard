"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConnectionBadge } from "@/components/layout/connection-status"
import { Moon, Sun, Monitor, Bell } from "lucide-react"

export function Header() {
  const { setTheme } = useTheme()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6 transition-smooth">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <ConnectionBadge />
        <Button variant="ghost" size="icon" className="relative transition-fast hover:bg-muted">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white animate-pulse">
            3
          </span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="transition-fast hover:bg-muted">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="fade-in">
            <DropdownMenuItem onClick={() => setTheme("light")} className="transition-fast">
              <Sun className="mr-2 h-4 w-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="transition-fast">
              <Moon className="mr-2 h-4 w-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} className="transition-fast">
              <Monitor className="mr-2 h-4 w-4" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
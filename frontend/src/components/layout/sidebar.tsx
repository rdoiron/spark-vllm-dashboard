"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Box,
  FileText,
  LineChart,
  Settings,
  User,
  FolderOpen,
  Database,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Models", href: "/models", icon: Box },
  { name: "Inventory", href: "/inventory", icon: Database },
  { name: "Profiles", href: "/profiles", icon: FolderOpen },
  { name: "Metrics", href: "/metrics", icon: LineChart },
  { name: "Logs", href: "/logs", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <div className={cn("flex h-full flex-col bg-muted/10 transition-all duration-300", className)}>
      <div className={cn("flex h-16 items-center border-b px-4 transition-all", collapsed ? "justify-center px-2" : "px-6")}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary transition-fast hover:scale-105">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold transition-all">vLLM Dashboard</span>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0 transition-fast" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
      <div className={cn("border-t p-4 transition-all", collapsed ? "px-2 text-center" : "")}>
        {!collapsed && (
          <div className="text-xs text-muted-foreground">
            <p>v1.0.0</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <div className="hidden lg:flex lg:w-64 xl:w-72">
        {sidebarContent}
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50 h-10 w-10 shadow-md"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  )
}
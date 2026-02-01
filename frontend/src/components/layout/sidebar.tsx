"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Box,
  FileText,
  LineChart,
  Settings,
  User,
  FolderOpen,
  Database,
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

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10 transition-smooth">
      <div className="flex h-16 items-center border-b px-6 transition-smooth">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-fast hover:scale-105">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold transition-fast">vLLM Dashboard</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1"
              )}
            >
              <item.icon className="h-4 w-4 transition-fast" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-4 transition-smooth">
        <div className="text-xs text-muted-foreground">
          <p className="transition-fast">Spark vLLM Dashboard</p>
          <p className="transition-fast">v1.0.0</p>
        </div>
      </div>
    </div>
  )
}
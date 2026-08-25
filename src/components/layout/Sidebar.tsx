"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Target, Activity, Ship, Map as MapIcon, FileText, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Detection", href: "/detection", icon: Target },
  { name: "Analysis", href: "/analysis", icon: Activity },
  { name: "Vessel Intelligence", href: "/vessels", icon: Ship },
  { name: "Maritime Map", href: "/map", icon: MapIcon },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 flex-col hidden md:flex border-r border-border bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
            <Target size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">OILWATCH AI</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">Maritime Intelligence</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon size={18} className={cn(isActive ? "text-primary" : "text-muted-foreground")} />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

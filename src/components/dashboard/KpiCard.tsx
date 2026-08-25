import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface KpiCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: string
  trendUp?: boolean
  description?: string
  className?: string
}

export function KpiCard({ title, value, icon: Icon, trend, trendUp, description, className }: KpiCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border/50", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(trend || description) && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend && (
              <span className={cn(
                "font-medium mr-1",
                trendUp ? "text-safe" : "text-destructive"
              )}>
                {trend}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

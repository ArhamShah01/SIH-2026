import { Incident } from "@/data/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock } from "lucide-react"
import Link from "next/link"

interface DetectionCardProps {
  incident: Incident
}

export function DetectionCard({ incident }: DetectionCardProps) {
  return (
    <Card className="overflow-hidden border-border/50 hover:border-primary/50 transition-colors">
      <Link href={`/analysis/${incident.id}`}>
        <div className="h-32 bg-secondary flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1582216515814-1e0413009bc2?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity mix-blend-luminosity"></div>
          {/* Simulated radar overlay */}
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
          <Badge className="absolute top-2 right-2 bg-black/60 text-white border-none">{incident.confidence} CONF</Badge>
          <div className="z-10 text-white font-mono text-sm tracking-wider bg-black/40 px-2 py-1 rounded">SAR_SCENE_DEMO</div>
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-primary">{incident.id}</h4>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin size={12} /> {incident.location?.lat}°, {incident.location?.lon}°
              </p>
            </div>
            <Badge variant={incident.severity === "CRITICAL" ? "destructive" : "warning"}>
              {incident.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Spill Area</p>
              <p className="font-medium">{incident.areaKm2?.toFixed(1) || 0} km²</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Acquired</p>
              <p className="font-medium flex items-center gap-1 text-xs">
                <Clock size={12} /> {new Date(incident.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

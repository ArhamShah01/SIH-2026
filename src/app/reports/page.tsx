import { api } from "@/lib/api/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Eye, ServerCrash } from "lucide-react"

export default async function ReportsPage() {
  const incidentsRes = await api.incidents.getAll()
  const isOffline = incidentsRes && 'error' in incidentsRes
  
  const incidents = !isOffline && Array.isArray(incidentsRes) ? incidentsRes : []
  
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {isOffline && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center gap-3">
          <ServerCrash size={20} />
          <div>
            <p className="font-semibold text-sm">Pipeline Offline</p>
            <p className="text-xs">Cannot fetch reports from the backend.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Incident Reports</h1>
          <p className="text-muted-foreground mt-1">
            Generated intelligence reports for detected spills.
          </p>
        </div>
        <Button className="gap-2" disabled={isOffline}>
          <FileText size={16} /> Generate New Report
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-xs border-b border-border font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">Report ID</th>
                  <th className="px-4 py-3.5 font-semibold">Incident</th>
                  <th className="px-4 py-3.5 font-semibold">Date</th>
                  <th className="px-4 py-3.5 font-semibold">Severity</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {incidents.map((incident, idx) => (
                  <tr key={incident.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-medium text-primary">
                      REP-{incident.id.split('-')[2] || incident.id}-00{idx + 1}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{incident.id}</td>
                    <td className="px-4 py-3">{new Date(incident.timestamp).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={incident.severity === "CRITICAL" ? "destructive" : "warning"}>
                        {incident.severity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-safe text-safe">Finalized</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Eye size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Download size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {incidents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      {isOffline ? "Awaiting data — Pipeline offline" : "No reports available."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

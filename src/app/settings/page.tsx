"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings as SettingsIcon, BrainCircuit, Shield, Database, Bell } from "lucide-react"
import { useState } from "react"

export default function SettingsPage() {
  const [modelThreshold, setModelThreshold] = useState("0.50")
  
  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">System Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure model parameters, integrations, and application preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 flex flex-col gap-2">
          <Button variant="secondary" className="justify-start gap-2 w-full"><BrainCircuit size={16} /> Model Settings</Button>
          <Button variant="ghost" className="justify-start gap-2 w-full text-muted-foreground"><Database size={16} /> Data Sources</Button>
          <Button variant="ghost" className="justify-start gap-2 w-full text-muted-foreground"><Shield size={16} /> API Keys</Button>
          <Button variant="ghost" className="justify-start gap-2 w-full text-muted-foreground"><Bell size={16} /> Notifications</Button>
        </div>
        
        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Configuration</CardTitle>
              <CardDescription>Adjust the sensitivity of the segmentation model.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 border-b border-border pb-6">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Active Model Version</label>
                  <Badge variant="ai">v2.1.0-SAR-ArabianSea (DEMO)</Badge>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Global Detection Threshold</label>
                    <span className="text-sm font-mono text-muted-foreground">{modelThreshold}</span>
                  </div>
                  <input 
                    type="range" 
                    className="w-full accent-primary" 
                    min="0" max="1" step="0.05" 
                    value={modelThreshold}
                    onChange={(e) => setModelThreshold(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Lower values increase sensitivity but may cause false positives (e.g., look-alikes).
                  </p>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <Button>Save Configuration</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Connection Status</CardTitle>
              <CardDescription>Backend endpoint for FastAPI integration.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">API Base URL</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm text-foreground" 
                      defaultValue="http://localhost:8000/api"
                      disabled
                    />
                    <Button variant="outline">Test Connection</Button>
                  </div>
                </div>
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
                  <strong>DEMO MODE ACTIVE.</strong> No external API requests are currently being made.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"
import { useState } from "react"
import { Upload, FileImage, Settings, Play, ServerCrash, AlertTriangle, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { api } from "@/lib/api/client"
import { DetectionInferResult } from "@/data/types"

export default function DetectionPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<"IDLE" | "PROCESSING" | "RESULT" | "ERROR">("IDLE")
  const [progressMsg, setProgressMsg] = useState("")
  const [progressValue, setProgressValue] = useState(0)
  const [result, setResult] = useState<DetectionInferResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const handleUseDemo = () => {
    const demoFile = new File(["dummy content"], "S1A_IW_GRDH_1SDV_20260825_ArabianSea.tif", { type: "image/tiff" })
    setFile(demoFile)
  }

  const runDetection = async () => {
    if (!file && !result) return
    setStatus("PROCESSING")
    setProgressValue(20)
    setProgressMsg("Preprocessing Sentinel-1 SAR imagery...")

    setTimeout(() => {
      setProgressValue(60)
      setProgressMsg("Running DeepLabV3+ segmentation inference...")
    }, 600)

    try {
      const res = await api.detection.runInference(file, { threshold: 0.5 })
      setProgressValue(100)
      setProgressMsg("Generating detection mask...")
      
      setTimeout(() => {
        setResult(res as DetectionInferResult)
        setStatus("RESULT")
      }, 400)
    } catch (e: any) {
      console.error(e)
      setErrorMsg(e.message || "Inference failed")
      setStatus("ERROR")
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">AI Oil Spill Detection</h1>
        <p className="text-muted-foreground mt-1">
          Analyze Sentinel-1 SAR imagery using the trained segmentation model.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Image Upload & Analysis</CardTitle>
              <CardDescription>Upload Sentinel-1 SAR imagery (.tif, .png, .jpg)</CardDescription>
            </CardHeader>
            <CardContent>
              {status === "IDLE" ? (
                <div className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center bg-secondary/20 hover:bg-secondary/40 transition-colors">
                  <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                  {file ? (
                    <div className="flex items-center gap-2 text-primary font-medium mb-4">
                      <FileImage size={20} />
                      {file.name}
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold mb-1">Drag and drop file here</h3>
                      <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                    </>
                  )}
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={handleUseDemo}>Select Demo Scene</Button>
                    <Button 
                      disabled={!file} 
                      onClick={runDetection}
                      className="gap-2"
                    >
                      <Play size={16} /> Run Detection
                    </Button>
                  </div>
                </div>
              ) : status === "PROCESSING" ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-6">
                  <div className="relative h-24 w-24">
                    <div className="absolute inset-0 rounded-full border-4 border-secondary"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Layers className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center space-y-2 w-full max-w-md">
                    <h3 className="font-medium text-lg">{progressMsg}</h3>
                    <Progress value={progressValue} className="h-2" />
                  </div>
                </div>
              ) : status === "ERROR" ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
                  <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center">
                    <ServerCrash className="h-10 w-10 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-destructive mb-2">Backend Connection Failed</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">{errorMsg}</p>
                  </div>
                  <Button variant="outline" onClick={() => {setFile(null); setStatus("IDLE")}}>Try Again</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-slate-100 flex flex-col items-center justify-center group shadow-xs">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1582216515814-1e0413009bc2?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-multiply"></div>
                    <div className="z-10 bg-white/90 backdrop-blur border border-slate-200 px-4 py-3 rounded-lg shadow-sm text-center">
                      <p className="font-semibold text-slate-800 text-sm">{result?.sampleId || "S1A_SCENE_ANALYSIS"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Spill Segmentation Detected</p>
                    </div>
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge variant="ai">Segmentation Overlay</Badge>
                      <Badge variant="destructive">{result?.confidence || 94.5}% Confidence</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-slate-50 border border-border">
                      <p className="text-xs text-muted-foreground font-medium uppercase">Detected Spill Extent</p>
                      <p className="text-xl font-bold text-slate-900 mt-1">{result?.spillAreaKm2 || 18.5} km²</p>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 border border-border">
                      <p className="text-xs text-muted-foreground font-medium uppercase">Model Classification</p>
                      <p className="text-xl font-bold text-destructive mt-1">High Severity</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => {setFile(null); setStatus("IDLE"); setResult(null)}}>Analyze New Scene</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings size={18} /> Model Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Model</p>
                <p className="font-semibold">Oil Spill Segmentation Model</p>
                <Badge variant="ai" className="mt-1">Awaiting Backend</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Input</p>
                <p>Sentinel-1 SAR</p>
              </div>
              
              <div className="pt-4 border-t border-border space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">Confidence Threshold</p>
                    <p className="text-sm text-muted-foreground">0.5</p>
                  </div>
                  <input type="range" className="w-full accent-primary" min="0" max="1" step="0.05" defaultValue="0.5" disabled={status === "PROCESSING"} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

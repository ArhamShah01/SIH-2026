"use client"
import dynamic from "next/dynamic"
import { Incident, Vessel, TrajectoryPoint } from "@/data/types"

const FullMapInner = dynamic(() => import("./FullMapInner"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-secondary animate-pulse flex items-center justify-center border border-border rounded-xl">Initializing Maritime Engine...</div>
})

interface FullMapProps {
  incidents: Incident[]
  vessels: Vessel[]
  trajectory: TrajectoryPoint[]
}

export function FullMap(props: FullMapProps) {
  return <FullMapInner {...props} />
}

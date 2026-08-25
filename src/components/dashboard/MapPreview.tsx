"use client"
import dynamic from "next/dynamic"
import { Incident } from "@/data/types"

const MapPreviewInner = dynamic(() => import("./MapPreviewInner"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-secondary animate-pulse flex items-center justify-center">Loading map...</div>
})

export function MapPreview({ incidents }: { incidents: Incident[] }) {
  return (
    <div className="h-full w-full relative">
      <MapPreviewInner incidents={incidents} />
      <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur border border-border text-foreground text-xs px-2.5 py-1 rounded-md shadow-xs font-semibold tracking-wider">
        MARITIME OVERVIEW
      </div>
    </div>
  )
}

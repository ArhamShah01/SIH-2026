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
      <div className="absolute top-2 left-2 z-10 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded">
        MARITIME OVERVIEW
      </div>
    </div>
  )
}

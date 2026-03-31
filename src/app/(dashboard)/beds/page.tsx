'use client'

import { BedDouble } from 'lucide-react'
import BedMap from '@/components/beds/bed-map'

export default function BedsPage() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <BedDouble className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Bed Map</h1>
          <p className="text-xs text-slate-500">Tap any bed to see details or check-in</p>
        </div>
      </div>
      <BedMap />
    </div>
  )
}

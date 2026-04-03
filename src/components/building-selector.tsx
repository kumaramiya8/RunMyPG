'use client'

import { useState } from 'react'
import { Building2, ChevronDown, Check, LayoutGrid } from 'lucide-react'
import { useBuilding } from '@/lib/building-context'

export default function BuildingSelector() {
  const { selectedBuildingId, selectedBuildingName, availableBuildings, selectBuilding } = useBuilding()
  const [open, setOpen] = useState(false)

  if (availableBuildings.length <= 1) {
    // Single building or none — show building name but no dropdown
    return (
      <div className="px-3 py-2 mx-3 mb-2 rounded-lg bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-medium text-slate-600 truncate">
            {availableBuildings[0]?.name || 'No property added'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative mx-3 mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
      >
        {selectedBuildingId ? (
          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
        ) : (
          <LayoutGrid className="w-3.5 h-3.5 text-primary shrink-0" />
        )}
        <span className="text-xs font-medium text-slate-700 truncate flex-1 text-left">
          {selectedBuildingName || 'All Properties'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
            {/* All Properties option */}
            <button
              onClick={() => { selectBuilding(null); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-700 flex-1 text-left">All Properties</span>
              {!selectedBuildingId && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>

            <div className="border-t border-slate-100" />

            {/* Individual buildings */}
            {availableBuildings.map((building) => (
              <button
                key={building.id}
                onClick={() => { selectBuilding(building.id); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <div className="flex-1 text-left">
                  <span className="text-xs font-medium text-slate-700">{building.name}</span>
                  {building.address && (
                    <p className="text-[9px] text-slate-400 truncate">{building.address}</p>
                  )}
                </div>
                {selectedBuildingId === building.id && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Compact version for mobile header
export function BuildingSelectorCompact() {
  const { selectedBuildingId, selectedBuildingName, availableBuildings, selectBuilding } = useBuilding()
  const [open, setOpen] = useState(false)

  const displayName = selectedBuildingName || 'All Properties'

  if (availableBuildings.length <= 1) {
    return (
      <p className="text-[10px] text-slate-400 font-medium">
        {availableBuildings[0]?.name || 'No property'}
      </p>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-0.5 text-[10px] text-primary font-medium"
      >
        {displayName}
        <ChevronDown className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-lg shadow-lg border border-slate-200 min-w-[200px] overflow-hidden">
            <button
              onClick={() => { selectBuilding(null); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-xs text-slate-700"
            >
              <LayoutGrid className="w-3 h-3 text-slate-400" />
              All Properties
              {!selectedBuildingId && <Check className="w-3 h-3 text-primary ml-auto" />}
            </button>
            {availableBuildings.map((b) => (
              <button
                key={b.id}
                onClick={() => { selectBuilding(b.id); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-xs text-slate-700"
              >
                <Building2 className="w-3 h-3 text-slate-400" />
                {b.name}
                {selectedBuildingId === b.id && <Check className="w-3 h-3 text-primary ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

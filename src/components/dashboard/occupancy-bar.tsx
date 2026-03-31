'use client'

interface OccupancyBarProps {
  occupied: number
  vacant: number
  notice: number
  blocked: number
}

export default function OccupancyBar({ occupied, vacant, notice, blocked }: OccupancyBarProps) {
  const total = occupied + vacant + notice + blocked
  if (total === 0) return null

  const pctOccupied = (occupied / total) * 100
  const pctNotice = (notice / total) * 100
  const pctBlocked = (blocked / total) * 100
  const pctVacant = (vacant / total) * 100

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900">Bed Occupancy</h3>
        <span className="text-xs font-bold text-primary">
          {Math.round(pctOccupied)}% Full
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
        {pctOccupied > 0 && (
          <div
            className="bg-red-400 transition-all duration-500"
            style={{ width: `${pctOccupied}%` }}
          />
        )}
        {pctNotice > 0 && (
          <div
            className="bg-amber-400 transition-all duration-500"
            style={{ width: `${pctNotice}%` }}
          />
        )}
        {pctBlocked > 0 && (
          <div
            className="bg-slate-400 transition-all duration-500"
            style={{ width: `${pctBlocked}%` }}
          />
        )}
        {pctVacant > 0 && (
          <div
            className="bg-emerald-400 transition-all duration-500"
            style={{ width: `${pctVacant}%` }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        <LegendItem color="bg-red-400" label="Occupied" count={occupied} />
        <LegendItem color="bg-emerald-400" label="Vacant" count={vacant} />
        <LegendItem color="bg-amber-400" label="Notice" count={notice} />
        <LegendItem color="bg-slate-400" label="Blocked" count={blocked} />
      </div>
    </div>
  )
}

function LegendItem({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-[11px] text-slate-500 font-medium">{label}</span>
      <span className="text-[11px] text-slate-900 font-bold">{count}</span>
    </div>
  )
}

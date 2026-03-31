'use client'

import { useState } from 'react'
import {
  Bed,
  ChevronDown,
  User,
  Calendar,
  IndianRupee,
  X,
  UserPlus,
  Clock,
  AlertTriangle,
  Snowflake,
  Bath,
  Sun,
  Tv,
  Building2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { getFullPropertyTree } from '@/lib/services/property'
import { getActiveOccupancies } from '@/lib/services/tenants'
import { ListSkeleton, EmptyState } from '@/components/loading-skeleton'
import type { Bed as BedType, BedStatus, Floor, Room, Occupancy, Tenant } from '@/lib/types'

// ── Status config ───────────────────────────────────────────────────

const statusConfig: Record<BedStatus, { bg: string; label: string; dotColor: string }> = {
  occupied: { bg: 'bg-red-100 border-red-200', label: 'Occupied', dotColor: 'bg-red-400' },
  vacant: { bg: 'bg-emerald-100 border-emerald-200', label: 'Vacant', dotColor: 'bg-emerald-400' },
  notice: { bg: 'bg-amber-100 border-amber-200', label: 'Notice', dotColor: 'bg-amber-400' },
  blocked: { bg: 'bg-slate-200 border-slate-300', label: 'Blocked', dotColor: 'bg-slate-400' },
  maintenance: { bg: 'bg-orange-100 border-orange-200', label: 'Maintenance', dotColor: 'bg-orange-400' },
}

// ── Types for occupancy with joined data ────────────────────────────

interface OccupancyWithJoins extends Occupancy {
  tenant: Tenant
  bed: BedType & { room: Room }
}

// ── Bed Detail Sheet ────────────────────────────────────────────────

function BedDetailSheet({
  bed,
  rooms,
  occupancies,
  onClose,
}: {
  bed: BedType
  rooms: Room[]
  occupancies: OccupancyWithJoins[]
  onClose: () => void
}) {
  const occupancy = occupancies.find((o) => o.bed_id === bed.id)
  const tenant = occupancy?.tenant
  const room = rooms.find((r) => r.id === bed.room_id)
  const config = statusConfig[bed.status]

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {room?.name} &mdash; {bed.bed_number}
            </h3>
            <span className={`inline-flex items-center gap-1.5 mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${config.bg}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
              {config.label}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Room info */}
          {room && (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">Room Details</p>
              <div className="flex flex-wrap gap-2">
                {room.has_ac && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-[11px] font-medium text-blue-600">
                    <Snowflake className="w-3 h-3" /> AC
                  </span>
                )}
                {room.has_attached_bathroom && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-50 text-[11px] font-medium text-cyan-600">
                    <Bath className="w-3 h-3" /> Attached Bath
                  </span>
                )}
                {room.has_balcony && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-50 text-[11px] font-medium text-yellow-600">
                    <Sun className="w-3 h-3" /> Balcony
                  </span>
                )}
                {room.has_tv && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 text-[11px] font-medium text-purple-600">
                    <Tv className="w-3 h-3" /> TV
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Rent: <span className="font-bold text-slate-700">₹{bed.monthly_rent?.toLocaleString('en-IN')}/month</span>
              </p>
            </div>
          )}

          {/* Tenant info */}
          {tenant && occupancy ? (
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-500 mb-2">Current Tenant</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {tenant.full_name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{tenant.full_name}</p>
                  <p className="text-[11px] text-slate-500">{tenant.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-white rounded-lg p-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                    <Calendar className="w-2.5 h-2.5" /> Check-in
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    {new Date(occupancy.checkin_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                    <IndianRupee className="w-2.5 h-2.5" /> Monthly Rent
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    ₹{occupancy.monthly_rent.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                    <Clock className="w-2.5 h-2.5" /> Due Day
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    {occupancy.rent_due_day}{ordinal(occupancy.rent_due_day)} of month
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5">
                    <IndianRupee className="w-2.5 h-2.5" /> Deposit
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    ₹{occupancy.deposit_amount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              {occupancy.status === 'notice_period' && (
                <div className="mt-2 flex items-center gap-2 bg-amber-50 rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <p className="text-[11px] text-amber-700 font-medium">
                    On notice — vacating by {occupancy.expected_vacate_date}
                  </p>
                </div>
              )}
            </div>
          ) : bed.status === 'vacant' ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-slate-700">Bed is available</p>
              <p className="text-xs text-slate-400 mt-1">Ready for new check-in or advance booking</p>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all">
                  Check In
                </button>
                <button className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-200 active:scale-[0.98] transition-all">
                  Book Advance
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500">This bed is currently {bed.status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

// ── Main Bed Map ────────────────────────────────────────────────────

export default function BedMap() {
  const { orgId } = useAuth()
  const [selectedBed, setSelectedBed] = useState<BedType | null>(null)
  const [filterStatus, setFilterStatus] = useState<BedStatus | 'all'>('all')

  const { data: property, loading: propertyLoading } = useQuery(
    () => getFullPropertyTree(orgId!),
    [orgId]
  )

  const { data: occupancies, loading: occupanciesLoading } = useQuery(
    () => getActiveOccupancies(orgId!),
    [orgId]
  )

  const loading = propertyLoading || occupanciesLoading

  if (loading) {
    return <ListSkeleton rows={6} />
  }

  const floors = property?.floors ?? []
  const rooms = property?.rooms ?? []
  const beds = property?.beds ?? []
  const activeOccupancies = (occupancies ?? []) as OccupancyWithJoins[]

  if (floors.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No property set up yet"
        description="Go to Property Setup to add buildings."
      />
    )
  }

  // Compute stats from real data
  const stats = {
    total: beds.length,
    occupied: beds.filter((b) => b.status === 'occupied').length,
    vacant: beds.filter((b) => b.status === 'vacant').length,
    notice: beds.filter((b) => b.status === 'notice').length,
    blocked: beds.filter((b) => b.status === 'blocked').length,
  }

  const filteredBeds = (roomId: string) => {
    const roomBeds = beds.filter((b) => b.room_id === roomId)
    if (filterStatus === 'all') return roomBeds
    return roomBeds.filter((b) => b.status === filterStatus)
  }

  const getTenantForBed = (bedId: string) => {
    const occ = activeOccupancies.find((o) => o.bed_id === bedId)
    return occ?.tenant ?? null
  }

  return (
    <>
      {/* Stats bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 scroll-touch -mx-4 px-4 md:mx-0 md:px-0">
        {[
          { key: 'all' as const, label: 'All', count: stats.total, color: 'bg-slate-100 text-slate-700' },
          { key: 'occupied' as const, label: 'Occupied', count: stats.occupied, color: 'bg-red-50 text-red-600' },
          { key: 'vacant' as const, label: 'Vacant', count: stats.vacant, color: 'bg-emerald-50 text-emerald-600' },
          { key: 'notice' as const, label: 'Notice', count: stats.notice, color: 'bg-amber-50 text-amber-600' },
          { key: 'blocked' as const, label: 'Blocked', count: stats.blocked, color: 'bg-slate-100 text-slate-500' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilterStatus(item.key)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
              filterStatus === item.key
                ? 'ring-2 ring-primary/30 ' + item.color
                : item.color + ' opacity-60 hover:opacity-100'
            }`}
          >
            {item.label}
            <span className="font-bold">{item.count}</span>
          </button>
        ))}
      </div>

      {/* Floor sections */}
      <div className="space-y-4 mt-4">
        {floors.map((floor) => {
          const floorRooms = rooms.filter((r) => r.floor_id === floor.id)
          const hasVisibleBeds = floorRooms.some((r) => filteredBeds(r.id).length > 0)
          if (!hasVisibleBeds && filterStatus !== 'all') return null

          return (
            <div key={floor.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Floor header */}
              <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">{floor.name}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{floorRooms.length} rooms</p>
              </div>

              {/* Rooms grid */}
              <div className="p-3 space-y-3">
                {floorRooms.map((room) => {
                  const roomBeds = filteredBeds(room.id)
                  if (roomBeds.length === 0 && filterStatus !== 'all') return null

                  return (
                    <div key={room.id}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-slate-700">{room.name}</span>
                        <div className="flex gap-1">
                          {room.has_ac && <Snowflake className="w-3 h-3 text-blue-400" />}
                          {room.has_attached_bathroom && <Bath className="w-3 h-3 text-cyan-400" />}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {roomBeds.map((bed) => {
                          const tenant = getTenantForBed(bed.id)
                          const cfg = statusConfig[bed.status as BedStatus] || statusConfig.vacant
                          return (
                            <button
                              key={bed.id}
                              onClick={() => setSelectedBed(bed)}
                              className={`relative w-[72px] h-[72px] md:w-20 md:h-20 rounded-xl border-2 ${cfg.bg} flex flex-col items-center justify-center gap-0.5 hover:scale-105 active:scale-95 transition-all`}
                            >
                              <Bed className="w-5 h-5 text-slate-600" />
                              <span className="text-[9px] font-bold text-slate-600 leading-none">
                                {bed.bed_number.replace('Bed ', '')}
                              </span>
                              {tenant && (
                                <span className="text-[8px] font-medium text-slate-500 truncate max-w-[60px] leading-none">
                                  {tenant.full_name.split(' ')[0]}
                                </span>
                              )}
                              <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${cfg.dotColor}`} />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
        <div className="flex flex-wrap gap-3 justify-center">
          {Object.entries(statusConfig).map(([status, cfg]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${cfg.dotColor}`} />
              <span className="text-[11px] text-slate-500 font-medium capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bed detail sheet */}
      {selectedBed && (
        <BedDetailSheet
          bed={selectedBed}
          rooms={rooms}
          occupancies={activeOccupancies}
          onClose={() => setSelectedBed(null)}
        />
      )}
    </>
  )
}

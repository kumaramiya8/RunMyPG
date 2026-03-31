'use client'

import { useState } from 'react'
import {
  Building2,
  Plus,
  ChevronDown,
  ChevronRight,
  Bed,
  Snowflake,
  Bath,
  Tv,
  Sun,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react'
import {
  mockBuilding,
  mockFloors,
  mockRooms,
  mockBeds,
} from '@/lib/mock-data'

// ── Add Building Modal ──────────────────────────────────────────────

function AddBuildingModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Add Building</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Building Name</label>
            <input
              type="text"
              placeholder="e.g., Block B, Main Building"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Address</label>
            <input
              type="text"
              placeholder="Full address"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">City</label>
            <input
              type="text"
              placeholder="City name"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <button className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all">
            Create Building
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Floor Modal ─────────────────────────────────────────────────

function AddFloorModal({ buildingName, onClose }: { buildingName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Add Floor to {buildingName}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Floor Name</label>
            <input
              type="text"
              placeholder="e.g., Ground Floor, 1st Floor"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Floor Number</label>
            <input
              type="number"
              placeholder="0"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <button className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all">
            Add Floor
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Room Modal ──────────────────────────────────────────────────

function AddRoomModal({ floorName, onClose }: { floorName: string; onClose: () => void }) {
  const [bedCount, setBedCount] = useState(3)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Add Room to {floorName}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Room Number</label>
            <input
              type="text"
              placeholder="e.g., 101, 202"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Base Monthly Rent (per bed)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
              <input
                type="number"
                placeholder="7000"
                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Room Amenities</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'ac', label: 'AC', icon: Snowflake },
                { key: 'bathroom', label: 'Attached Bath', icon: Bath },
                { key: 'balcony', label: 'Balcony', icon: Sun },
                { key: 'tv', label: 'TV', icon: Tv },
              ].map((amenity) => (
                <label
                  key={amenity.key}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors"
                >
                  <input type="checkbox" className="sr-only" />
                  <amenity.icon className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-700">{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Number of Beds</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBedCount(Math.max(1, bedCount - 1))}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100"
              >
                -
              </button>
              <span className="text-2xl font-bold text-slate-900 w-10 text-center">{bedCount}</span>
              <button
                onClick={() => setBedCount(Math.min(8, bedCount + 1))}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-lg font-bold text-slate-600 hover:bg-slate-50 active:bg-slate-100"
              >
                +
              </button>
              <div className="flex-1">
                <div className="flex gap-1">
                  {Array.from({ length: bedCount }, (_, i) => (
                    <div key={i} className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center">
                      <Bed className="w-3 h-3 text-emerald-600" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all mt-2">
            Add Room with {bedCount} Bed{bedCount > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Room Amenity Chips ──────────────────────────────────────────────

function AmenityChip({ icon: Icon, label }: { icon: typeof Snowflake; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-500">
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  )
}

// ── Main Component ──────────────────────────────────────────────────

export default function BuildingSetup() {
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set(['f1', 'f2']))
  const [showAddBuilding, setShowAddBuilding] = useState(false)
  const [showAddFloor, setShowAddFloor] = useState(false)
  const [addRoomFloor, setAddRoomFloor] = useState<string | null>(null)

  const toggleFloor = (floorId: string) => {
    setExpandedFloors((prev) => {
      const next = new Set(prev)
      if (next.has(floorId)) next.delete(floorId)
      else next.add(floorId)
      return next
    })
  }

  const floorRooms = (floorId: string) => mockRooms.filter((r) => r.floor_id === floorId)
  const roomBeds = (roomId: string) => mockBeds.filter((b) => b.room_id === roomId)

  const statusColor: Record<string, string> = {
    vacant: 'bg-emerald-400',
    occupied: 'bg-red-400',
    notice: 'bg-amber-400',
    blocked: 'bg-slate-400',
    maintenance: 'bg-orange-400',
  }

  return (
    <>
      {/* Building Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Building Header */}
        <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{mockBuilding.name}</h3>
                <p className="text-[11px] text-slate-500">{mockBuilding.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button className="p-2 rounded-lg hover:bg-white/80 active:bg-slate-100 transition-colors">
                <Pencil className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 ml-11">
            <span className="text-[11px] text-slate-500 font-medium">
              {mockFloors.length} Floors
            </span>
            <span className="text-slate-300">&#183;</span>
            <span className="text-[11px] text-slate-500 font-medium">
              {mockRooms.length} Rooms
            </span>
            <span className="text-slate-300">&#183;</span>
            <span className="text-[11px] text-slate-500 font-medium">
              {mockBeds.length} Beds
            </span>
          </div>
        </div>

        {/* Floors List */}
        <div className="divide-y divide-slate-50">
          {mockFloors.map((floor) => {
            const rooms = floorRooms(floor.id)
            const totalBeds = rooms.reduce((sum, r) => sum + roomBeds(r.id).length, 0)
            const isExpanded = expandedFloors.has(floor.id)

            return (
              <div key={floor.id}>
                {/* Floor Header */}
                <button
                  onClick={() => toggleFloor(floor.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 active:bg-slate-100 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <div className="flex-1 text-left">
                    <span className="text-sm font-semibold text-slate-800">{floor.name}</span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      {rooms.length} rooms &middot; {totalBeds} beds
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setAddRoomFloor(floor.name) }}
                    className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary" />
                  </button>
                </button>

                {/* Rooms within floor */}
                {isExpanded && (
                  <div className="px-4 pb-3 pl-11 space-y-2">
                    {rooms.map((room) => {
                      const beds = roomBeds(room.id)
                      return (
                        <div
                          key={room.id}
                          className="bg-slate-50/80 rounded-xl p-3 border border-slate-100/80"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800">
                                {room.name}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400">
                                ₹{room.base_rent?.toLocaleString('en-IN')}/bed
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button className="p-1 rounded hover:bg-white transition-colors">
                                <Pencil className="w-3 h-3 text-slate-400" />
                              </button>
                              <button className="p-1 rounded hover:bg-white transition-colors">
                                <Trash2 className="w-3 h-3 text-slate-300 hover:text-red-400" />
                              </button>
                            </div>
                          </div>

                          {/* Amenity tags */}
                          <div className="flex flex-wrap gap-1 mb-2">
                            {room.has_ac && <AmenityChip icon={Snowflake} label="AC" />}
                            {room.has_attached_bathroom && <AmenityChip icon={Bath} label="Attached" />}
                            {room.has_balcony && <AmenityChip icon={Sun} label="Balcony" />}
                            {room.has_tv && <AmenityChip icon={Tv} label="TV" />}
                            {!room.has_ac && !room.has_attached_bathroom && !room.has_balcony && !room.has_tv && (
                              <span className="text-[10px] text-slate-400">No amenities</span>
                            )}
                          </div>

                          {/* Beds row */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 mr-1">Beds:</span>
                            {beds.map((bed) => (
                              <div
                                key={bed.id}
                                className="group relative"
                                title={`${bed.bed_number} — ${bed.status}`}
                              >
                                <div
                                  className={`w-7 h-7 rounded-lg ${statusColor[bed.status]} flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}
                                >
                                  <Bed className="w-3 h-3 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Add Floor Button */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={() => setShowAddFloor(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-400 hover:border-primary hover:text-primary active:bg-primary/5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Floor
          </button>
        </div>
      </div>

      {/* Add New Building Button */}
      <button
        onClick={() => setShowAddBuilding(true)}
        className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-400 hover:border-primary hover:text-primary active:bg-primary/5 transition-all"
      >
        <Plus className="w-5 h-5" />
        Add Another Building
      </button>

      {/* Modals */}
      {showAddBuilding && <AddBuildingModal onClose={() => setShowAddBuilding(false)} />}
      {showAddFloor && <AddFloorModal buildingName={mockBuilding.name} onClose={() => setShowAddFloor(false)} />}
      {addRoomFloor && <AddRoomModal floorName={addRoomFloor} onClose={() => setAddRoomFloor(null)} />}
    </>
  )
}

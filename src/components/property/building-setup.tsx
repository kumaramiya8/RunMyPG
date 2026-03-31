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
  Copy,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery, useMutation } from '@/lib/hooks/use-query'
import { getFullPropertyTree, createBuilding, createFloor, createRoom } from '@/lib/services/property'
import { ListSkeleton, EmptyState } from '@/components/loading-skeleton'

// ── Add Building Modal ──────────────────────────────────────────────

function AddBuildingModal({ onClose, onSave }: { onClose: () => void; onSave: (name: string, address: string, city: string) => void }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')

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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Address</label>
            <input
              type="text"
              placeholder="Full address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">City</label>
            <input
              type="text"
              placeholder="City name"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <button
            onClick={() => { if (name) onSave(name, address, city) }}
            disabled={!name}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-40"
          >
            Create Building
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Floor Modal ─────────────────────────────────────────────────

function AddFloorModal({ buildingName, onClose, onSave }: { buildingName: string; onClose: () => void; onSave: (name: string, floorNumber: number) => void }) {
  const [name, setName] = useState('')
  const [floorNumber, setFloorNumber] = useState(0)

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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Floor Number</label>
            <input
              type="number"
              placeholder="0"
              value={floorNumber}
              onChange={(e) => setFloorNumber(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <button
            onClick={() => { if (name) onSave(name, floorNumber) }}
            disabled={!name}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-40"
          >
            Add Floor
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Copy Floor Modal ────────────────────────────────────────────────

function CopyFloorModal({
  sourceFloorName,
  onClose,
  onSave,
  isCopying,
}: {
  sourceFloorName: string
  onClose: () => void
  onSave: (name: string, floorNumber: number) => void
  isCopying: boolean
}) {
  const [name, setName] = useState('')
  const [floorNumber, setFloorNumber] = useState(0)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={isCopying ? undefined : onClose}>
      <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Copy Floor</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Copying all rooms and beds from <span className="font-semibold text-slate-700">{sourceFloorName}</span>
            </p>
          </div>
          <button onClick={onClose} disabled={isCopying} className="p-1 rounded-full hover:bg-slate-100 disabled:opacity-40">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">New Floor Name</label>
            <input
              type="text"
              placeholder="e.g., 3rd Floor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCopying}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">New Floor Number</label>
            <input
              type="number"
              placeholder="0"
              value={floorNumber}
              onChange={(e) => setFloorNumber(parseInt(e.target.value) || 0)}
              disabled={isCopying}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
            />
          </div>
          <button
            onClick={() => { if (name) onSave(name, floorNumber) }}
            disabled={!name || isCopying}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isCopying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Copying Floor...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Floor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Room Modal ──────────────────────────────────────────────────

function AddRoomModal({ floorName, onClose, onSave }: { floorName: string; onClose: () => void; onSave: (roomNumber: string, opts: { hasAc: boolean; hasAttachedBathroom: boolean; hasBalcony: boolean; hasTv: boolean; baseRent: number; bedCount: number }) => void }) {
  const [roomNumber, setRoomNumber] = useState('')
  const [baseRent, setBaseRent] = useState(7000)
  const [bedCount, setBedCount] = useState(3)
  const [amenities, setAmenities] = useState({ ac: false, bathroom: false, balcony: false, tv: false })

  const toggleAmenity = (key: keyof typeof amenities) => {
    setAmenities((prev) => ({ ...prev, [key]: !prev[key] }))
  }

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
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Base Monthly Rent (per bed)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">&#8377;</span>
              <input
                type="number"
                placeholder="7000"
                value={baseRent}
                onChange={(e) => setBaseRent(parseInt(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Room Amenities</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'ac' as const, label: 'AC', icon: Snowflake },
                { key: 'bathroom' as const, label: 'Attached Bath', icon: Bath },
                { key: 'balcony' as const, label: 'Balcony', icon: Sun },
                { key: 'tv' as const, label: 'TV', icon: Tv },
              ].map((amenity) => (
                <label
                  key={amenity.key}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer hover:bg-slate-50 transition-colors ${
                    amenities[amenity.key] ? 'border-primary bg-primary/5' : 'border-slate-200'
                  }`}
                  onClick={() => toggleAmenity(amenity.key)}
                >
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

          <button
            onClick={() => { if (roomNumber) onSave(roomNumber, { hasAc: amenities.ac, hasAttachedBathroom: amenities.bathroom, hasBalcony: amenities.balcony, hasTv: amenities.tv, baseRent, bedCount }) }}
            disabled={!roomNumber}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all mt-2 disabled:opacity-40"
          >
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
  const { orgId } = useAuth()
  const { data: tree, loading, error, refetch } = useQuery(
    () => getFullPropertyTree(orgId!),
    [orgId]
  )

  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set())
  const [showAddBuilding, setShowAddBuilding] = useState(false)
  const [showAddFloor, setShowAddFloor] = useState<string | null>(null) // buildingId
  const [addRoomFloor, setAddRoomFloor] = useState<{ floorId: string; floorName: string } | null>(null)
  const [copyFloorSource, setCopyFloorSource] = useState<{ floorId: string; floorName: string; buildingId: string } | null>(null)
  const [isCopyingFloor, setIsCopyingFloor] = useState(false)

  const createBuildingMut = useMutation(createBuilding)
  const createFloorMut = useMutation(createFloor)
  const createRoomMut = useMutation(createRoom)

  const toggleFloor = (floorId: string) => {
    setExpandedFloors((prev) => {
      const next = new Set(prev)
      if (next.has(floorId)) next.delete(floorId)
      else next.add(floorId)
      return next
    })
  }

  if (!orgId) return null

  if (loading) return <ListSkeleton rows={4} />
  if (error) return <div className="text-center py-10"><p className="text-sm text-red-500">Error: {error}</p></div>

  const buildings = tree?.buildings || []
  const floors = tree?.floors || []
  const rooms = tree?.rooms || []
  const beds = tree?.beds || []

  const floorRooms = (floorId: string) => rooms.filter((r: any) => r.floor_id === floorId)
  const roomBeds = (roomId: string) => beds.filter((b: any) => b.room_id === roomId)
  const buildingFloors = (buildingId: string) => floors.filter((f: any) => f.building_id === buildingId)

  const statusColor: Record<string, string> = {
    vacant: 'bg-emerald-400',
    occupied: 'bg-red-400',
    notice: 'bg-amber-400',
    blocked: 'bg-slate-400',
    maintenance: 'bg-orange-400',
  }

  const handleCreateBuilding = async (name: string, address: string, city: string) => {
    await createBuildingMut.mutate(orgId, name, address || undefined, city || undefined)
    setShowAddBuilding(false)
    refetch()
  }

  const handleCreateFloor = async (buildingId: string, name: string, floorNumber: number) => {
    await createFloorMut.mutate(buildingId, name, floorNumber)
    setShowAddFloor(null)
    refetch()
  }

  const handleCreateRoom = async (floorId: string, roomNumber: string, opts: { hasAc: boolean; hasAttachedBathroom: boolean; hasBalcony: boolean; hasTv: boolean; baseRent: number; bedCount: number }) => {
    await createRoomMut.mutate(floorId, roomNumber, opts)
    setAddRoomFloor(null)
    refetch()
  }

  const handleCopyFloor = async (buildingId: string, sourceFloorId: string, newFloorName: string, newFloorNumber: number) => {
    setIsCopyingFloor(true)
    try {
      // 1. Create the new floor
      const newFloor = await createFloor(buildingId, newFloorName, newFloorNumber)

      // 2. Get rooms on the source floor
      const sourceRooms = rooms.filter((r: any) => r.floor_id === sourceFloorId)

      // 3. For each room, create a copy on the new floor with same config
      for (const room of sourceRooms) {
        const bedCount = beds.filter((b: any) => b.room_id === room.id).length
        await createRoom(newFloor.id, room.room_number, {
          hasAc: room.has_ac || false,
          hasAttachedBathroom: room.has_attached_bathroom || false,
          hasBalcony: room.has_balcony || false,
          hasTv: room.has_tv || false,
          baseRent: room.base_rent || 0,
          bedCount: bedCount || 1,
        })
      }

      setCopyFloorSource(null)
      refetch()
    } catch (err) {
      console.error('Failed to copy floor:', err)
      alert('Failed to copy floor. Please try again.')
    } finally {
      setIsCopyingFloor(false)
    }
  }

  if (buildings.length === 0) {
    return (
      <>
        <EmptyState icon={Building2} title="No Buildings Yet" description="Add your first building to get started" />
        <button
          onClick={() => setShowAddBuilding(true)}
          className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-400 hover:border-primary hover:text-primary active:bg-primary/5 transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Building
        </button>
        {showAddBuilding && <AddBuildingModal onClose={() => setShowAddBuilding(false)} onSave={handleCreateBuilding} />}
      </>
    )
  }

  return (
    <>
      {buildings.map((building: any) => {
        const bFloors = buildingFloors(building.id)
        const bRooms = rooms.filter((r: any) => bFloors.some((f: any) => f.id === r.floor_id))
        const bBeds = beds.filter((b: any) => bRooms.some((r: any) => r.id === b.room_id))

        return (
          <div key={building.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
            {/* Building Header */}
            <div className="p-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{building.name}</h3>
                    <p className="text-[11px] text-slate-500">{building.address}</p>
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
                  {bFloors.length} Floors
                </span>
                <span className="text-slate-300">&#183;</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {bRooms.length} Rooms
                </span>
                <span className="text-slate-300">&#183;</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {bBeds.length} Beds
                </span>
              </div>
            </div>

            {/* Floors List */}
            <div className="divide-y divide-slate-50">
              {bFloors.map((floor: any) => {
                const fRooms = floorRooms(floor.id)
                const totalBeds = fRooms.reduce((sum: number, r: any) => sum + roomBeds(r.id).length, 0)
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
                          {fRooms.length} rooms &middot; {totalBeds} beds
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCopyFloorSource({ floorId: floor.id, floorName: floor.name, buildingId: building.id }) }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors mr-1"
                        title="Copy floor"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setAddRoomFloor({ floorId: floor.id, floorName: floor.name }) }}
                        className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary" />
                      </button>
                    </button>

                    {/* Rooms within floor */}
                    {isExpanded && (
                      <div className="px-4 pb-3 pl-11 space-y-2">
                        {fRooms.map((room: any) => {
                          const rBeds = roomBeds(room.id)
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
                                    &#8377;{room.base_rent?.toLocaleString('en-IN')}/bed
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
                                {rBeds.map((bed: any) => (
                                  <div
                                    key={bed.id}
                                    className="group relative"
                                    title={`${bed.bed_number} - ${bed.status}`}
                                  >
                                    <div
                                      className={`w-7 h-7 rounded-lg ${statusColor[bed.status] || 'bg-slate-300'} flex items-center justify-center cursor-pointer hover:scale-110 transition-transform`}
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
                onClick={() => setShowAddFloor(building.id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-400 hover:border-primary hover:text-primary active:bg-primary/5 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Floor
              </button>
            </div>
          </div>
        )
      })}

      {/* Add New Building Button */}
      <button
        onClick={() => setShowAddBuilding(true)}
        className="w-full mt-4 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-sm font-semibold text-slate-400 hover:border-primary hover:text-primary active:bg-primary/5 transition-all"
      >
        <Plus className="w-5 h-5" />
        Add Another Building
      </button>

      {/* Modals */}
      {showAddBuilding && (
        <AddBuildingModal
          onClose={() => setShowAddBuilding(false)}
          onSave={handleCreateBuilding}
        />
      )}
      {showAddFloor && (
        <AddFloorModal
          buildingName={buildings.find((b: any) => b.id === showAddFloor)?.name || ''}
          onClose={() => setShowAddFloor(null)}
          onSave={(name, floorNumber) => handleCreateFloor(showAddFloor, name, floorNumber)}
        />
      )}
      {addRoomFloor && (
        <AddRoomModal
          floorName={addRoomFloor.floorName}
          onClose={() => setAddRoomFloor(null)}
          onSave={(roomNumber, opts) => handleCreateRoom(addRoomFloor.floorId, roomNumber, opts)}
        />
      )}
      {copyFloorSource && (
        <CopyFloorModal
          sourceFloorName={copyFloorSource.floorName}
          onClose={() => { if (!isCopyingFloor) setCopyFloorSource(null) }}
          onSave={(name, floorNumber) => handleCopyFloor(copyFloorSource.buildingId, copyFloorSource.floorId, name, floorNumber)}
          isCopying={isCopyingFloor}
        />
      )}
    </>
  )
}

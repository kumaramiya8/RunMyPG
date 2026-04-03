import { supabase } from '../supabase'

export async function getBuildings(orgId: string) {
  const { data, error } = await supabase
    .from('buildings')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function getFloors(buildingId: string) {
  const { data, error } = await supabase
    .from('floors')
    .select('*')
    .eq('building_id', buildingId)
    .order('floor_number')
  if (error) throw error
  return data
}

export async function getRooms(floorId: string) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('floor_id', floorId)
    .order('room_number')
  if (error) throw error
  return data
}

export async function getBeds(roomId: string) {
  const { data, error } = await supabase
    .from('beds')
    .select('*')
    .eq('room_id', roomId)
    .order('bed_number')
  if (error) throw error
  return data
}

// ── Building entity IDs helper ─────────────────────────────────────

export async function getBuildingEntityIds(buildingId: string) {
  const { data } = await supabase.rpc('get_building_entity_ids', { p_building_id: buildingId })
  return data as { floor_ids: string[]; room_ids: string[]; bed_ids: string[] } | null
}

// ── Full property tree ─────────────────────────────────────────────

export async function getFullPropertyTree(orgId: string, buildingId?: string | null) {
  let buildingsQuery = supabase
    .from('buildings')
    .select('*')
    .eq('org_id', orgId)

  if (buildingId) {
    buildingsQuery = buildingsQuery.eq('id', buildingId)
  }

  const { data: buildings, error: bErr } = await buildingsQuery

  if (bErr) throw bErr
  if (!buildings?.length) return { buildings: [], floors: [], rooms: [], beds: [] }

  const buildingIds = buildings.map((b) => b.id)

  const { data: floors, error: fErr } = await supabase
    .from('floors')
    .select('*')
    .in('building_id', buildingIds)
    .order('floor_number')
  if (fErr) throw fErr

  const floorIds = (floors || []).map((f) => f.id)

  const { data: rooms, error: rErr } = await supabase
    .from('rooms')
    .select('*')
    .in('floor_id', floorIds)
    .order('room_number')
  if (rErr) throw rErr

  const roomIds = (rooms || []).map((r) => r.id)

  const { data: beds, error: beErr } = await supabase
    .from('beds')
    .select('*')
    .in('room_id', roomIds)
    .order('bed_number')
  if (beErr) throw beErr

  return { buildings, floors: floors || [], rooms: rooms || [], beds: beds || [] }
}

export async function createBuilding(orgId: string, name: string, address?: string, city?: string) {
  const { data, error } = await supabase
    .from('buildings')
    .insert({ org_id: orgId, name, address, city })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createFloor(buildingId: string, name: string, floorNumber: number) {
  const { data, error } = await supabase
    .from('floors')
    .insert({ building_id: buildingId, name, floor_number: floorNumber })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function createRoom(
  floorId: string,
  roomNumber: string,
  opts: { hasAc?: boolean; hasAttachedBathroom?: boolean; hasBalcony?: boolean; hasTv?: boolean; baseRent?: number; bedCount?: number }
) {
  const { data: room, error: rErr } = await supabase
    .from('rooms')
    .insert({
      floor_id: floorId,
      name: `Room ${roomNumber}`,
      room_number: roomNumber,
      has_ac: opts.hasAc || false,
      has_attached_bathroom: opts.hasAttachedBathroom || false,
      has_balcony: opts.hasBalcony || false,
      has_tv: opts.hasTv || false,
      base_rent: opts.baseRent,
    })
    .select()
    .single()
  if (rErr) throw rErr

  // Create beds
  const bedCount = opts.bedCount || 1
  const beds = Array.from({ length: bedCount }, (_, i) => ({
    room_id: room.id,
    bed_number: `Bed ${String.fromCharCode(65 + i)}`,
    status: 'vacant' as const,
    monthly_rent: opts.baseRent,
  }))

  const { error: bErr } = await supabase.from('beds').insert(beds)
  if (bErr) throw bErr

  return room
}

export async function deleteFloor(floorId: string) {
  // Beds and rooms cascade-delete via foreign keys
  const { error } = await supabase
    .from('floors')
    .delete()
    .eq('id', floorId)
  if (error) throw error
}

export async function deleteRoom(roomId: string) {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId)
  if (error) throw error
}

export async function deleteBuilding(buildingId: string) {
  const { error } = await supabase
    .from('buildings')
    .delete()
    .eq('id', buildingId)
  if (error) throw error
}

// ── Edit / Update functions ──────────────────────────────────────────

export async function updateRoom(
  roomId: string,
  updates: {
    name?: string
    room_number?: string
    has_ac?: boolean
    has_attached_bathroom?: boolean
    has_balcony?: boolean
    has_tv?: boolean
    base_rent?: number
    room_type?: string
  }
) {
  const { data, error } = await supabase
    .from('rooms')
    .update(updates)
    .eq('id', roomId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateFloor(
  floorId: string,
  updates: { name?: string; floor_number?: number }
) {
  const { data, error } = await supabase
    .from('floors')
    .update(updates)
    .eq('id', floorId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateBuilding(
  buildingId: string,
  updates: { name?: string; address?: string; city?: string }
) {
  const { data, error } = await supabase
    .from('buildings')
    .update(updates)
    .eq('id', buildingId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function addBedToRoom(roomId: string, bedNumber: string, monthlyRent?: number) {
  const { data, error } = await supabase
    .from('beds')
    .insert({
      room_id: roomId,
      bed_number: bedNumber,
      status: 'vacant',
      monthly_rent: monthlyRent,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeBed(bedId: string) {
  // First check the bed is vacant
  const { data: bed, error: fetchErr } = await supabase
    .from('beds')
    .select('status')
    .eq('id', bedId)
    .single()
  if (fetchErr) throw fetchErr
  if (bed.status !== 'vacant') {
    throw new Error('Cannot remove an occupied bed. The bed must be vacant first.')
  }

  const { error } = await supabase
    .from('beds')
    .delete()
    .eq('id', bedId)
  if (error) throw error
}

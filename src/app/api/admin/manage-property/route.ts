import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body
    const supabase = getAdminClient()

    if (action === 'list') {
      const { orgId } = params
      if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

      const { data, error } = await supabase
        .from('buildings')
        .select('id, name, address, city, created_at')
        .eq('org_id', orgId)
        .order('created_at')

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Get counts for each building
      const enriched = await Promise.all(
        (data || []).map(async (building) => {
          const { count: floorCount } = await supabase
            .from('floors')
            .select('id', { count: 'exact', head: true })
            .eq('building_id', building.id)

          const { data: floors } = await supabase
            .from('floors')
            .select('id')
            .eq('building_id', building.id)

          let roomCount = 0
          let bedCount = 0
          if (floors?.length) {
            const floorIds = floors.map(f => f.id)
            const { count: rc } = await supabase
              .from('rooms')
              .select('id', { count: 'exact', head: true })
              .in('floor_id', floorIds)
            roomCount = rc || 0

            const { data: rooms } = await supabase
              .from('rooms')
              .select('id')
              .in('floor_id', floorIds)
            if (rooms?.length) {
              const { count: bc } = await supabase
                .from('beds')
                .select('id', { count: 'exact', head: true })
                .in('room_id', rooms.map(r => r.id))
              bedCount = bc || 0
            }
          }

          return { ...building, floor_count: floorCount || 0, room_count: roomCount, bed_count: bedCount }
        })
      )

      return NextResponse.json(enriched)
    }

    if (action === 'add') {
      const { orgId, name, address, city } = params
      if (!orgId || !name) return NextResponse.json({ error: 'orgId and name required' }, { status: 400 })

      const { data, error } = await supabase
        .from('buildings')
        .insert({ org_id: orgId, name, address: address || null, city: city || null })
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json(data)
    }

    if (action === 'remove') {
      const { buildingId } = params
      if (!buildingId) return NextResponse.json({ error: 'buildingId required' }, { status: 400 })

      // Cascade delete: floors → rooms → beds are handled by FK cascades
      const { error } = await supabase
        .from('buildings')
        .delete()
        .eq('id', buildingId)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

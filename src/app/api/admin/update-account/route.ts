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
    const { orgId, action, ...params } = body

    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 })

    const supabase = getAdminClient()

    if (action === 'update') {
      const { name, account_slug } = params
      const updates: Record<string, unknown> = {}
      if (name !== undefined) updates.name = name
      if (account_slug !== undefined) updates.account_slug = account_slug

      const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', orgId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (action === 'disable') {
      // Deactivate all staff members for this org
      await supabase.from('staff_members').update({ is_active: false }).eq('org_id', orgId)
      return NextResponse.json({ success: true })
    }

    if (action === 'enable') {
      // Reactivate all staff members for this org
      await supabase.from('staff_members').update({ is_active: true }).eq('org_id', orgId)
      return NextResponse.json({ success: true })
    }

    if (action === 'change_password') {
      const { userId, newPassword } = params
      if (!userId || !newPassword) return NextResponse.json({ error: 'userId and newPassword required' }, { status: 400 })
      const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

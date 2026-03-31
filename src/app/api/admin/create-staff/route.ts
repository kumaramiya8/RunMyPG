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
    const { orgId, name, email, password, phone, role, permissions } = body

    if (!orgId || !name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()

    // 1. Create or find auth user
    let userId: string

    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message?.includes('already') || authError.message?.includes('exists')) {
        // User exists — find them
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        const existing = users?.find((u) => u.email === email)
        if (!existing) {
          return NextResponse.json({ error: 'User exists but could not be found' }, { status: 500 })
        }
        userId = existing.id
      } else {
        return NextResponse.json({ error: authError.message }, { status: 500 })
      }
    } else {
      userId = newUser.user.id
    }

    // 2. Create staff record
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff_members')
      .insert({
        org_id: orgId,
        user_id: userId,
        name,
        phone: phone || null,
        role,
        ...(permissions || {}),
        is_active: true,
      })
      .select()
      .single()

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    return NextResponse.json({ staffId: staff.id, userId })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

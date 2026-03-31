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
    // Debug: check env vars
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({
        error: `Missing env vars: URL=${url ? 'set' : 'MISSING'}, SERVICE_KEY=${key ? 'set' : 'MISSING'}`
      }, { status: 500 })
    }

    const { tenantId, orgId, email, password } = await request.json()

    if (!tenantId || !orgId || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const supabaseAdmin = getAdminClient()

    // 1. Create or find auth user
    let userId: string

    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
    })

    if (authError) {
      if (authError.message?.includes('already') || authError.message?.includes('exists')) {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        const existing = users?.find((u) => u.email === email)
        if (!existing) return NextResponse.json({ error: 'User exists but not found' }, { status: 500 })
        userId = existing.id
      } else {
        return NextResponse.json({ error: authError.message }, { status: 500 })
      }
    } else {
      userId = newUser.user.id
    }

    // 2. Check if tenant_users record already exists
    const { data: existing } = await supabaseAdmin
      .from('tenant_users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('org_id', orgId)
      .single()

    if (existing) {
      // Update existing record with new user_id
      await supabaseAdmin
        .from('tenant_users')
        .update({ user_id: userId, is_active: true })
        .eq('id', existing.id)
    } else {
      // Create new tenant_users record
      const { error: tuError } = await supabaseAdmin
        .from('tenant_users')
        .insert({ tenant_id: tenantId, user_id: userId, org_id: orgId, is_active: true })

      if (tuError) return NextResponse.json({ error: tuError.message }, { status: 500 })
    }

    // 3. Update tenant email in tenants table
    await supabaseAdmin
      .from('tenants')
      .update({ email })
      .eq('id', tenantId)

    return NextResponse.json({ userId })
  } catch (err: any) {
    console.error('create-tenant-login error:', err)
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

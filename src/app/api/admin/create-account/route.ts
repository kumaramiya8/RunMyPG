import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Lazy-init to avoid build-time errors when env var isn't available
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
    const { accountSlug, orgName, ownerName, ownerEmail, ownerPassword } = body

    if (!accountSlug || !orgName || !ownerName || !ownerEmail || !ownerPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // 1. Check if slug already exists
    const supabaseAdmin = getAdminClient()

    const { data: existing } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('account_slug', accountSlug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Account name already taken' }, { status: 400 })
    }

    // 2. Create auth user via Admin API (proper way)
    let userId: string

    // Try creating the user — if they already exist, createUser will error
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ownerEmail,
      password: ownerPassword,
      email_confirm: true,
    })

    if (authError) {
      // User might already exist — try to find them
      if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
        const existing = users?.find((u) => u.email === ownerEmail)
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

    // 3. Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: orgName,
        owner_id: userId,
        account_slug: accountSlug,
        account_type: 'pg',
      })
      .select('id')
      .single()

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 })
    }

    // 4. Create owner staff record
    const { error: staffError } = await supabaseAdmin
      .from('staff_members')
      .insert({
        org_id: org.id,
        user_id: userId,
        name: ownerName,
        role: 'owner',
        can_view_beds: true,
        can_manage_checkins: true,
        can_view_complaints: true,
        can_view_finances: true,
        can_manage_expenses: true,
        can_view_reports: true,
        is_active: true,
      })

    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 })
    }

    return NextResponse.json({ orgId: org.id, userId })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

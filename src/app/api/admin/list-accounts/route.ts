import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabaseAdmin = getAdminClient()

    // Get all PG organizations
    const { data: orgs, error: orgErr } = await supabaseAdmin
      .from('organizations')
      .select('id, name, account_slug, account_type, created_at')
      .eq('account_type', 'pg')
      .order('created_at', { ascending: false })

    if (orgErr) {
      return NextResponse.json({ error: orgErr.message }, { status: 500 })
    }

    // Enrich with owner info and counts
    const accounts = await Promise.all(
      (orgs || []).map(async (org) => {
        // Get owner
        const { data: staff } = await supabaseAdmin
          .from('staff_members')
          .select('name, user_id')
          .eq('org_id', org.id)
          .eq('role', 'owner')
          .limit(1)
          .maybeSingle()

        // Get owner email from auth
        let ownerEmail = null
        if (staff?.user_id) {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(staff.user_id)
          ownerEmail = userData?.user?.email || null
        }

        // Get tenant count
        const { count: tenantCount } = await supabaseAdmin
          .from('tenants')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', org.id)

        // Get building count
        const { count: buildingCount } = await supabaseAdmin
          .from('buildings')
          .select('id', { count: 'exact', head: true })
          .eq('org_id', org.id)

        return {
          id: org.id,
          name: org.name,
          account_slug: org.account_slug,
          account_type: org.account_type,
          owner_name: staff?.name || null,
          owner_email: ownerEmail,
          created_at: org.created_at,
          tenant_count: tenantCount || 0,
          building_count: buildingCount || 0,
        }
      })
    )

    return NextResponse.json(accounts)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 })
  }
}

import { supabase } from '../supabase'

export async function getStaffMembers(orgId: string) {
  const { data, error } = await supabase
    .from('staff_members')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function getStaffById(staffId: string) {
  const { data, error } = await supabase
    .from('staff_members')
    .select('*')
    .eq('id', staffId)
    .single()
  if (error) throw error
  return data
}

export async function inviteStaff(
  orgId: string,
  name: string,
  phone: string,
  role: string,
  permissions: Record<string, boolean>
) {
  // For now, create a placeholder staff record (user_id will be linked when they sign up)
  const { data, error } = await supabase
    .from('staff_members')
    .insert({
      org_id: orgId,
      user_id: '00000000-0000-0000-0000-000000000000', // placeholder
      name,
      phone,
      role,
      ...permissions,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updatePermissions(staffId: string, permissions: Record<string, boolean>) {
  const { error } = await supabase
    .from('staff_members')
    .update(permissions)
    .eq('id', staffId)
  if (error) throw error
}

export async function toggleStaffActive(staffId: string, isActive: boolean) {
  const { error } = await supabase
    .from('staff_members')
    .update({ is_active: isActive })
    .eq('id', staffId)
  if (error) throw error
}

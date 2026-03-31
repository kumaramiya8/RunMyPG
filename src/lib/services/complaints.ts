import { supabase } from '../supabase'

export async function getComplaints(orgId: string) {
  const { data, error } = await supabase
    .from('complaints')
    .select('*, tenant:tenants(full_name), room:rooms(name)')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getComplaintById(complaintId: string) {
  const { data, error } = await supabase
    .from('complaints')
    .select('*, tenant:tenants(full_name, phone), room:rooms(name)')
    .eq('id', complaintId)
    .single()
  if (error) throw error
  return data
}

export async function createComplaint(
  orgId: string,
  roomId: string,
  tenantId: string | null,
  category: string,
  description: string,
  priority: string,
  photoUrl?: string
) {
  const { data, error } = await supabase
    .from('complaints')
    .insert({ org_id: orgId, room_id: roomId, tenant_id: tenantId, category, description, priority, photo_url: photoUrl })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateComplaintStatus(complaintId: string, status: string, assignedTo?: string) {
  const update: Record<string, unknown> = { status }
  if (assignedTo !== undefined) update.assigned_to = assignedTo
  if (status === 'resolved') update.resolved_at = new Date().toISOString()

  const { error } = await supabase
    .from('complaints')
    .update(update)
    .eq('id', complaintId)
  if (error) throw error
}

import { supabase } from '../supabase'

export async function createNotification(
  orgId: string,
  recipientType: 'staff' | 'tenant' | 'all',
  recipientId: string | null,
  title: string,
  body: string,
  type: string = 'info',
  link?: string
) {
  const { error } = await supabase
    .from('notifications')
    .insert({ org_id: orgId, recipient_type: recipientType, recipient_id: recipientId, title, body, type, link })
  if (error) throw error
}

export async function getNotificationsForTenant(tenantId: string, orgId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .or(`recipient_id.eq.${tenantId},and(recipient_type.eq.all,org_id.eq.${orgId})`)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function getNotificationsForStaff(staffId: string, orgId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .or(`recipient_id.eq.${staffId},and(recipient_type.eq.all,org_id.eq.${orgId}),and(recipient_type.eq.staff,org_id.eq.${orgId})`)
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
  if (error) throw error
}

export async function getUnreadCount(recipientId: string, orgId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .or(`recipient_id.eq.${recipientId},and(recipient_type.eq.all,org_id.eq.${orgId})`)
    .eq('read', false)
  if (error) throw error
  return count || 0
}

// Send payment notification to tenant
export async function notifyPaymentReceived(
  orgId: string,
  tenantId: string,
  amount: number,
  paymentType: string,
  receiptLink?: string
) {
  const typeLabel = paymentType === 'deposit' ? 'Deposit' : paymentType === 'advance' ? 'Advance rent' : 'Rent'
  await createNotification(
    orgId,
    'tenant',
    tenantId,
    `${typeLabel} Payment Received`,
    `Your ${typeLabel.toLowerCase()} payment of ₹${amount.toLocaleString('en-IN')} has been recorded.`,
    'payment',
    receiptLink
  )
}

// Send rent reminder notification
export async function notifyRentReminder(
  orgId: string,
  tenantId: string,
  amount: number,
  dueDate: string,
  daysUntilDue: number
) {
  const urgency = daysUntilDue > 0
    ? `due in ${daysUntilDue} days`
    : daysUntilDue === 0
    ? 'due today'
    : `overdue by ${Math.abs(daysUntilDue)} days`

  await createNotification(
    orgId,
    'tenant',
    tenantId,
    `Rent Reminder`,
    `Your rent of ₹${amount.toLocaleString('en-IN')} is ${urgency} (${dueDate}).`,
    'reminder'
  )
}

// Send notice period notification
export async function notifyNoticePeriod(
  orgId: string,
  tenantId: string,
  vacateDate: string
) {
  await createNotification(
    orgId,
    'tenant',
    tenantId,
    'Notice Period Started',
    `Your notice period has started. Expected vacate date: ${vacateDate}.`,
    'notice'
  )
}

// Broadcast notification to all tenants
export async function broadcastNotification(
  orgId: string,
  title: string,
  body: string
) {
  await createNotification(orgId, 'all', null, title, body, 'broadcast')
}

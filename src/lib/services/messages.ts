import { supabase } from '../supabase'

export async function getMessages(orgId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function sendBroadcast(
  orgId: string,
  recipientType: string,
  recipientId: string | null,
  messageType: string,
  content: string
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      org_id: orgId,
      recipient_type: recipientType,
      recipient_id: recipientId,
      message_type: messageType,
      content,
      sent_at: new Date().toISOString(),
      delivery_status: 'sent',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

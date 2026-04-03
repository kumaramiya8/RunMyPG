import { supabase } from '../supabase'
import { getBuildingEntityIds } from './property'

export async function getMealOptouts(orgId: string, date: string, buildingId?: string | null) {
  let query = supabase
    .from('meal_optouts')
    .select('*')
    .eq('org_id', orgId)
    .eq('meal_date', date)

  if (buildingId) {
    // Get tenant IDs from building's occupancies to filter optouts
    const entityIds = await getBuildingEntityIds(buildingId)
    if (!entityIds?.bed_ids?.length) return []

    const { data: occupancies } = await supabase
      .from('occupancies')
      .select('tenant_id')
      .in('bed_id', entityIds.bed_ids)
      .neq('status', 'checked_out')

    if (!occupancies?.length) return []
    const tenantIds = occupancies.map((o) => o.tenant_id)
    query = query.in('tenant_id', tenantIds)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function toggleMealOptout(
  orgId: string,
  tenantId: string,
  date: string,
  mealType: 'breakfast' | 'lunch' | 'dinner'
) {
  // Check if optout exists
  const { data: existing } = await supabase
    .from('meal_optouts')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('meal_date', date)
    .eq('meal_type', mealType)
    .single()

  if (existing) {
    // Remove optout (they're eating now)
    const { error } = await supabase.from('meal_optouts').delete().eq('id', existing.id)
    if (error) throw error
    return false // not opted out anymore
  } else {
    // Add optout (they're skipping)
    const { error } = await supabase
      .from('meal_optouts')
      .insert({ org_id: orgId, tenant_id: tenantId, meal_date: date, meal_type: mealType })
    if (error) throw error
    return true // opted out
  }
}

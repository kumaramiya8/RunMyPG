import { supabase } from '../supabase'

export async function getMealOptouts(orgId: string, date: string) {
  const { data, error } = await supabase
    .from('meal_optouts')
    .select('*')
    .eq('org_id', orgId)
    .eq('meal_date', date)
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

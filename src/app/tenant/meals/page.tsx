'use client'

import { useState } from 'react'
import {
  Coffee,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { supabase } from '@/lib/supabase'
import { ListSkeleton } from '@/components/loading-skeleton'

type MealType = 'breakfast' | 'lunch' | 'dinner'

const mealConfig: Record<MealType, { label: string; icon: typeof Coffee; time: string; color: string; bg: string; bgActive: string }> = {
  breakfast: { label: 'Breakfast', icon: Coffee, time: '7:30 - 9:00 AM', color: 'text-amber-600', bg: 'bg-amber-50', bgActive: 'bg-amber-100' },
  lunch: { label: 'Lunch', icon: Sun, time: '12:30 - 2:00 PM', color: 'text-orange-600', bg: 'bg-orange-50', bgActive: 'bg-orange-100' },
  dinner: { label: 'Dinner', icon: Moon, time: '7:30 - 9:00 PM', color: 'text-indigo-600', bg: 'bg-indigo-50', bgActive: 'bg-indigo-100' },
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(date: Date): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (formatDate(date) === formatDate(today)) return 'Today'
  if (formatDate(date) === formatDate(tomorrow)) return 'Tomorrow'
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function TenantMealsPage() {
  const { orgId, tenantId } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [toggling, setToggling] = useState<MealType | null>(null)

  const dateStr = formatDate(selectedDate)

  const { data: optouts, loading, refetch } = useQuery(
    async () => {
      if (!tenantId) return []
      const { data, error } = await supabase
        .from('meal_optouts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('meal_date', dateStr)
      if (error) throw error
      return data || []
    },
    [tenantId, dateStr]
  )

  const optoutMeals = new Set(
    (optouts || []).map((o: any) => o.meal_type as MealType)
  )

  const handleToggle = async (meal: MealType) => {
    if (!orgId || !tenantId || toggling) return
    setToggling(meal)
    try {
      const isOptedOut = optoutMeals.has(meal)
      if (isOptedOut) {
        // Remove optout — tenant is eating now
        const { data: existing } = await supabase
          .from('meal_optouts')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('meal_date', dateStr)
          .eq('meal_type', meal)
          .single()
        if (existing) {
          await supabase.from('meal_optouts').delete().eq('id', existing.id)
        }
      } else {
        // Insert optout — tenant is skipping
        await supabase
          .from('meal_optouts')
          .insert({ org_id: orgId, tenant_id: tenantId, meal_date: dateStr, meal_type: meal })
      }
      refetch()
    } finally {
      setToggling(null)
    }
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  if (!orgId || !tenantId) return null

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <h1 className="text-lg font-bold text-slate-900 mb-4">Meal Schedule</h1>

      {/* Date selector */}
      <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-slate-100 mb-5">
        <button
          onClick={() => changeDate(-1)}
          className="p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="text-center">
          <p className="text-base font-bold text-slate-900">{formatDisplayDate(selectedDate)}</p>
          <p className="text-[10px] text-slate-400">
            {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => changeDate(1)}
          className="p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {loading ? (
        <ListSkeleton rows={3} />
      ) : (
        <div className="space-y-3">
          {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((meal) => {
            const cfg = mealConfig[meal]
            const Icon = cfg.icon
            const isSkipping = optoutMeals.has(meal)
            const isToggling = toggling === meal

            return (
              <button
                key={meal}
                onClick={() => handleToggle(meal)}
                disabled={isToggling}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                  isSkipping
                    ? 'border-red-200 bg-red-50/50'
                    : 'border-emerald-200 bg-emerald-50/50'
                } ${isToggling ? 'opacity-60' : ''}`}
              >
                <div className={`p-3 rounded-xl ${isSkipping ? 'bg-red-100' : cfg.bg}`}>
                  <Icon className={`w-6 h-6 ${isSkipping ? 'text-red-400' : cfg.color}`} />
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-semibold ${isSkipping ? 'text-red-700 line-through' : 'text-slate-800'}`}>
                    {cfg.label}
                  </p>
                  <p className="text-[11px] text-slate-400">{cfg.time}</p>
                </div>
                <div className={`w-14 h-8 rounded-full flex items-center transition-all ${
                  isSkipping
                    ? 'bg-red-100 justify-start pl-1'
                    : 'bg-emerald-500 justify-end pr-1'
                }`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isSkipping ? 'bg-red-500' : 'bg-white'
                  }`}>
                    {isSkipping ? (
                      <X className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-5">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-slate-500 font-medium">Eating</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-[11px] text-slate-500 font-medium">Skipping</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 text-center mt-3">
        Tap a meal to toggle between eating and skipping
      </p>
    </div>
  )
}

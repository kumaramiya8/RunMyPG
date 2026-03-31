'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Coffee,
  Sun,
  Moon,
  Users,
  UserMinus,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery, useMutation } from '@/lib/hooks/use-query'
import { getActiveOccupancies } from '@/lib/services/tenants'
import { getMealOptouts, toggleMealOptout } from '@/lib/services/meals'
import { ListSkeleton, EmptyState } from '@/components/loading-skeleton'

type MealType = 'breakfast' | 'lunch' | 'dinner'

const mealConfig: Record<MealType, { label: string; icon: typeof Coffee; time: string; color: string; bg: string }> = {
  breakfast: { label: 'Breakfast', icon: Coffee, time: '7:30 - 9:00 AM', color: 'text-amber-600', bg: 'bg-amber-50' },
  lunch: { label: 'Lunch', icon: Sun, time: '12:30 - 2:00 PM', color: 'text-orange-600', bg: 'bg-orange-50' },
  dinner: { label: 'Dinner', icon: Moon, time: '7:30 - 9:00 PM', color: 'text-indigo-600', bg: 'bg-indigo-50' },
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

export default function MealDashboard() {
  const { orgId } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedMeal, setSelectedMeal] = useState<MealType>('dinner')
  const [search, setSearch] = useState('')

  const dateStr = formatDate(selectedDate)

  const { data: occupancies, loading: occLoading } = useQuery(
    () => getActiveOccupancies(orgId!),
    [orgId]
  )

  const { data: optoutsData, loading: optLoading, refetch: refetchOptouts } = useQuery(
    () => getMealOptouts(orgId!, dateStr),
    [orgId, dateStr]
  )

  const toggleMut = useMutation(toggleMealOptout)

  const loading = occLoading || optLoading

  // Build opt-out sets from real data
  const optOuts: Record<MealType, Set<string>> = { breakfast: new Set(), lunch: new Set(), dinner: new Set() }
  if (optoutsData) {
    for (const row of optoutsData) {
      const mt = row.meal_type as MealType
      if (optOuts[mt]) {
        optOuts[mt].add(row.tenant_id)
      }
    }
  }

  const activeTenants = (occupancies || []).map((o: any) => ({
    id: o.tenant?.id,
    full_name: o.tenant?.full_name || 'Unknown',
  })).filter((t: any) => t.id)

  const totalActive = activeTenants.length

  const handleToggle = async (tenantId: string, meal: MealType) => {
    if (!orgId) return
    await toggleMut.mutate(orgId, tenantId, dateStr, meal)
    refetchOptouts()
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const filteredTenants = search
    ? activeTenants.filter((t: any) =>
        t.full_name.toLowerCase().includes(search.toLowerCase())
      )
    : activeTenants

  // Counts
  const mealCounts = {
    breakfast: { eating: totalActive - optOuts.breakfast.size, skipping: optOuts.breakfast.size },
    lunch: { eating: totalActive - optOuts.lunch.size, skipping: optOuts.lunch.size },
    dinner: { eating: totalActive - optOuts.dinner.size, skipping: optOuts.dinner.size },
  }

  if (!orgId) return null
  if (loading) return <ListSkeleton rows={6} />

  return (
    <div>
      {/* Date selector */}
      <div className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-slate-100 mb-4">
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

      {/* Meal cards */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((meal) => {
          const cfg = mealConfig[meal]
          const counts = mealCounts[meal]
          const Icon = cfg.icon
          const isSelected = selectedMeal === meal
          return (
            <button
              key={meal}
              onClick={() => setSelectedMeal(meal)}
              className={`relative p-3 rounded-xl border-2 text-center transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <div className={`p-2 rounded-lg ${cfg.bg} inline-flex mb-1.5`}>
                <Icon className={`w-5 h-5 ${cfg.color}`} />
              </div>
              <p className="text-[11px] font-semibold text-slate-700">{cfg.label}</p>
              <p className="text-lg font-bold text-slate-900 leading-tight">{counts.eating}</p>
              <p className="text-[9px] text-slate-400 font-medium">eating</p>
              {counts.skipping > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  -{counts.skipping}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Kitchen view link */}
      <Link
        href="/more/meals/kitchen"
        className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-3.5 mb-4 text-white shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
      >
        <div className="flex items-center gap-2.5">
          <ChefHat className="w-6 h-6" />
          <div>
            <p className="text-sm font-bold">Kitchen Display</p>
            <p className="text-[11px] text-white/70">Show on kitchen tablet</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{mealCounts[selectedMeal].eating}</p>
          <p className="text-[10px] text-white/70">for {mealConfig[selectedMeal].label.toLowerCase()}</p>
        </div>
      </Link>

      {/* Selected meal summary */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(() => { const Icon = mealConfig[selectedMeal].icon; return <Icon className={`w-4 h-4 ${mealConfig[selectedMeal].color}`} /> })()}
            <span className="text-sm font-semibold text-slate-800">{mealConfig[selectedMeal].label}</span>
            <span className="text-xs text-slate-400">{mealConfig[selectedMeal].time}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <Users className="w-3 h-3" /> {mealCounts[selectedMeal].eating}
            </span>
            <span className="flex items-center gap-1 text-red-500 font-semibold">
              <UserMinus className="w-3 h-3" /> {mealCounts[selectedMeal].skipping}
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search tenant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Tenant opt-out list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
        {filteredTenants.map((tenant: any) => {
          const isOptedOut = optOuts[selectedMeal].has(tenant.id)
          return (
            <div
              key={tenant.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                isOptedOut ? 'bg-red-50' : 'bg-emerald-50'
              }`}>
                <span className={`text-xs font-bold ${isOptedOut ? 'text-red-400' : 'text-emerald-600'}`}>
                  {tenant.full_name.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isOptedOut ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {tenant.full_name}
                </p>
              </div>
              <button
                onClick={() => handleToggle(tenant.id, selectedMeal)}
                className={`w-12 h-7 rounded-full flex items-center transition-all ${
                  isOptedOut
                    ? 'bg-red-100 justify-start pl-1'
                    : 'bg-emerald-500 justify-end pr-1'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  isOptedOut ? 'bg-red-500' : 'bg-white'
                }`}>
                  {isOptedOut ? (
                    <X className="w-3 h-3 text-white" />
                  ) : (
                    <Check className="w-3 h-3 text-emerald-500" />
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

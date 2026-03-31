'use client'

import { useState, useEffect } from 'react'
import {
  Coffee,
  Sun,
  Moon,
  Users,
  UserMinus,
  ChefHat,
  Clock,
} from 'lucide-react'
import { mockTenants, mockOccupancies } from '@/lib/mock-data'

type MealType = 'breakfast' | 'lunch' | 'dinner'

const mealConfig: Record<MealType, { label: string; icon: typeof Coffee; time: string; color: string; bg: string; gradient: string }> = {
  breakfast: { label: 'Breakfast', icon: Coffee, time: '7:30 - 9:00 AM', color: 'text-amber-600', bg: 'bg-amber-50', gradient: 'from-amber-500 to-orange-500' },
  lunch: { label: 'Lunch', icon: Sun, time: '12:30 - 2:00 PM', color: 'text-orange-600', bg: 'bg-orange-50', gradient: 'from-orange-500 to-red-500' },
  dinner: { label: 'Dinner', icon: Moon, time: '7:30 - 9:00 PM', color: 'text-indigo-600', bg: 'bg-indigo-50', gradient: 'from-indigo-500 to-purple-600' },
}

function getCurrentMeal(): MealType {
  const hour = new Date().getHours()
  if (hour < 10) return 'breakfast'
  if (hour < 15) return 'lunch'
  return 'dinner'
}

// Same mock opt-out generation as dashboard
function generateOptOuts(dateStr: string): Record<MealType, Set<string>> {
  const seed = dateStr.split('-').reduce((a, b) => a + parseInt(b), 0)
  const result: Record<MealType, Set<string>> = { breakfast: new Set(), lunch: new Set(), dinner: new Set() }
  const tenantIds = mockTenants.map((t) => t.id)

  tenantIds.forEach((id, i) => {
    const hash = (seed * (i + 1) * 7) % 100
    if (hash < 15) result.breakfast.add(id)
    if ((hash + 30) % 100 < 18) result.lunch.add(id)
    if ((hash + 60) % 100 < 22) result.dinner.add(id)
  })
  return result
}

export default function KitchenDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeMeal, setActiveMeal] = useState<MealType>(getCurrentMeal())

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const dateStr = currentTime.toISOString().split('T')[0]
  const optOuts = generateOptOuts(dateStr)
  const totalActive = mockOccupancies.filter((o) => o.status !== 'checked_out').length

  const counts = {
    breakfast: { eating: totalActive - optOuts.breakfast.size, skipping: optOuts.breakfast.size },
    lunch: { eating: totalActive - optOuts.lunch.size, skipping: optOuts.lunch.size },
    dinner: { eating: totalActive - optOuts.dinner.size, skipping: optOuts.dinner.size },
  }

  const cfg = mealConfig[activeMeal]
  const Icon = cfg.icon
  const eating = counts[activeMeal].eating
  const skipping = counts[activeMeal].skipping

  // Get names of people skipping
  const skippingTenants = mockTenants.filter((t) => optOuts[activeMeal].has(t.id))

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <ChefHat className="w-6 h-6 text-amber-400" />
          <span className="text-base font-bold">Kitchen Display</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Clock className="w-4 h-4" />
          {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Meal selector */}
      <div className="flex gap-2 px-5 py-4">
        {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((meal) => {
          const mc = mealConfig[meal]
          const MealIcon = mc.icon
          const isActive = activeMeal === meal
          return (
            <button
              key={meal}
              onClick={() => setActiveMeal(meal)}
              className={`flex-1 py-3 rounded-xl text-center transition-all ${
                isActive
                  ? `bg-gradient-to-br ${mc.gradient} shadow-lg`
                  : 'bg-white/10 hover:bg-white/15'
              }`}
            >
              <MealIcon className={`w-5 h-5 mx-auto mb-1 ${isActive ? 'text-white' : 'text-white/50'}`} />
              <p className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-white/50'}`}>{mc.label}</p>
            </button>
          )
        })}
      </div>

      {/* Big count */}
      <div className="text-center py-8 px-5">
        <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${cfg.gradient} mb-4`}>
          <Icon className="w-10 h-10 text-white" />
        </div>
        <p className="text-6xl font-black leading-none">{eating}</p>
        <p className="text-lg text-white/50 font-medium mt-2">
          people eating {cfg.label.toLowerCase()}
        </p>
        <p className="text-sm text-white/30 mt-1">{cfg.time}</p>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 px-5 mb-6">
        <div className="flex-1 bg-emerald-500/20 rounded-xl p-4 text-center">
          <Users className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-emerald-400">{eating}</p>
          <p className="text-[11px] text-emerald-400/70 font-medium">Eating</p>
        </div>
        <div className="flex-1 bg-red-500/20 rounded-xl p-4 text-center">
          <UserMinus className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-400">{skipping}</p>
          <p className="text-[11px] text-red-400/70 font-medium">Skipping</p>
        </div>
        <div className="flex-1 bg-white/10 rounded-xl p-4 text-center">
          <Users className="w-5 h-5 text-white/50 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white/70">{totalActive}</p>
          <p className="text-[11px] text-white/40 font-medium">Total</p>
        </div>
      </div>

      {/* Who's skipping */}
      {skippingTenants.length > 0 && (
        <div className="px-5 pb-6">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">
            Skipping {cfg.label} ({skipping})
          </p>
          <div className="flex flex-wrap gap-2">
            {skippingTenants.map((tenant) => (
              <span
                key={tenant.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 text-xs font-medium"
              >
                <UserMinus className="w-3 h-3" />
                {tenant.full_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* All meals summary */}
      <div className="px-5 pb-8">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wider mb-3">
          Today&apos;s Summary
        </p>
        <div className="space-y-2">
          {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((meal) => {
            const mc = mealConfig[meal]
            const MealIcon = mc.icon
            const pct = Math.round((counts[meal].eating / totalActive) * 100)
            return (
              <div key={meal} className="bg-white/5 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <MealIcon className="w-4 h-4 text-white/50" />
                    <span className="text-sm font-medium text-white/70">{mc.label}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{counts[meal].eating}/{totalActive}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${mc.gradient}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

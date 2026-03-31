'use client'

import { BedDouble, Users, IndianRupee, Wrench, TrendingUp, ArrowUpRight } from 'lucide-react'
import StatCard from '@/components/dashboard/stat-card'
import OccupancyBar from '@/components/dashboard/occupancy-bar'
import QuickActions from '@/components/dashboard/quick-actions'
import PendingRent from '@/components/dashboard/pending-rent'
import RecentComplaints from '@/components/dashboard/recent-complaints'

// Demo data — will be replaced with Supabase real-time queries
const stats = {
  totalBeds: 120,
  occupied: 98,
  vacant: 14,
  notice: 5,
  blocked: 3,
  totalTenants: 98,
  pendingRent: 156000,
  rentCollected: 684000,
  openComplaints: 7,
  todayCheckins: 2,
  todayCheckouts: 1,
  monthlyExpenses: 89000,
  monthlyRevenue: 840000,
}

function formatINR(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`
  }
  return `₹${amount}`
}

export default function DashboardPage() {
  const occupancyRate = Math.round((stats.occupied / stats.totalBeds) * 100)

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-7xl mx-auto">
      {/* Desktop Header */}
      <div className="hidden md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Welcome back! Here&apos;s how your property is doing today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Mobile Greeting */}
      <div className="md:hidden mb-4">
        <h2 className="text-lg font-bold text-slate-900">Good morning, Amit</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {stats.todayCheckins} check-in{stats.todayCheckins !== 1 ? 's' : ''}, {stats.todayCheckouts} check-out{stats.todayCheckouts !== 1 ? 's' : ''} today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard
          title="Total Occupancy"
          value={`${occupancyRate}%`}
          subtitle={`${stats.occupied} of ${stats.totalBeds} beds`}
          icon={BedDouble}
          color="indigo"
          trend={{ value: '3%', positive: true }}
        />
        <StatCard
          title="Active Tenants"
          value={stats.totalTenants.toString()}
          subtitle={`${stats.notice} on notice period`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Pending Rent"
          value={formatINR(stats.pendingRent)}
          subtitle="This billing cycle"
          icon={IndianRupee}
          color="amber"
        />
        <StatCard
          title="Open Issues"
          value={stats.openComplaints.toString()}
          subtitle="3 urgent, 4 medium"
          icon={Wrench}
          color="red"
        />
      </div>

      {/* Occupancy Bar */}
      <div className="mb-4">
        <OccupancyBar
          occupied={stats.occupied}
          vacant={stats.vacant}
          notice={stats.notice}
          blocked={stats.blocked}
        />
      </div>

      {/* Quick Actions (mobile prominent, desktop smaller) */}
      <div className="mb-4">
        <QuickActions />
      </div>

      {/* Two-column layout on desktop */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <PendingRent />
        <RecentComplaints />
      </div>

      {/* Profit Summary Card */}
      <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/80">This Month&apos;s Summary</h3>
          <div className="flex items-center gap-1 text-xs font-medium text-white/60">
            <TrendingUp className="w-3.5 h-3.5" />
            March 2026
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] text-white/60 font-medium">Collected</p>
            <p className="text-lg font-bold mt-0.5">{formatINR(stats.rentCollected)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/60 font-medium">Expenses</p>
            <p className="text-lg font-bold mt-0.5">{formatINR(stats.monthlyExpenses)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/60 font-medium">Net Profit</p>
            <p className="text-lg font-bold mt-0.5 flex items-center gap-1">
              {formatINR(stats.monthlyRevenue - stats.monthlyExpenses)}
              <ArrowUpRight className="w-4 h-4 text-emerald-300" />
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

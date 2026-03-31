'use client'

import { BedDouble, Users, IndianRupee, Wrench, TrendingUp, ArrowUpRight } from 'lucide-react'
import StatCard from '@/components/dashboard/stat-card'
import OccupancyBar from '@/components/dashboard/occupancy-bar'
import QuickActions from '@/components/dashboard/quick-actions'
import PendingRent from '@/components/dashboard/pending-rent'
import RecentComplaints from '@/components/dashboard/recent-complaints'
import { PageSkeleton } from '@/components/loading-skeleton'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { getFullPropertyTree } from '@/lib/services/property'
import { getFinancialSummary } from '@/lib/services/billing'
import { getComplaints } from '@/lib/services/complaints'
import { getActiveOccupancies } from '@/lib/services/tenants'

function formatINR(amount: number): string {
  if (amount >= 100000) {
    return `\u20B9${(amount / 100000).toFixed(1)}L`
  }
  if (amount >= 1000) {
    return `\u20B9${(amount / 1000).toFixed(0)}K`
  }
  return `\u20B9${amount}`
}

export default function DashboardPage() {
  const { orgId, staffName } = useAuth()

  const { data: propertyTree, loading: loadingProperty } = useQuery(
    () => (orgId ? getFullPropertyTree(orgId) : Promise.resolve(null)),
    [orgId]
  )

  const { data: financials, loading: loadingFinancials } = useQuery(
    () => (orgId ? getFinancialSummary(orgId) : Promise.resolve(null)),
    [orgId]
  )

  const { data: complaints, loading: loadingComplaints } = useQuery(
    () => (orgId ? getComplaints(orgId) : Promise.resolve(null)),
    [orgId]
  )

  const { data: occupancies, loading: loadingOccupancies } = useQuery(
    () => (orgId ? getActiveOccupancies(orgId) : Promise.resolve(null)),
    [orgId]
  )

  const loading = loadingProperty || loadingFinancials || loadingComplaints || loadingOccupancies

  if (loading) {
    return <PageSkeleton />
  }

  // Compute bed stats from property tree
  const beds = propertyTree?.beds || []
  const totalBeds = beds.length
  const occupied = beds.filter((b) => b.status === 'occupied').length
  const vacant = beds.filter((b) => b.status === 'vacant').length
  const notice = beds.filter((b) => b.status === 'notice').length
  const blocked = beds.filter((b) => b.status === 'blocked' || b.status === 'maintenance').length

  // Tenant count from active occupancies
  const totalTenants = occupancies?.length ?? 0
  const noticeCount = occupancies?.filter((o) => o.status === 'notice').length ?? 0

  // Financial stats
  const rentPending = (financials?.rentPending ?? 0) + (financials?.rentOverdue ?? 0)
  const rentCollected = financials?.rentCollected ?? 0
  const totalExpenses = financials?.totalExpenses ?? 0
  const netProfit = financials?.netProfit ?? 0

  // Complaints
  const openComplaints = complaints?.filter((c) => c.status === 'open' || c.status === 'in_progress') || []
  const urgentCount = openComplaints.filter((c) => c.priority === 'urgent' || c.priority === 'high').length
  const mediumCount = openComplaints.filter((c) => c.priority === 'medium').length

  const occupancyRate = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0

  const subtitleParts: string[] = []
  if (urgentCount > 0) subtitleParts.push(`${urgentCount} urgent`)
  if (mediumCount > 0) subtitleParts.push(`${mediumCount} medium`)
  const complaintsSubtitle = subtitleParts.length > 0 ? subtitleParts.join(', ') : 'No open issues'

  const greeting = staffName ? `Welcome back, ${staffName.split(' ')[0]}!` : 'Welcome back!'

  const currentMonth = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-7xl mx-auto">
      {/* Desktop Header */}
      <div className="hidden md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {greeting} Here&apos;s how your property is doing today.
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
        <h2 className="text-lg font-bold text-slate-900">
          {staffName ? `Good morning, ${staffName.split(' ')[0]}` : 'Good morning'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {totalTenants} active tenant{totalTenants !== 1 ? 's' : ''}, {openComplaints.length} open issue{openComplaints.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard
          title="Total Occupancy"
          value={totalBeds > 0 ? `${occupancyRate}%` : '0%'}
          subtitle={totalBeds > 0 ? `${occupied} of ${totalBeds} beds` : 'No beds configured'}
          icon={BedDouble}
          color="indigo"
        />
        <StatCard
          title="Active Tenants"
          value={totalTenants.toString()}
          subtitle={noticeCount > 0 ? `${noticeCount} on notice period` : 'All active'}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Pending Rent"
          value={formatINR(rentPending)}
          subtitle="This billing cycle"
          icon={IndianRupee}
          color="amber"
        />
        <StatCard
          title="Open Issues"
          value={openComplaints.length.toString()}
          subtitle={complaintsSubtitle}
          icon={Wrench}
          color="red"
        />
      </div>

      {/* Occupancy Bar */}
      <div className="mb-4">
        <OccupancyBar
          occupied={occupied}
          vacant={vacant}
          notice={notice}
          blocked={blocked}
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
          <h3 className="text-sm font-semibold text-white/80">Financial Summary</h3>
          <div className="flex items-center gap-1 text-xs font-medium text-white/60">
            <TrendingUp className="w-3.5 h-3.5" />
            {currentMonth}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] text-white/60 font-medium">Collected</p>
            <p className="text-lg font-bold mt-0.5">{formatINR(rentCollected)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/60 font-medium">Expenses</p>
            <p className="text-lg font-bold mt-0.5">{formatINR(totalExpenses)}</p>
          </div>
          <div>
            <p className="text-[11px] text-white/60 font-medium">Net Profit</p>
            <p className="text-lg font-bold mt-0.5 flex items-center gap-1">
              {formatINR(netProfit)}
              {netProfit > 0 && <ArrowUpRight className="w-4 h-4 text-emerald-300" />}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

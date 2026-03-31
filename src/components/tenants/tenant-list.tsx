'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Filter,
  ChevronRight,
  Phone,
  CheckCircle,
  AlertTriangle,
  Building2,
  Users,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { getActiveOccupancies } from '@/lib/services/tenants'
import { ListSkeleton, EmptyState } from '@/components/loading-skeleton'
import type { Occupancy, Tenant, Bed, Room } from '@/lib/types'

type FilterType = 'all' | 'active' | 'notice'

interface OccupancyWithJoins extends Occupancy {
  tenant: Tenant
  bed: Bed & { room: Room }
}

export default function TenantList() {
  const { orgId } = useAuth()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  const { data: occupancies, loading } = useQuery(
    () => getActiveOccupancies(orgId!),
    [orgId]
  )

  if (loading) {
    return <ListSkeleton rows={5} />
  }

  const activeOccupancies = (occupancies ?? []) as OccupancyWithJoins[]

  if (activeOccupancies.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No tenants yet"
        description="Check in your first tenant to get started."
      />
    )
  }

  // Build enriched tenant data from occupancies with joined data
  const enrichedTenants = activeOccupancies.map((occ) => ({
    tenant: occ.tenant,
    occupancy: occ,
    bed: occ.bed,
    room: occ.bed?.room,
  }))

  const filtered = enrichedTenants.filter(({ tenant, occupancy }) => {
    const matchesSearch = tenant.full_name.toLowerCase().includes(search.toLowerCase()) ||
      tenant.phone.includes(search) ||
      (tenant.company_or_college?.toLowerCase().includes(search.toLowerCase()))
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'active' ? occupancy?.status === 'active' :
      filter === 'notice' ? occupancy?.status === 'notice_period' : true
    return matchesSearch && matchesFilter
  })

  const activeTenants = enrichedTenants.filter((t) => t.occupancy?.status === 'active').length
  const noticeTenants = enrichedTenants.filter((t) => t.occupancy?.status === 'notice_period').length

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, phone, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all' as const, label: 'All', count: enrichedTenants.length },
          { key: 'active' as const, label: 'Active', count: activeTenants },
          { key: 'notice' as const, label: 'On Notice', count: noticeTenants },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === item.key
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {/* Tenant cards */}
      <div className="space-y-2">
        {filtered.map(({ tenant, occupancy, bed, room }) => (
          <Link
            key={tenant.id}
            href={`/tenants/${tenant.id}`}
            className="flex items-center gap-3 bg-white rounded-xl p-3 border border-slate-100 shadow-sm hover:shadow-md active:bg-slate-50 transition-all"
          >
            {/* Avatar */}
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">
                {tenant.full_name.split(' ').map((n) => n[0]).join('')}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900 truncate">{tenant.full_name}</p>
                {tenant.aadhaar_verified && (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                )}
                {occupancy?.status === 'notice_period' && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 text-[10px] font-semibold text-amber-600 shrink-0">
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Notice
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                {room && (
                  <span className="flex items-center gap-0.5">
                    <Building2 className="w-3 h-3" />
                    {room.name}{bed ? ` - ${bed.bed_number}` : ''}
                  </span>
                )}
                <span className="text-slate-300">|</span>
                <span>{tenant.occupation} at {tenant.company_or_college}</span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-slate-400">No tenants found</p>
          </div>
        )}
      </div>
    </div>
  )
}

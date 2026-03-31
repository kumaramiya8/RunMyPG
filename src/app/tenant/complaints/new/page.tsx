'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  AlertTriangle,
  Zap,
  Droplets,
  Sofa,
  SprayCan,
  HelpCircle,
  Check,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery, useMutation } from '@/lib/hooks/use-query'
import { supabase } from '@/lib/supabase'

const categories = [
  { key: 'Electrical', label: 'Electrical', icon: Zap, color: 'bg-yellow-50 text-yellow-600', desc: 'Fan, light, AC, wiring' },
  { key: 'Plumbing', label: 'Plumbing', icon: Droplets, color: 'bg-blue-50 text-blue-600', desc: 'Tap, toilet, pipe, geyser' },
  { key: 'Furniture', label: 'Furniture', icon: Sofa, color: 'bg-orange-50 text-orange-600', desc: 'Bed, chair, table, cupboard' },
  { key: 'Cleaning', label: 'Cleaning', icon: SprayCan, color: 'bg-teal-50 text-teal-600', desc: 'Room, bathroom, common area' },
  { key: 'Other', label: 'Other', icon: HelpCircle, color: 'bg-slate-50 text-slate-600', desc: 'Anything else' },
]

const priorities = [
  { key: 'low', label: 'Low', desc: 'Can wait a few days', color: 'border-slate-200 bg-slate-50' },
  { key: 'medium', label: 'Medium', desc: 'Should fix this week', color: 'border-blue-200 bg-blue-50' },
  { key: 'high', label: 'High', desc: 'Needs attention today', color: 'border-amber-200 bg-amber-50' },
  { key: 'urgent', label: 'Urgent', desc: 'Safety issue, fix now', color: 'border-red-200 bg-red-50' },
]

async function getTenantRoom(tenantId: string) {
  const { data: occupancy, error } = await supabase
    .from('occupancies')
    .select('bed:beds(room_id, room:rooms(id, name))')
    .eq('tenant_id', tenantId)
    .neq('status', 'checked_out')
    .single()

  if (error || !occupancy) throw new Error('Could not find your room')
  const bed = occupancy.bed as any
  return { roomId: bed?.room_id || bed?.room?.id, roomName: bed?.room?.name || 'Your Room' }
}

async function submitComplaint(
  orgId: string,
  tenantId: string,
  roomId: string,
  category: string,
  description: string,
  priority: string
) {
  const { data, error } = await supabase
    .from('complaints')
    .insert({
      org_id: orgId,
      tenant_id: tenantId,
      room_id: roomId,
      category,
      description,
      priority,
      status: 'open',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export default function TenantNewComplaintPage() {
  const { orgId, tenantId } = useAuth()
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [saved, setSaved] = useState(false)

  const { data: roomInfo, loading: roomLoading } = useQuery(
    () => getTenantRoom(tenantId!),
    [tenantId]
  )

  const { mutate: doSubmit, loading: saving, error } = useMutation(
    (cat: string, desc: string, pri: string) =>
      submitComplaint(orgId!, tenantId!, roomInfo!.roomId, cat, desc, pri)
  )

  const handleSubmit = async () => {
    if (!category || !description || !orgId || !tenantId || !roomInfo) return
    const result = await doSubmit(category, description, priority)
    if (result !== null) {
      setSaved(true)
    }
  }

  if (saved) {
    return (
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-lg mx-auto">
        <div className="text-center py-10">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Complaint Submitted</h3>
          <p className="text-sm text-slate-500 mt-1">
            Your {category.toLowerCase()} issue has been reported
          </p>
          <p className="text-xs text-slate-400 mt-2">
            You&apos;ll be notified when it&apos;s resolved
          </p>
          <div className="flex gap-2 mt-6 max-w-xs mx-auto">
            <button
              onClick={() => {
                setSaved(false)
                setCategory('')
                setDescription('')
                setPriority('medium')
              }}
              className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all"
            >
              Report Another
            </button>
            <Link
              href="/tenant/complaints"
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm text-center hover:bg-slate-200"
            >
              View All
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/tenant/complaints"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-50">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Raise Complaint</h1>
            <p className="text-xs text-slate-500">
              {roomLoading ? 'Loading...' : roomInfo?.roomName || 'Report an issue'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Category */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-2 block">What type of issue?</label>
          <div className="space-y-2">
            {categories.map((cat) => {
              const Icon = cat.icon
              const isSelected = category === cat.key
              return (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${cat.color.split(' ')[0]}`}>
                    <Icon className={`w-5 h-5 ${cat.color.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{cat.label}</p>
                    <p className="text-[11px] text-slate-400">{cat.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Describe the issue</label>
          <textarea
            placeholder="e.g., Ceiling fan making grinding noise since yesterday..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-2 block">Priority</label>
          <div className="grid grid-cols-2 gap-2">
            {priorities.map((pri) => (
              <button
                key={pri.key}
                onClick={() => setPriority(pri.key)}
                className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                  priority === pri.key
                    ? 'border-primary bg-primary/5'
                    : `${pri.color} border-transparent`
                }`}
              >
                <p className="text-xs font-semibold text-slate-800">{pri.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{pri.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!category || !description || saving || roomLoading || !roomInfo}
          className="w-full py-3.5 bg-red-600 text-white font-semibold rounded-xl text-sm hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          {saving ? 'Submitting...' : 'Submit Complaint'}
        </button>
      </div>
    </div>
  )
}

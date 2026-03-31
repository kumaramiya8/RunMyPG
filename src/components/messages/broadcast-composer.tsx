'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Building2,
  Layers,
  User,
  Send,
  Check,
  ChevronDown,
  MessageSquare,
  Zap,
} from 'lucide-react'
import { mockFloors, mockBuilding, mockTenants, mockOccupancies } from '@/lib/mock-data'

type RecipientScope = 'all' | 'building' | 'floor' | 'individual'

const scopes = [
  { key: 'all' as const, label: 'All Tenants', desc: 'Send to everyone in the building', icon: Users, count: 39 },
  { key: 'floor' as const, label: 'Specific Floor', desc: 'Select a floor to message', icon: Layers, count: null },
  { key: 'individual' as const, label: 'Individual', desc: 'Send to one tenant', icon: User, count: null },
]

const templates = [
  { id: 't1', label: 'Water Supply Disruption', content: 'No water supply from {TIME} due to {REASON}. Please store water in advance. Sorry for the inconvenience.' },
  { id: 't2', label: 'Electricity Maintenance', content: 'Power will be off from {TIME} for scheduled maintenance. Please plan accordingly.' },
  { id: 't3', label: 'Event/Celebration', content: 'We are organizing {EVENT} on {DATE} at {TIME} in the common area. Everyone is welcome!' },
  { id: 't4', label: 'Rule Reminder', content: 'Gentle reminder: Please {RULE}. Your cooperation is appreciated.' },
  { id: 't5', label: 'Custom Message', content: '' },
]

export default function BroadcastComposer() {
  const [scope, setScope] = useState<RecipientScope | ''>('')
  const [selectedFloor, setSelectedFloor] = useState('')
  const [selectedTenant, setSelectedTenant] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const activeTenants = mockTenants.filter((t) =>
    mockOccupancies.some((o) => o.tenant_id === t.id && o.status !== 'checked_out')
  )

  const recipientCount = scope === 'all' ? activeTenants.length
    : scope === 'floor' ? Math.floor(activeTenants.length / mockFloors.length)
    : scope === 'individual' ? 1 : 0

  if (sent) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Message Sent!</h3>
        <p className="text-sm text-slate-500 mt-1">
          WhatsApp message sent to {recipientCount} {recipientCount === 1 ? 'person' : 'people'}
        </p>
        <div className="bg-slate-50 rounded-xl p-3 mt-4 max-w-xs mx-auto text-left">
          <p className="text-xs text-slate-500 line-clamp-3">{message}</p>
        </div>
        <div className="flex gap-2 mt-6 max-w-xs mx-auto">
          <button
            onClick={() => { setSent(false); setScope(''); setMessage('') }}
            className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            Send Another
          </button>
          <Link
            href="/more/messages"
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm text-center hover:bg-slate-200"
          >
            View All
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Recipient scope */}
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-2 block">Send to</label>
        <div className="space-y-2">
          {scopes.map((s) => {
            const Icon = s.icon
            const isSelected = scope === s.key
            return (
              <button
                key={s.key}
                onClick={() => { setScope(s.key); setSelectedFloor(''); setSelectedTenant('') }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/10' : 'bg-slate-100'}`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                  <p className="text-[11px] text-slate-400">{s.desc}</p>
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

      {/* Floor selector */}
      {scope === 'floor' && (
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Select Floor</label>
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Choose a floor...</option>
              {mockFloors.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Individual tenant selector */}
      {scope === 'individual' && (
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Select Tenant</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Choose a tenant...</option>
              {activeTenants.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Quick templates */}
      {scope && (
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-2 block">Quick Templates</label>
          <div className="flex gap-2 overflow-x-auto pb-1 scroll-touch -mx-4 px-4 md:mx-0 md:px-0">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setMessage(t.content)}
                className="shrink-0 px-3 py-2 bg-slate-100 rounded-lg text-[11px] font-medium text-slate-600 hover:bg-slate-200 active:bg-slate-300 transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message input */}
      {scope && (
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Message</label>
          <div className="relative">
            <textarea
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-slate-400">{message.length} characters</span>
              <span className="text-[10px] text-slate-400">
                Sending to {recipientCount} {recipientCount === 1 ? 'person' : 'people'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Preview & Send */}
      {scope && message && (
        <div>
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-800">WhatsApp Preview</p>
                <p className="text-[10px] text-emerald-600">RunMyPG</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-2.5 ml-10">
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{message}</p>
            </div>
          </div>

          <button
            onClick={() => setSent(true)}
            className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send via WhatsApp
          </button>
        </div>
      )}
    </div>
  )
}

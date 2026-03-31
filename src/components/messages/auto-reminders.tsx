'use client'

import { useState } from 'react'
import {
  Bell,
  Clock,
  IndianRupee,
  AlertTriangle,
  Check,
  ChevronDown,
  MessageSquare,
  Send,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

interface ReminderRule {
  id: string
  name: string
  description: string
  icon: typeof Bell
  enabled: boolean
  daysBefore: number
  message: string
  type: 'pre_due' | 'on_due' | 'overdue'
}

const defaultRules: ReminderRule[] = [
  {
    id: 'r1',
    name: '3 Days Before Due',
    description: 'Polite reminder sent 3 days before rent is due',
    icon: Clock,
    enabled: true,
    daysBefore: 3,
    message: 'Hi {NAME}, your rent of {AMOUNT} for {MONTH} is due on {DUE_DATE}. Please arrange payment at your convenience. Thank you!',
    type: 'pre_due',
  },
  {
    id: 'r2',
    name: 'On Due Date',
    description: 'Reminder sent on the actual due date',
    icon: IndianRupee,
    enabled: true,
    daysBefore: 0,
    message: 'Hi {NAME}, your rent of {AMOUNT} is due today ({DUE_DATE}). Please make the payment to avoid any late charges. Thank you!',
    type: 'on_due',
  },
  {
    id: 'r3',
    name: '3 Days Overdue',
    description: 'Firmer reminder when payment is 3 days late',
    icon: AlertTriangle,
    enabled: true,
    daysBefore: -3,
    message: 'Hi {NAME}, your rent of {AMOUNT} was due on {DUE_DATE} and is now 3 days overdue. Please clear the payment immediately to avoid additional charges.',
    type: 'overdue',
  },
  {
    id: 'r4',
    name: '7 Days Overdue',
    description: 'Final warning when payment is a week late',
    icon: AlertTriangle,
    enabled: false,
    daysBefore: -7,
    message: 'Hi {NAME}, this is a final reminder. Your rent of {AMOUNT} is now 7 days overdue. Please settle the payment today or contact us to discuss.',
    type: 'overdue',
  },
]

const typeColors: Record<string, { bg: string; color: string; border: string }> = {
  pre_due: { bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-blue-200' },
  on_due: { bg: 'bg-amber-50', color: 'text-amber-600', border: 'border-amber-200' },
  overdue: { bg: 'bg-red-50', color: 'text-red-600', border: 'border-red-200' },
}

export default function AutoReminders() {
  const [rules, setRules] = useState(defaultRules)
  const [editingId, setEditingId] = useState<string | null>(null)

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    )
  }

  const activeCount = rules.filter((r) => r.enabled).length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Auto Rent Reminders</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              WhatsApp messages sent automatically based on rent due dates
            </p>
          </div>
          <div className="bg-primary/10 rounded-lg px-2.5 py-1">
            <span className="text-xs font-bold text-primary">{activeCount} active</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
        <p className="text-xs font-semibold text-blue-700 mb-1">How it works</p>
        <p className="text-[11px] text-blue-600 leading-relaxed">
          Each tenant has their own rent due day. The system automatically sends WhatsApp
          reminders based on the rules below. Variables like {'{NAME}'}, {'{AMOUNT}'}, and {'{DUE_DATE}'}
          are replaced with actual tenant data.
        </p>
      </div>

      {/* Reminder rules */}
      <div className="space-y-3">
        {rules.map((rule) => {
          const Icon = rule.icon
          const tc = typeColors[rule.type]
          const isEditing = editingId === rule.id

          return (
            <div
              key={rule.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                rule.enabled ? 'border-slate-100' : 'border-slate-100 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="flex items-center gap-3 p-4">
                <div className={`p-2 rounded-lg ${tc.bg}`}>
                  <Icon className={`w-4 h-4 ${tc.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                  <p className="text-[11px] text-slate-400">{rule.description}</p>
                </div>
                <button
                  onClick={() => toggleRule(rule.id)}
                  className="shrink-0"
                >
                  {rule.enabled ? (
                    <ToggleRight className="w-10 h-6 text-primary" />
                  ) : (
                    <ToggleLeft className="w-10 h-6 text-slate-300" />
                  )}
                </button>
              </div>

              {/* Message preview */}
              {rule.enabled && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => setEditingId(isEditing ? null : rule.id)}
                    className="w-full text-left"
                  >
                    <div className="bg-slate-50 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-semibold text-slate-400">MESSAGE TEMPLATE</span>
                        <span className="text-[10px] text-primary font-medium ml-auto">
                          {isEditing ? 'Done' : 'Edit'}
                        </span>
                      </div>
                      {isEditing ? (
                        <textarea
                          defaultValue={rule.message}
                          rows={3}
                          className="w-full text-xs text-slate-600 leading-relaxed bg-white rounded-lg p-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <p className="text-xs text-slate-600 leading-relaxed">{rule.message}</p>
                      )}
                    </div>
                  </button>

                  {/* Timing badge */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${tc.bg} ${tc.color}`}>
                      <Clock className="w-2.5 h-2.5" />
                      {rule.daysBefore > 0
                        ? `${rule.daysBefore} days before due`
                        : rule.daysBefore === 0
                        ? 'On due date'
                        : `${Math.abs(rule.daysBefore)} days after due`}
                    </span>
                    <span className="text-[10px] text-slate-400">Sent at 9:00 AM</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Test button */}
      <button className="w-full py-3 bg-white text-primary font-semibold rounded-xl text-sm border border-primary/20 hover:bg-primary/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
        <Send className="w-4 h-4" />
        Send Test Message to Myself
      </button>
    </div>
  )
}

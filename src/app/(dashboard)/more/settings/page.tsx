'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  Settings,
  Building2,
  IndianRupee,
  Bell,
  User,
  Shield,
  Phone,
  Mail,
  Globe,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Camera,
  LogOut,
} from 'lucide-react'
import Link from 'next/link'

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="shrink-0">
      {enabled ? (
        <div className="w-11 h-6 rounded-full bg-primary flex items-center justify-end pr-0.5 transition-all">
          <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
        </div>
      ) : (
        <div className="w-11 h-6 rounded-full bg-slate-200 flex items-center justify-start pl-0.5 transition-all">
          <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
        </div>
      )}
    </button>
  )
}

function SettingRow({ icon: Icon, label, desc, right, color }: { icon: typeof Bell; label: string; desc?: string; right: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className={`p-2 rounded-lg ${color || 'bg-slate-100'}`}>
        <Icon className="w-4 h-4 text-current" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {desc && <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>}
      </div>
      {right}
    </div>
  )
}

export default function SettingsPage() {
  const [gstEnabled, setGstEnabled] = useState(false)
  const [autoReminders, setAutoReminders] = useState(true)
  const [whatsappReceipts, setWhatsappReceipts] = useState(true)
  const [mealNotifications, setMealNotifications] = useState(true)
  const [complaintAlerts, setComplaintAlerts] = useState(true)

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/more"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors md:hidden"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-slate-100">
            <Settings className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Settings</h1>
            <p className="text-xs text-slate-500">App preferences & configuration</p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Profile</p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">AK</span>
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-white">
                  <Camera className="w-3 h-3 text-white" />
                </button>
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-slate-900">Amit Kumar</p>
                <p className="text-xs text-slate-500">Owner</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
            <div className="divide-y divide-slate-50">
              <SettingRow
                icon={Phone}
                label="+91 98000 00001"
                desc="Phone number"
                right={<span className="text-xs text-primary font-semibold">Change</span>}
                color="bg-slate-100 text-slate-500"
              />
              <SettingRow
                icon={Mail}
                label="amit@runmypg.com"
                desc="Email address"
                right={<span className="text-xs text-primary font-semibold">Change</span>}
                color="bg-slate-100 text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Business */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Business</p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            <SettingRow
              icon={Building2}
              label="Organization Name"
              desc="RunMyPG - Block A"
              right={<ChevronRight className="w-4 h-4 text-slate-300" />}
              color="bg-indigo-50 text-indigo-500"
            />
            <SettingRow
              icon={IndianRupee}
              label="GST Billing"
              desc={gstEnabled ? 'GST @ 18% added to invoices' : 'No GST on invoices'}
              right={<Toggle enabled={gstEnabled} onToggle={() => setGstEnabled(!gstEnabled)} />}
              color="bg-amber-50 text-amber-500"
            />
            {gstEnabled && (
              <div className="px-4 py-3 bg-amber-50/50">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">GST Number</label>
                <input
                  type="text"
                  placeholder="e.g., 29ABCDE1234F1Z5"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-[10px] text-amber-600 mt-1">
                  CGST 9% + SGST 9% will be added to all rent invoices
                </p>
              </div>
            )}
            <SettingRow
              icon={Globe}
              label="Currency"
              desc="Indian Rupee (₹)"
              right={<span className="text-xs text-slate-400">INR</span>}
              color="bg-slate-100 text-slate-500"
            />
          </div>
        </div>

        {/* Notifications */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Notifications</p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            <SettingRow
              icon={IndianRupee}
              label="Auto Rent Reminders"
              desc="Send WhatsApp reminders before due date"
              right={<Toggle enabled={autoReminders} onToggle={() => setAutoReminders(!autoReminders)} />}
              color="bg-emerald-50 text-emerald-500"
            />
            <SettingRow
              icon={IndianRupee}
              label="WhatsApp Receipts"
              desc="Auto-send receipt after payment"
              right={<Toggle enabled={whatsappReceipts} onToggle={() => setWhatsappReceipts(!whatsappReceipts)} />}
              color="bg-emerald-50 text-emerald-500"
            />
            <SettingRow
              icon={Bell}
              label="Meal Opt-out Alerts"
              desc="Notify when tenants skip meals"
              right={<Toggle enabled={mealNotifications} onToggle={() => setMealNotifications(!mealNotifications)} />}
              color="bg-orange-50 text-orange-500"
            />
            <SettingRow
              icon={Bell}
              label="New Complaint Alerts"
              desc="Notify when a complaint is filed"
              right={<Toggle enabled={complaintAlerts} onToggle={() => setComplaintAlerts(!complaintAlerts)} />}
              color="bg-red-50 text-red-500"
            />
          </div>
        </div>

        {/* Security */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Security</p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            <SettingRow
              icon={Shield}
              label="Change Password"
              right={<ChevronRight className="w-4 h-4 text-slate-300" />}
              color="bg-slate-100 text-slate-500"
            />
            <SettingRow
              icon={Phone}
              label="Two-Factor Auth"
              desc="OTP via SMS on login"
              right={<Toggle enabled={false} onToggle={() => {}} />}
              color="bg-slate-100 text-slate-500"
            />
          </div>
        </div>

        {/* Danger */}
        <button className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-semibold rounded-xl text-sm border border-red-100 hover:bg-red-100 active:scale-[0.98] transition-all">
          <LogOut className="w-4 h-4" />
          Log Out
        </button>

        <p className="text-center text-[10px] text-slate-300 pb-4">
          RunMyPG v1.0.0
        </p>
      </div>
    </div>
  )
}

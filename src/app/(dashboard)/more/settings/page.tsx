'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Settings, Building2, IndianRupee, Bell, User, Shield,
  Phone, Mail, Globe, ChevronRight, Camera, LogOut, Check, Lock, FileText,
  Calendar, Tag, Image, Plus, Trash2, CreditCard, Hash,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

function Toggle({ enabled, onToggle, disabled }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button onClick={onToggle} disabled={disabled} className="shrink-0 disabled:opacity-50">
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

interface CustomAmenity {
  id: string
  name: string
  org_id: string
}

export default function SettingsPage() {
  const { user, orgId, orgName, staffName, accountSlug, signOut } = useAuth()
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Org settings from DB
  const [gstEnabled, setGstEnabled] = useState(false)
  const [gstNumber, setGstNumber] = useState('')
  const [autoReminders, setAutoReminders] = useState(true)
  const [whatsappReceipts, setWhatsappReceipts] = useState(true)
  const [mealNotifications, setMealNotifications] = useState(true)
  const [complaintAlerts, setComplaintAlerts] = useState(true)
  const [orgDisplayName, setOrgDisplayName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')

  // Receipt customization
  const [receiptHeader, setReceiptHeader] = useState('')
  const [receiptFooter, setReceiptFooter] = useState('')
  const [receiptPrefix, setReceiptPrefix] = useState('')
  const [receiptShowGst, setReceiptShowGst] = useState(false)

  // Deposit & Pricing
  const [defaultDepositMonths, setDefaultDepositMonths] = useState(1)
  const [proRataFirstMonth, setProRataFirstMonth] = useState(false)
  const [defaultLockinMonths, setDefaultLockinMonths] = useState(0)
  const [lockinEnabled, setLockinEnabled] = useState(false)

  // Booking
  const [bookingFeeEnabled, setBookingFeeEnabled] = useState(false)
  const [defaultBookingFee, setDefaultBookingFee] = useState(0)

  // Logo
  const [logoUrl, setLogoUrl] = useState('')

  // Custom Amenities
  const [amenities, setAmenities] = useState<CustomAmenity[]>([])
  const [newAmenityName, setNewAmenityName] = useState('')
  const [addingAmenity, setAddingAmenity] = useState(false)

  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')

  // Load org settings
  useEffect(() => {
    if (!orgId) return
    supabase
      .from('organizations')
      .select('name, gst_enabled, gst_number, auto_rent_reminders, whatsapp_receipts, meal_notifications, complaint_alerts, phone, receipt_header, receipt_footer, receipt_prefix, receipt_show_gst, default_deposit_months, pro_rata_first_month, default_lockin_months, lockin_enabled, booking_fee_enabled, default_booking_fee, logo_url')
      .eq('id', orgId)
      .single()
      .then(({ data }) => {
        if (data) {
          setOrgDisplayName(data.name || '')
          setGstEnabled(data.gst_enabled || false)
          setGstNumber(data.gst_number || '')
          setAutoReminders(data.auto_rent_reminders ?? true)
          setWhatsappReceipts(data.whatsapp_receipts ?? true)
          setMealNotifications(data.meal_notifications ?? true)
          setComplaintAlerts(data.complaint_alerts ?? true)
          setOwnerPhone(data.phone || '')
          setReceiptHeader(data.receipt_header || '')
          setReceiptFooter(data.receipt_footer || '')
          setReceiptPrefix(data.receipt_prefix || '')
          setReceiptShowGst(data.receipt_show_gst ?? false)
          setDefaultDepositMonths(data.default_deposit_months ?? 1)
          setProRataFirstMonth(data.pro_rata_first_month ?? false)
          setDefaultLockinMonths(data.default_lockin_months ?? 0)
          setLockinEnabled(data.lockin_enabled ?? false)
          setBookingFeeEnabled(data.booking_fee_enabled ?? false)
          setDefaultBookingFee(data.default_booking_fee ?? 0)
          setLogoUrl(data.logo_url || '')
        }
      })

    // Load custom amenities
    supabase
      .from('custom_amenities')
      .select('*')
      .eq('org_id', orgId)
      .then(({ data }) => {
        if (data) setAmenities(data)
      })
  }, [orgId])

  const saveOrgSettings = async (field: string, value: unknown) => {
    if (!orgId) return
    setSaving(true)
    await supabase
      .from('organizations')
      .update({ [field]: value })
      .eq('id', orgId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleAndSave = (field: string, current: boolean, setter: (v: boolean) => void) => {
    setter(!current)
    saveOrgSettings(field, !current)
  }

  const handleAddAmenity = async () => {
    if (!orgId || !newAmenityName.trim()) return
    setAddingAmenity(true)
    const { data, error } = await supabase
      .from('custom_amenities')
      .insert({ org_id: orgId, name: newAmenityName.trim() })
      .select()
      .single()
    if (data && !error) {
      setAmenities((prev) => [...prev, data])
      setNewAmenityName('')
    }
    setAddingAmenity(false)
  }

  const handleDeleteAmenity = async (amenityId: string) => {
    await supabase.from('custom_amenities').delete().eq('id', amenityId)
    setAmenities((prev) => prev.filter((a) => a.id !== amenityId))
  }

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters')
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMsg(error.message)
    } else {
      setPasswordMsg('Password updated successfully!')
      setNewPassword('')
      setShowPasswordChange(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  const initials = staffName
    ? staffName.split(' ').map((n) => n[0]).join('').toUpperCase()
    : 'U'

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/more" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors md:hidden">
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
        {saved && (
          <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <Check className="w-3 h-3" /> Saved
          </span>
        )}
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Profile</p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">{initials}</span>
              </div>
              <div className="flex-1">
                <p className="text-base font-bold text-slate-900">{staffName || 'Owner'}</p>
                <p className="text-xs text-slate-500">Owner</p>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              <SettingRow
                icon={Phone}
                label={ownerPhone || 'No phone set'}
                desc="Phone number"
                right={
                  <button onClick={async () => {
                    const phone = prompt('Enter phone number:')
                    if (phone) {
                      setOwnerPhone(phone)
                      saveOrgSettings('phone', phone)
                    }
                  }} className="text-xs text-primary font-semibold">Change</button>
                }
                color="bg-slate-100 text-slate-500"
              />
              <SettingRow
                icon={Mail}
                label={user?.email || 'N/A'}
                desc="Email address"
                right={<span className="text-[10px] text-slate-300">via Supabase Auth</span>}
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
              desc={orgDisplayName || accountSlug || ''}
              right={
                <button onClick={async () => {
                  const name = prompt('Enter organization name:', orgDisplayName)
                  if (name) {
                    setOrgDisplayName(name)
                    saveOrgSettings('name', name)
                  }
                }} className="text-xs text-primary font-semibold">Edit</button>
              }
              color="bg-indigo-50 text-indigo-500"
            />
            <SettingRow
              icon={IndianRupee}
              label="GST Billing"
              desc={gstEnabled ? 'GST @ 18% added to invoices' : 'No GST on invoices'}
              right={<Toggle enabled={gstEnabled} onToggle={() => toggleAndSave('gst_enabled', gstEnabled, setGstEnabled)} />}
              color="bg-amber-50 text-amber-500"
            />
            {gstEnabled && (
              <div className="px-4 py-3 bg-amber-50/50">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">GST Number</label>
                <input
                  type="text"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  onBlur={() => saveOrgSettings('gst_number', gstNumber)}
                  placeholder="e.g., 29ABCDE1234F1Z5"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-[10px] text-amber-600 mt-1">CGST 9% + SGST 9% will be added to all rent invoices</p>
              </div>
            )}
            <SettingRow
              icon={Globe}
              label="Account Slug"
              desc={accountSlug || ''}
              right={<span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{accountSlug}</span>}
              color="bg-slate-100 text-slate-500"
            />
          </div>
        </div>

        {/* Logo Upload */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Logo</p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3">
              {logoUrl && (
                <div className="mb-3 flex items-center gap-3">
                  <img src={logoUrl} alt="Organization logo" className="w-12 h-12 rounded-lg object-contain border border-slate-200" />
                  <p className="text-xs text-slate-500 truncate flex-1">{logoUrl}</p>
                </div>
              )}
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Logo URL</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                onBlur={() => saveOrgSettings('logo_url', logoUrl)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-[10px] text-slate-400 mt-1">Paste a URL to your logo image. Shown on receipts and tenant portal.</p>
            </div>
          </div>
        </div>

        {/* Deposit & Pricing */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Deposit & Pricing</p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            <div className="px-4 py-3">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Default Deposit Months</label>
              <input
                type="number"
                min={0}
                max={12}
                value={defaultDepositMonths}
                onChange={(e) => setDefaultDepositMonths(Number(e.target.value))}
                onBlur={() => saveOrgSettings('default_deposit_months', defaultDepositMonths)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-[10px] text-slate-400 mt-1">Number of months deposit required at check-in</p>
            </div>
            <SettingRow
              icon={Calendar}
              label="Pro-rata First Month"
              desc={proRataFirstMonth ? 'First month rent calculated pro-rata' : 'Full first month rent charged'}
              right={<Toggle enabled={proRataFirstMonth} onToggle={() => toggleAndSave('pro_rata_first_month', proRataFirstMonth, setProRataFirstMonth)} />}
              color="bg-blue-50 text-blue-500"
            />
            <SettingRow
              icon={Lock}
              label="Lock-in Enabled"
              desc={lockinEnabled ? 'Lock-in period applies to tenants' : 'No lock-in period'}
              right={<Toggle enabled={lockinEnabled} onToggle={() => toggleAndSave('lockin_enabled', lockinEnabled, setLockinEnabled)} />}
              color="bg-purple-50 text-purple-500"
            />
            {lockinEnabled && (
              <div className="px-4 py-3">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Default Lock-in Months</label>
                <select
                  value={defaultLockinMonths}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setDefaultLockinMonths(val)
                    saveOrgSettings('default_lockin_months', val)
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                >
                  <option value={0}>No lock-in</option>
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={11}>11 months</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Default lock-in period for new tenants</p>
              </div>
            )}
          </div>
        </div>

        {/* Booking */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Booking</p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            <SettingRow
              icon={CreditCard}
              label="Booking Fee Enabled"
              desc={bookingFeeEnabled ? 'Booking fee charged on reservation' : 'No booking fee'}
              right={<Toggle enabled={bookingFeeEnabled} onToggle={() => toggleAndSave('booking_fee_enabled', bookingFeeEnabled, setBookingFeeEnabled)} />}
              color="bg-teal-50 text-teal-500"
            />
            {bookingFeeEnabled && (
              <div className="px-4 py-3">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Default Booking Fee Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">&#8377;</span>
                  <input
                    type="number"
                    min={0}
                    value={defaultBookingFee}
                    onChange={(e) => setDefaultBookingFee(Number(e.target.value))}
                    onBlur={() => saveOrgSettings('default_booking_fee', defaultBookingFee)}
                    placeholder="e.g., 2000"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Default amount charged as booking fee</p>
              </div>
            )}
          </div>
        </div>

        {/* Custom Amenities */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Custom Amenities</p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {amenities.length > 0 && (
              <div className="divide-y divide-slate-50">
                {amenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="p-2 rounded-lg bg-cyan-50">
                      <Tag className="w-4 h-4 text-cyan-500" />
                    </div>
                    <p className="text-sm font-medium text-slate-800 flex-1">{amenity.name}</p>
                    <button
                      onClick={() => handleDeleteAmenity(amenity.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {amenities.length === 0 && (
              <div className="px-4 py-4 text-center">
                <p className="text-xs text-slate-400">No custom amenities yet</p>
              </div>
            )}
            <div className="px-4 py-3 border-t border-slate-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAmenityName}
                  onChange={(e) => setNewAmenityName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddAmenity() }}
                  placeholder="e.g., Laundry, Parking, Gym"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <button
                  onClick={handleAddAmenity}
                  disabled={!newAmenityName.trim() || addingAmenity}
                  className="px-3 py-2 bg-primary text-white font-semibold rounded-lg text-sm hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Customization */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Receipt Customization</p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            <div className="px-4 py-3">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Receipt Header Text</label>
              <input
                type="text"
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                onBlur={() => saveOrgSettings('receipt_header', receiptHeader)}
                placeholder="e.g., Premium PG Accommodation"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-[10px] text-slate-400 mt-1">Shown below the organization name on receipts</p>
            </div>
            <div className="px-4 py-3">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Receipt Footer Text</label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                onBlur={() => saveOrgSettings('receipt_footer', receiptFooter)}
                placeholder="e.g., Thank you for choosing us!"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-[10px] text-slate-400 mt-1">Shown at the bottom of each receipt</p>
            </div>
            <div className="px-4 py-3">
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Receipt Number Prefix</label>
              <input
                type="text"
                value={receiptPrefix}
                onChange={(e) => setReceiptPrefix(e.target.value)}
                onBlur={() => saveOrgSettings('receipt_prefix', receiptPrefix)}
                placeholder="e.g., RCP"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-[10px] text-slate-400 mt-1">Prefix added before receipt numbers (default: RCP)</p>
            </div>
            <SettingRow
              icon={FileText}
              label="Show GST on Receipts"
              desc={receiptShowGst ? 'CGST + SGST breakdown shown' : 'GST not shown on receipts'}
              right={<Toggle enabled={receiptShowGst} onToggle={() => toggleAndSave('receipt_show_gst', receiptShowGst, setReceiptShowGst)} />}
              color="bg-violet-50 text-violet-500"
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
              right={<Toggle enabled={autoReminders} onToggle={() => toggleAndSave('auto_rent_reminders', autoReminders, setAutoReminders)} />}
              color="bg-emerald-50 text-emerald-500"
            />
            <SettingRow
              icon={IndianRupee}
              label="WhatsApp Receipts"
              desc="Auto-send receipt after payment"
              right={<Toggle enabled={whatsappReceipts} onToggle={() => toggleAndSave('whatsapp_receipts', whatsappReceipts, setWhatsappReceipts)} />}
              color="bg-emerald-50 text-emerald-500"
            />
            <SettingRow
              icon={Bell}
              label="Meal Opt-out Alerts"
              desc="Notify when tenants skip meals"
              right={<Toggle enabled={mealNotifications} onToggle={() => toggleAndSave('meal_notifications', mealNotifications, setMealNotifications)} />}
              color="bg-orange-50 text-orange-500"
            />
            <SettingRow
              icon={Bell}
              label="New Complaint Alerts"
              desc="Notify when a complaint is filed"
              right={<Toggle enabled={complaintAlerts} onToggle={() => toggleAndSave('complaint_alerts', complaintAlerts, setComplaintAlerts)} />}
              color="bg-red-50 text-red-500"
            />
          </div>
        </div>

        {/* Security */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Security</p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
            {!showPasswordChange ? (
              <button onClick={() => setShowPasswordChange(true)} className="w-full">
                <SettingRow
                  icon={Lock}
                  label="Change Password"
                  right={<ChevronRight className="w-4 h-4 text-slate-300" />}
                  color="bg-slate-100 text-slate-500"
                />
              </button>
            ) : (
              <div className="px-4 py-3">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">New Password</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={handlePasswordChange}
                    className="px-4 py-2 bg-primary text-white font-semibold rounded-lg text-sm hover:bg-primary-dark"
                  >
                    Update
                  </button>
                </div>
                {passwordMsg && <p className="text-xs text-emerald-600 mt-1">{passwordMsg}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-semibold rounded-xl text-sm border border-red-100 hover:bg-red-100 active:scale-[0.98] transition-all"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>

        <p className="text-center text-[10px] text-slate-300 pb-4">RunMyPG v1.0.0</p>
      </div>
    </div>
  )
}

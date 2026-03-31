'use client'

import { useState } from 'react'
import {
  User,
  Phone,
  Mail,
  CreditCard,
  Briefcase,
  Building2,
  BedDouble,
  IndianRupee,
  Calendar,
  Camera,
  Shield,
  ChevronDown,
  Check,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { getFullPropertyTree } from '@/lib/services/property'
import { checkIn } from '@/lib/services/tenants'
import { ListSkeleton, EmptyState } from '@/components/loading-skeleton'
import type { Floor, Room, Bed } from '@/lib/types'

// ── Step indicator ──────────────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ['Bed', 'Personal', 'ID & Work', 'Rent']

  return (
    <div className="flex items-center gap-1 mb-6">
      {steps.map((label, i) => (
        <div key={label} className="flex-1 flex flex-col items-center gap-1">
          <div className={`w-full h-1.5 rounded-full transition-colors ${
            i <= currentStep ? 'bg-primary' : 'bg-slate-200'
          }`} />
          <span className={`text-[10px] font-medium ${
            i <= currentStep ? 'text-primary' : 'text-slate-400'
          }`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Input component ─────────────────────────────────────────────────

function FormInput({ label, icon: Icon, ...props }: { label: string; icon: typeof User } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 mb-1 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          {...props}
          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
    </div>
  )
}

// ── Main Form ───────────────────────────────────────────────────────

export default function CheckinForm() {
  const { orgId } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedFloor, setSelectedFloor] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [selectedBed, setSelectedBed] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [fatherPhone, setFatherPhone] = useState('')
  const [motherName, setMotherName] = useState('')
  const [motherPhone, setMotherPhone] = useState('')
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [occupation, setOccupation] = useState('')
  const [companyOrCollege, setCompanyOrCollege] = useState('')
  const [monthlyRent, setMonthlyRent] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [rentDueDay, setRentDueDay] = useState('1')
  const [checkinDate, setCheckinDate] = useState(new Date().toISOString().split('T')[0])

  const { data: property, loading } = useQuery(
    () => getFullPropertyTree(orgId!),
    [orgId]
  )

  if (loading) {
    return <ListSkeleton rows={4} />
  }

  const floors = property?.floors ?? []
  const rooms = property?.rooms ?? []
  const beds = property?.beds ?? []

  if (floors.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No property set up yet"
        description="Go to Property Setup to add buildings before checking in tenants."
      />
    )
  }

  const vacantBeds = beds.filter((b) => b.status === 'vacant')
  const availableFloors = floors.filter((f) =>
    rooms.some((r) =>
      r.floor_id === f.id && beds.some((b) => b.room_id === r.id && b.status === 'vacant')
    )
  )
  const availableRooms = selectedFloor
    ? rooms.filter((r) =>
        r.floor_id === selectedFloor && beds.some((b) => b.room_id === r.id && b.status === 'vacant')
      )
    : []
  const availableBeds = selectedRoom
    ? beds.filter((b) => b.room_id === selectedRoom && b.status === 'vacant')
    : []

  const selectedRoomData = rooms.find((r) => r.id === selectedRoom)

  // Set default rent when room is selected
  const handleRoomSelect = (roomId: string) => {
    setSelectedRoom(roomId)
    setSelectedBed('')
    const room = rooms.find((r) => r.id === roomId)
    if (room?.base_rent) {
      setMonthlyRent(String(room.base_rent))
      setDepositAmount(String(room.base_rent))
    }
  }

  const handleSubmit = async () => {
    if (!orgId || !selectedBed) return
    setSubmitting(true)
    setError(null)
    try {
      await checkIn(
        orgId,
        selectedBed,
        {
          fullName,
          phone,
          email: email || undefined,
          fatherName: fatherName || undefined,
          fatherPhone: fatherPhone || undefined,
          motherName: motherName || undefined,
          motherPhone: motherPhone || undefined,
          aadhaarNumber: aadhaarNumber || undefined,
          occupation: occupation || undefined,
          companyOrCollege: companyOrCollege || undefined,
        },
        {
          monthlyRent: Number(monthlyRent),
          depositAmount: Number(depositAmount),
          rentDueDay: Number(rentDueDay),
        }
      )
      router.push('/tenants')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <StepIndicator currentStep={step} />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
          <p className="text-xs font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Step 0: Select Bed */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-2 mb-2">
            <BedDouble className="w-5 h-5 text-emerald-600" />
            <p className="text-xs font-medium text-emerald-700">
              {vacantBeds.length} beds available for check-in
            </p>
          </div>

          {/* Floor */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Select Floor</label>
            <div className="relative">
              <select
                value={selectedFloor}
                onChange={(e) => { setSelectedFloor(e.target.value); setSelectedRoom(''); setSelectedBed('') }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">Choose a floor...</option>
                {availableFloors.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Room */}
          {selectedFloor && (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Select Room</label>
              <div className="grid grid-cols-2 gap-2">
                {availableRooms.map((room) => {
                  const roomBeds = beds.filter((b) => b.room_id === room.id && b.status === 'vacant')
                  return (
                    <button
                      key={room.id}
                      onClick={() => handleRoomSelect(room.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedRoom === room.id
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-800">{room.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {roomBeds.length} bed{roomBeds.length > 1 ? 's' : ''} free &middot; ₹{room.base_rent?.toLocaleString('en-IN')}
                      </p>
                      <div className="flex gap-1 mt-1.5">
                        {room.has_ac && <span className="text-[9px] bg-blue-50 text-blue-600 px-1 rounded font-medium">AC</span>}
                        {room.has_attached_bathroom && <span className="text-[9px] bg-cyan-50 text-cyan-600 px-1 rounded font-medium">Bath</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Bed */}
          {selectedRoom && (
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Select Bed</label>
              <div className="flex gap-2">
                {availableBeds.map((bed) => (
                  <button
                    key={bed.id}
                    onClick={() => setSelectedBed(bed.id)}
                    className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all ${
                      selectedBed === bed.id
                        ? 'border-primary bg-primary/5'
                        : 'border-emerald-200 bg-emerald-50 hover:border-emerald-300'
                    }`}
                  >
                    <BedDouble className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px] font-bold text-slate-600">{bed.bed_number.replace('Bed ', '')}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setStep(1)}
            disabled={!selectedBed}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 1: Personal Details */}
      {step === 1 && (
        <div className="space-y-3">
          {/* Photo capture */}
          <div className="flex justify-center mb-2">
            <button className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-all">
              <Camera className="w-6 h-6 text-slate-400" />
              <span className="text-[10px] font-medium text-slate-400">Add Photo</span>
            </button>
          </div>

          <FormInput label="Full Name" icon={User} placeholder="Enter full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <FormInput label="Phone Number" icon={Phone} placeholder="+91 XXXXX XXXXX" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <FormInput label="Email (Optional)" icon={Mail} placeholder="email@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Emergency Contact - Father</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input placeholder="Father's name" value={fatherName} onChange={(e) => setFatherName(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input placeholder="Phone" type="tel" value={fatherPhone} onChange={(e) => setFatherPhone(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Emergency Contact - Mother</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input placeholder="Mother's name" value={motherName} onChange={(e) => setMotherName(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input placeholder="Phone" type="tel" value={motherPhone} onChange={(e) => setMotherPhone(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setStep(0)}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-200 active:scale-[0.98] transition-all"
            >
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              className="flex-[2] py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: ID & Work */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2 mb-2">
            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-700">Aadhaar Verification</p>
              <p className="text-[11px] text-blue-600 mt-0.5">Enter the Aadhaar number to verify identity through the government database</p>
            </div>
          </div>

          <FormInput label="Aadhaar Number" icon={CreditCard} placeholder="XXXX XXXX XXXX" value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} />

          <button className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Verify Aadhaar
          </button>

          <div className="border-t border-slate-100 pt-3 mt-1">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Occupation</label>
              <div className="flex gap-2">
                {['Working', 'Student', 'Other'].map((occ) => (
                  <button
                    key={occ}
                    onClick={() => setOccupation(occ)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-all ${
                      occupation === occ
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {occ}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3">
              <FormInput label="Company / College" icon={Briefcase} placeholder="Name of company or college" value={companyOrCollege} onChange={(e) => setCompanyOrCollege(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-200 active:scale-[0.98] transition-all"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-[2] py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Rent Details */}
      {step === 3 && (
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-xl p-3 mb-2">
            <p className="text-xs font-semibold text-slate-500 mb-1">Selected Bed</p>
            <p className="text-sm font-bold text-slate-800">
              {selectedRoomData?.name} &mdash; {availableBeds.find((b) => b.id === selectedBed)?.bed_number}
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Monthly Rent</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Security Deposit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Rent Due Day</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={rentDueDay}
                onChange={(e) => setRentDueDay(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {[1, 5, 10, 15, 20, 25].map((d) => (
                  <option key={d} value={d}>{d}{ordinal(d)} of every month</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Check-in Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={checkinDate}
                onChange={(e) => setCheckinDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-200 active:scale-[0.98] transition-all"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-[2] py-3 bg-emerald-600 text-white font-semibold rounded-xl text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <span>Checking in...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Complete Check-In
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

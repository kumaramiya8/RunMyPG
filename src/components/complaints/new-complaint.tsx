'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Zap,
  Droplets,
  Sofa,
  SprayCan,
  HelpCircle,
  Camera,
  ChevronDown,
  Check,
  Building2,
  AlertTriangle,
} from 'lucide-react'
import { mockRooms, mockFloors } from '@/lib/mock-data'

const categories = [
  { key: 'Electrical', label: 'Electrical', icon: Zap, color: 'bg-yellow-50 text-yellow-600 border-yellow-200', desc: 'Fan, light, AC, wiring' },
  { key: 'Plumbing', label: 'Plumbing', icon: Droplets, color: 'bg-blue-50 text-blue-600 border-blue-200', desc: 'Tap, toilet, pipe, geyser' },
  { key: 'Furniture', label: 'Furniture', icon: Sofa, color: 'bg-orange-50 text-orange-600 border-orange-200', desc: 'Bed, chair, table, cupboard' },
  { key: 'Cleaning', label: 'Cleaning', icon: SprayCan, color: 'bg-teal-50 text-teal-600 border-teal-200', desc: 'Room, bathroom, common area' },
  { key: 'Other', label: 'Other', icon: HelpCircle, color: 'bg-slate-50 text-slate-600 border-slate-200', desc: 'Anything else' },
]

const priorities = [
  { key: 'low', label: 'Low', desc: 'Can wait a few days', color: 'border-slate-200 bg-slate-50' },
  { key: 'medium', label: 'Medium', desc: 'Should fix this week', color: 'border-blue-200 bg-blue-50' },
  { key: 'high', label: 'High', desc: 'Needs attention today', color: 'border-amber-200 bg-amber-50' },
  { key: 'urgent', label: 'Urgent', desc: 'Safety issue, fix now', color: 'border-red-200 bg-red-50' },
]

export default function NewComplaint() {
  const [category, setCategory] = useState('')
  const [roomId, setRoomId] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [saved, setSaved] = useState(false)

  if (saved) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Complaint Submitted</h3>
        <p className="text-sm text-slate-500 mt-1">
          Your {category.toLowerCase()} issue has been logged
        </p>
        <p className="text-xs text-slate-400 mt-2">
          The tenant will be notified when it&apos;s resolved
        </p>
        <div className="flex gap-2 mt-6 max-w-xs mx-auto">
          <button
            onClick={() => { setSaved(false); setCategory(''); setDescription(''); setRoomId('') }}
            className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            Log Another
          </button>
          <Link
            href="/more/complaints"
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
                <div className={`p-2 rounded-lg ${cat.color.split(' ').slice(0, 1).join(' ')}`}>
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

      {/* Room */}
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1 block">Which room?</label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="">Select a room...</option>
            {mockFloors.map((floor) => (
              <optgroup key={floor.id} label={floor.name}>
                {mockRooms.filter((r) => r.floor_id === floor.id).map((room) => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
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

      {/* Photo */}
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1 block">Attach a photo (optional)</label>
        <button className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 transition-all">
          <Camera className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-400">Take or upload photo</span>
        </button>
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

      {/* Submit */}
      <button
        onClick={() => setSaved(true)}
        disabled={!category || !roomId || !description}
        className="w-full py-3.5 bg-red-600 text-white font-semibold rounded-xl text-sm hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <AlertTriangle className="w-4 h-4" />
        Submit Complaint
      </button>
    </div>
  )
}

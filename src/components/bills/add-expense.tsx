'use client'

import { useState } from 'react'
import {
  IndianRupee,
  Calendar,
  FileText,
  Tag,
  Check,
  Droplets,
  Zap,
  UtensilsCrossed,
  Wrench,
  Wifi,
  SprayCan,
  UserCog,
  HelpCircle,
} from 'lucide-react'
import Link from 'next/link'

const categories = [
  { key: 'Water', label: 'Water', icon: Droplets, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { key: 'Electricity', label: 'Electricity', icon: Zap, color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  { key: 'Food', label: 'Food', icon: UtensilsCrossed, color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { key: 'Maintenance', label: 'Maintenance', icon: Wrench, color: 'bg-red-50 text-red-600 border-red-200' },
  { key: 'Wi-Fi', label: 'Wi-Fi', icon: Wifi, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { key: 'Cleaning', label: 'Cleaning', icon: SprayCan, color: 'bg-teal-50 text-teal-600 border-teal-200' },
  { key: 'Staff', label: 'Staff Salary', icon: UserCog, color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { key: 'Other', label: 'Other', icon: HelpCircle, color: 'bg-slate-50 text-slate-600 border-slate-200' },
]

export default function AddExpense() {
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saved, setSaved] = useState(false)

  if (saved) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Expense Saved</h3>
        <p className="text-sm text-slate-500 mt-1">
          ₹{Number(amount).toLocaleString('en-IN')} logged under {category}
        </p>
        <div className="flex gap-2 mt-6 max-w-xs mx-auto">
          <button
            onClick={() => { setSaved(false); setCategory(''); setDescription(''); setAmount('') }}
            className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm text-center hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            Add Another
          </button>
          <Link
            href="/bills/expenses"
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
        <label className="text-xs font-semibold text-slate-600 mb-2 block">Category</label>
        <div className="grid grid-cols-4 gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon
            const isSelected = category === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${cat.color.split(' ').slice(0, 1).join(' ')}`}>
                  <Icon className={`w-4 h-4 ${cat.color.split(' ')[1]}`} />
                </div>
                <span className="text-[10px] font-medium text-slate-700 text-center leading-tight">{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1 block">Amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₹</span>
          <input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-8 pr-3 py-3 rounded-xl border border-slate-200 text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1 block">Description</label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="e.g., Water tanker delivery"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1 block">Date</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Save */}
      <button
        onClick={() => setSaved(true)}
        disabled={!category || !amount || !description}
        className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Check className="w-4 h-4" />
        Save Expense
      </button>
    </div>
  )
}

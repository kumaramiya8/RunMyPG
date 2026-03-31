'use client'

import { ArrowLeft, Receipt } from 'lucide-react'
import Link from 'next/link'
import ExpenseList from '@/components/bills/expense-list'

export default function ExpensesPage() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/bills"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50">
            <Receipt className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Expenses</h1>
            <p className="text-xs text-slate-500">March 2026 expenses</p>
          </div>
        </div>
      </div>
      <ExpenseList />
    </div>
  )
}

'use client'

import { ArrowLeft, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import AddExpense from '@/components/bills/add-expense'

export default function NewExpensePage() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/bills/expenses"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <PlusCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Add Expense</h1>
            <p className="text-xs text-slate-500">Log a daily expense</p>
          </div>
        </div>
      </div>
      <AddExpense />
    </div>
  )
}

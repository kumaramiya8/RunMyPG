'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import KitchenDisplay from '@/components/meals/kitchen-display'

export default function KitchenPage() {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <Link
        href="/more/meals"
        className="fixed top-4 left-4 z-[60] p-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors backdrop-blur-sm"
      >
        <ArrowLeft className="w-5 h-5 text-white" />
      </Link>
      <KitchenDisplay />
    </div>
  )
}

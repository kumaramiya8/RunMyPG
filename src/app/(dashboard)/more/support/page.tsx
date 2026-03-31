'use client'

import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  ChevronRight,
  BookOpen,
  Video,
  FileQuestion,
} from 'lucide-react'
import Link from 'next/link'

const faqs = [
  { q: 'How do I add a new floor or room?', a: 'Go to More → Property Setup, expand a building, and tap the + button on any floor.' },
  { q: 'How do I enable GST on invoices?', a: 'Go to More → Settings and toggle "GST Billing" on. Enter your GST number.' },
  { q: 'Can my warden see the financials?', a: 'No, by default wardens cannot see finances. You can customize permissions in Staff Access.' },
  { q: 'How do rent reminders work?', a: 'Go to Messages → Auto Reminders. The system sends WhatsApp reminders based on each tenant\'s due date.' },
]

export default function SupportPage() {
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
          <div className="p-2.5 rounded-xl bg-amber-50">
            <HelpCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Help & Support</h1>
            <p className="text-xs text-slate-500">Get help with the app</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Contact support */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 text-white">
          <h3 className="text-base font-bold mb-1">Need help?</h3>
          <p className="text-xs text-white/70 mb-4">Our support team is available Mon-Sat, 9 AM to 7 PM</p>
          <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/20 rounded-xl text-xs font-semibold hover:bg-white/30 active:scale-[0.98] transition-all">
              <MessageCircle className="w-4 h-4" />
              Live Chat
            </button>
            <a href="tel:+919876543210" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/20 rounded-xl text-xs font-semibold hover:bg-white/30 active:scale-[0.98] transition-all">
              <Phone className="w-4 h-4" />
              Call Us
            </a>
          </div>
        </div>

        {/* Contact details */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <Phone className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">+91 98765 43210</p>
              <p className="text-[10px] text-slate-400">Phone support</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">support@runmypg.in</p>
              <p className="text-[10px] text-slate-400">Email support</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">Mon-Sat, 9 AM - 7 PM</p>
              <p className="text-[10px] text-slate-400">Working hours (IST)</p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Frequently Asked Questions
          </p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
            {faqs.map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none hover:bg-slate-50/50 transition-colors">
                  <div className="p-1.5 rounded-lg bg-slate-100">
                    <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="flex-1 text-sm font-medium text-slate-800">{faq.q}</p>
                  <ChevronRight className="w-4 h-4 text-slate-300 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-3 pl-12">
                  <p className="text-xs text-slate-500 leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Resources</p>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 cursor-pointer transition-colors">
              <div className="p-2 rounded-lg bg-blue-50"><BookOpen className="w-4 h-4 text-blue-600" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-slate-800">User Guide</p></div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 cursor-pointer transition-colors">
              <div className="p-2 rounded-lg bg-red-50"><Video className="w-4 h-4 text-red-600" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-slate-800">Video Tutorials</p></div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

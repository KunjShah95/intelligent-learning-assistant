'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, BookOpen, Coffee, Heart, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FDFBF7]/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-gray-900">LearnAI</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-gray-600 hover:text-gray-900 font-medium">
              Sign in
            </Link>
            <Link 
              href="/sign-up" 
              className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Try free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Finally, a tutor that{' '}
            <span className="text-orange-500">actually</span> {' '}gets you
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            We got tired of explanations that assume too much or too little. 
            This learns how you learn — and adapts accordingly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/sign-up" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
            >
              Start learning
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              See how it works
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            No credit card · 2-minute setup
          </p>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xl">😤</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">The old way sucks</h3>
                <p className="text-gray-600">
                  You ask a simple question and get a 5-paragraph essay. 
                  Or you need help and get &quot;try Google it.&quot; 
                  Nothing in between.
                </p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">We fixed it</h3>
                <p className="text-gray-600">
                  Tell us how you learn best. Want simple? We simplify. 
                  Need analogies? We analogize. Want step-by-step? 
                  We walk through it slowly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's included - less generic */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            What&apos;s actually included
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: '💬', title: 'Chat that listens', desc: 'Explains at YOUR level, not some default' },
              { icon: '🎯', title: 'Quiz that adapts', desc: 'Gets easier or harder based on how you do' },
              { icon: '📊', title: 'Progress you see', desc: 'No fluff — just what you actually know' },
              { icon: '🔥', title: 'Streaks that motivate', desc: 'Little wins that add up over time' },
              { icon: '🗺️', title: 'Your learning path', desc: 'Not random — based on what you need next' },
              { icon: '🔄', title: 'Spaced repetition', desc: 'Review before you forget — science!' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-100">
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why we built this - human story */}
      <section className="py-16 px-6 bg-orange-50">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-gray-900">Why we built this</span>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              We were tutors. The kind that sat with students one-on-one. 
              And we noticed something: everyone needed a different explanation 
              for the same concept.
            </p>
            <p className="text-gray-700 leading-relaxed">
              So we built this — to give every student their own personal tutor 
              that actually pays attention to how they learn. 
              No more one-size-fits-all.
            </p>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to try something different?
          </h2>
          <p className="text-gray-600 mb-6">
            2 minutes to set up. No tricks. No hidden anything.
          </p>
          <Link 
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition"
          >
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">L</span>
            </div>
            <span className="text-gray-600">LearnAI</span>
          </div>
          <p className="text-gray-400 text-sm">
            Made by people who actually tutor
          </p>
        </div>
      </footer>
    </div>
  );
}

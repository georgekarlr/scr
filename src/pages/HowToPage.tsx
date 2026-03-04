import React from 'react'
import { 
  BookOpen, 
  PlusCircle, 
  Layers, 
  Settings, 
  PlayCircle, 
  Users, 
  ArrowRight,
  Plus,
  Edit2,
  Copy,
  CheckCircle2,
  Star,
  MessageCircle,
  Trophy,
  Zap,
  HelpCircle
} from 'lucide-react'

interface FeatureProps {
  icon: React.ElementType
  title: string
  description: string
  color: string
}

const Feature: React.FC<FeatureProps> = ({ icon: Icon, title, description, color }) => (
  <div className="flex gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
    <div className={`p-3 rounded-xl ${color} shrink-0 self-start`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
)

interface StepProps {
  number: string
  title: string
  description: string
}

const Step: React.FC<StepProps> = ({ number, title, description }) => (
  <div className="flex gap-4 group">
    <div className="flex-none w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
      {number}
    </div>
    <div className="pt-2">
      <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
)

interface SectionProps {
  id: string
  title: string
  description: string
  icon: React.ElementType
  children: React.ReactNode
  badge?: string
}

const Section: React.FC<SectionProps> = ({ id, title, description, icon: Icon, children, badge }) => (
  <section id={id} className="scroll-mt-24 space-y-8">
    <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
      <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
        <Icon className="h-8 w-8" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
          {badge && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-gray-500 font-medium">{description}</p>
      </div>
    </div>
    {children}
  </section>
)

const HowToPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-16 space-y-4">
        <div className="flex justify-center mb-6">
          <img src="/icon.svg" alt="Ceintelly" className="h-16 w-16 sm:h-20 sm:w-20 drop-shadow-sm" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-100">
          <HelpCircle className="h-3 w-3" />
          <span>User Guide</span>
        </div>
        <h1 className="text-5xl font-black text-gray-900 tracking-tight sm:text-6xl">
          Master Ceintelly
        </h1>
        <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto">
          Everything you need to know about creating, studying, and collaborating on our platform.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1">
          <nav className="sticky top-24 space-y-1">
            {[
              { id: 'getting-started', label: 'Getting Started', icon: BookOpen },
              { id: 'study-modes', label: '7 Study Modes', icon: Layers },
              { id: 'management', label: 'Managing Sets', icon: Settings },
              { id: 'study-session', label: 'Study Session', icon: PlayCircle },
              { id: 'social', label: 'Social Learning', icon: Users },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:text-blue-600 transition-all group"
              >
                <item.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3 space-y-24">
          {/* Section 1: Getting Started */}
          <Section 
            id="getting-started"
            title="Getting Started" 
            description="How to create your first study set and choose a subject."
            icon={PlusCircle}
          >
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                <div className="space-y-6">
                  <Step 
                    number="01" 
                    title="Start New Set" 
                    description="Click the 'Create' button on your dashboard to open the Create Set Modal." 
                  />
                  <Step 
                    number="02" 
                    title="Define Metadata" 
                    description="Enter a clear title and description. Select a subject (e.g., Medicine, Engineering) to help others find your content." 
                  />
                  <Step 
                    number="03" 
                    title="Set Privacy" 
                    description="Choose between 'Public' (shared with community) or 'Private' (only for you)." 
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Section 2: 7 Study Modes */}
          <Section 
            id="study-modes"
            title="The 7 Study Modes" 
            description="Master our dynamic content engine with interactive learning styles."
            icon={Layers}
            badge="Toolkit"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Feature 
                icon={BookOpen} 
                title="Flashcards" 
                description="Classic front/back recall with image support." 
                color="bg-blue-100 text-blue-600"
              />
              <Feature 
                icon={CheckCircle2} 
                title="Quizzes" 
                description="Multiple-choice testing for assessment." 
                color="bg-green-100 text-green-600"
              />
              <Feature 
                icon={Layers} 
                title="Checkboxes" 
                description="Multi-select concepts for complex topics." 
                color="bg-purple-100 text-purple-600"
              />
              <Feature 
                icon={Edit2} 
                title="Written Answers" 
                description="Type-in responses for deep active recall." 
                color="bg-orange-100 text-orange-600"
              />
              <Feature 
                icon={Zap} 
                title="Matching Pairs" 
                description="Drag-and-drop associations between terms." 
                color="bg-yellow-100 text-yellow-600"
              />
              <Feature 
                icon={ArrowRight} 
                title="Ordering" 
                description="Sequence logic and chronological timelines." 
                color="bg-indigo-100 text-indigo-600"
              />
              <Feature 
                icon={Edit2} 
                title="Rich Notes" 
                description="Markdown summaries with attachments." 
                color="bg-pink-100 text-pink-600"
              />
            </div>
          </Section>

          {/* Section 3: Editing and Managing Sets */}
          <Section 
            id="management"
            title="Managing Your Library" 
            description="Organize, edit, and curate your personal collection."
            icon={Settings}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <Edit2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-gray-900">Editing Sets</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">Reopen any set to modify metadata, reorder items with drag-and-drop, or update content.</p>
                <ul className="space-y-2">
                  {['Reorder items', 'Update descriptions', 'Change privacy'].map(t => (
                    <li key={t} className="flex items-center gap-2 text-xs font-medium text-gray-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Copy className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-gray-900">Library Cloning</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">Instantly copy expert-made public sets into your library and customize them for your own use.</p>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                  <Plus className="h-3 w-3" />
                  Clone & Study
                </div>
              </div>
            </div>
          </Section>

          {/* Section 4: Study Session */}
          <Section 
            id="study-session"
            title="The Study Experience" 
            description="How the active recall system helps you retain information."
            icon={PlayCircle}
          >
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <Zap className="h-6 w-6 text-yellow-300" />
                  </div>
                  <h3 className="font-bold text-lg">Active Recall</h3>
                  <p className="text-indigo-100 text-sm leading-relaxed">System tracks performance in real-time, focusing on items you find difficult.</p>
                </div>
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <Trophy className="h-6 w-6 text-orange-300" />
                  </div>
                  <h3 className="font-bold text-lg">Gamification</h3>
                  <p className="text-indigo-100 text-sm leading-relaxed">Earn XP and build Daily Streaks for every session you complete.</p>
                </div>
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20">
                    <Layers className="h-6 w-6 text-blue-300" />
                  </div>
                  <h3 className="font-bold text-lg">Smart Review</h3>
                  <p className="text-indigo-100 text-sm leading-relaxed">Our Spaced Repetition algorithm schedules the perfect time for your next review.</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Section 5: Social Learning */}
          <Section 
            id="social"
            title="Learning is Better Together" 
            description="Collaborate, engage, and grow with the community."
            icon={Users}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0 self-start">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">The Feed</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Discover new study sets and see real-time activity from experts you follow.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-3 rounded-xl bg-pink-50 text-pink-600 shrink-0 self-start">
                  <Star className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Engagement</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Like, comment, and rate (1-5 stars) sets to provide feedback to creators.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm md:col-span-2">
                <div className="p-3 rounded-xl bg-green-50 text-green-600 shrink-0 self-start">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Collaboration</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">Use the messaging system to share sets directly with friends or form study groups.</p>
                </div>
              </div>
            </div>
          </Section>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-24 pt-12 border-t border-gray-100">
        <div className="bg-gray-900 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Create your first study set now and join thousands of students mastering their subjects smarter.
          </p>
          <a 
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
          >
            Go to Dashboard
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
        <p className="text-center text-gray-400 text-sm mt-12">
          © 2026 Ceintelly, Inc. | Stop Studying Alone. Start Studying Smarter.
        </p>
      </div>
    </div>
  )
}

export default HowToPage

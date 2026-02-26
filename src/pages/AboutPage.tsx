import React from 'react'
import { Info, Target, Users, Zap, Clock, Rocket } from 'lucide-react'

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-4 bg-blue-100 rounded-2xl shadow-sm">
          <Info className="h-10 w-10 text-blue-600" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">About Ceintelly</h1>
          <p className="text-lg text-gray-500 font-medium">Empowering the next generation of learners.</p>
        </div>
      </div>

      <div className="prose prose-blue max-w-none space-y-12">
        <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-6 w-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900 m-0">Our Mission</h2>
          </div>
          <p className="text-gray-600 leading-relaxed text-lg">
            Ceintelly is dedicated to transforming the way people learn by combining social interaction with proven educational techniques. 
            We believe that learning should be collaborative, engaging, and accessible to everyone, everywhere. 
            Our platform provides the tools you need to master any subject while connecting with a community of like-minded students and educators.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-6 w-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-gray-900 m-0">What We Do</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              We provide a comprehensive suite of learning tools, including interactive flashcards, practice quizzes, and social feeds where you can share knowledge and insights. 
              Our platform uses spaced repetition and active recall methods to help you retain information longer and more effectively.
            </p>
          </section>

          <section className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900 m-0">Our Community</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Ceintelly isn't just a study tool; it's a social network for learners. 
              Follow other students, join study groups, and collaborate on study sets. 
              By learning together, we can overcome challenges and achieve our academic goals more efficiently.
            </p>
          </section>
        </div>

        <section className="text-center py-12 px-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl text-white">
          <Rocket className="h-12 w-12 mx-auto mb-6 text-blue-100" />
          <h2 className="text-3xl font-bold mb-4">Join the Revolution</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Whether you're a high school student, a university researcher, or a lifelong learner, 
            Ceintelly is here to support your journey. Start creating your first study set today!
          </p>
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Est. 2026</span>
            </div>
          </div>
        </section>

        <section className="pt-8 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2026 Ceintelly, Inc. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="/tos" className="text-sm text-blue-600 hover:underline font-medium">Terms</a>
              <a href="/privacy" className="text-sm text-blue-600 hover:underline font-medium">Privacy</a>
              <a href="/cookies" className="text-sm text-blue-600 hover:underline font-medium">Cookies</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AboutPage

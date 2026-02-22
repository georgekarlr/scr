import React from 'react'
import { FileText, Shield, Cookie, Clock } from 'lucide-react'

const TermsOfServicePage: React.FC = () => {
  const lastUpdated = "February 22, 2026"

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-50 rounded-2xl">
          <FileText className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900">Terms of Service</h1>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      <div className="prose prose-blue max-w-none space-y-8 text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing and using Ceintelly (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
          <p>
            Ceintelly is a social learning platform designed to help users create, share, and study educational content. We provide tools for flashcards, quizzes, and collaborative learning.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
          <p>
            To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 13 years old to use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">4. User Content</h2>
          <p>
            You retain ownership of the content you create and post on Ceintelly. By posting content, you grant Ceintelly a non-exclusive, worldwide, royalty-free license to use, copy, reproduce, and distribute your content in connection with the Service.
          </p>
          <p className="mt-4">
            You agree not to post content that is illegal, offensive, or infringes on the intellectual property rights of others.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">5. Prohibited Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Harass, abuse, or harm other users.</li>
            <li>Use the Service for any unauthorized or illegal purpose.</li>
            <li>Attempt to bypass any security measures of the Service.</li>
            <li>Use automated systems (bots, spiders) to access the Service without permission.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">6. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users or the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">7. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" and "as available" without any warranties of any kind, either express or implied.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
          <p>
            Ceintelly, Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">9. Changes to Terms</h2>
          <p>
            We may modify these Terms of Service at any time. We will notify users of any significant changes by posting the new terms on the Service.
          </p>
        </section>

        <section className="pt-8 border-t border-gray-100">
          <p className="text-sm">
            If you have any questions about these Terms, please contact us at legal@ceintelly.com
          </p>
          <p className="text-sm mt-4 font-bold text-gray-900">
            © 2026 Ceintelly, Inc. All rights reserved.
          </p>
        </section>
      </div>
    </div>
  )
}

export default TermsOfServicePage

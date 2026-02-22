import React from 'react'
import { Shield, Clock } from 'lucide-react'

const PrivacyPolicyPage: React.FC = () => {
  const lastUpdated = "February 22, 2026"

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-50 rounded-2xl">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900">Privacy Policy</h1>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      <div className="prose prose-blue max-w-none space-y-8 text-gray-600 leading-relaxed">
        <p>
          At Ceintelly, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
        </p>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
          <p>We collect information that you provide directly to us when you:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Create an account (username, email, password).</li>
            <li>Create study sets, posts, or comments.</li>
            <li>Communicate with us or other users.</li>
            <li>Complete your profile (full name, avatar).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>Provide, maintain, and improve our Service.</li>
            <li>Personalize your experience and recommendations.</li>
            <li>Communicate with you about updates, security, and support.</li>
            <li>Monitor and analyze trends and usage.</li>
            <li>Detect and prevent fraudulent or illegal activity.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. Sharing of Information</h2>
          <p>
            We do not sell your personal information. We may share your information in the following circumstances:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>With your consent or at your direction.</li>
            <li>With service providers who perform services for us.</li>
            <li>To comply with legal obligations.</li>
            <li>In connection with a merger, sale of company assets, or acquisition.</li>
          </ul>
          <p className="mt-4">
            Public content (like study sets and profile information) is visible to other users of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">4. Data Security</h2>
          <p>
            We use reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access. However, no internet transmission is ever fully secure.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">5. Your Choices</h2>
          <p>
            You can access, update, or delete your account information at any time through your account settings. You may also contact us to request deletion of your personal data.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">6. Children's Privacy</h2>
          <p>
            Our Service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">7. Changes to this Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
          </p>
        </section>

        <section className="pt-8 border-t border-gray-100">
          <p className="text-sm">
            If you have any questions about this Privacy Policy, please contact us at privacy@ceintelly.com
          </p>
          <p className="text-sm mt-4 font-bold text-gray-900">
            © 2026 Ceintelly, Inc. All rights reserved.
          </p>
        </section>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage

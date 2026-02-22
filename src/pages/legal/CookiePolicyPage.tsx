import React from 'react'
import { Cookie, Clock } from 'lucide-react'

const CookiePolicyPage: React.FC = () => {
  const lastUpdated = "February 22, 2026"

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-50 rounded-2xl">
          <Cookie className="h-8 w-8 text-blue-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900">Cookie Policy</h1>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
            <Clock className="h-4 w-4" />
            <span>Last updated: {lastUpdated}</span>
          </div>
        </div>
      </div>

      <div className="prose prose-blue max-w-none space-y-8 text-gray-600 leading-relaxed">
        <p>
          Ceintelly ("we," "us," or "our") uses cookies and similar technologies to provide, protect, and improve our Service. This Cookie Policy explains how and why we use these technologies.
        </p>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">1. What are Cookies?</h2>
          <p>
            Cookies are small text files that are stored on your device when you visit a website. They help us remember your preferences, keep you logged in, and understand how you interact with our Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
          <ul className="list-disc pl-6 mt-2 space-y-4">
            <li>
              <strong className="text-gray-900">Essential Cookies:</strong> These are necessary for the Service to function properly. They include, for example, cookies that enable you to log into secure areas of our Service.
            </li>
            <li>
              <strong className="text-gray-900">Preference Cookies:</strong> These cookies allow us to remember choices you make (such as your language or the region you are in) and provide enhanced, more personal features.
            </li>
            <li>
              <strong className="text-gray-900">Analytics Cookies:</strong> We use these to understand how visitors use our Service, which helps us improve it. For example, they tell us which pages are the most popular.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">3. Third-Party Cookies</h2>
          <p>
            Some cookies are placed by third parties on our Service. These third parties may use cookies to collect information about your online activities over time and across different websites.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">4. Your Choices</h2>
          <p>
            Most web browsers allow you to control cookies through their settings. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, as it will no longer be personalized to you. It may also stop you from saving customized settings like login information.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">5. Changes to this Policy</h2>
          <p>
            We may update this Cookie Policy from time to time. We encourage you to periodically review this page for the latest information on our cookie practices.
          </p>
        </section>

        <section className="pt-8 border-t border-gray-100">
          <p className="text-sm">
            If you have any questions about our use of cookies, please contact us at privacy@ceintelly.com
          </p>
          <p className="text-sm mt-4 font-bold text-gray-900">
            © 2026 Ceintelly, Inc. All rights reserved.
          </p>
        </section>
      </div>
    </div>
  )
}

export default CookiePolicyPage

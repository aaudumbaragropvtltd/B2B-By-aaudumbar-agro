import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy',
  description: 'Cookie Policy for B2B India — Learn how we utilize cookies and local storage to power secure wholesale trade, escrow sessions, and analytics.',
  alternates: {
    canonical: 'https://www.b2bindia.site/cookie',
  },
};

export default function CookiePolicy() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
          <header className="mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
              Cookie Policy
            </h1>
            <p className="text-sm text-gray-500">
              Last updated: August 2026 &nbsp;|&nbsp; Operated by Aaudumbar Agro Pvt. Ltd. (CIN Registered, India)
            </p>
          </header>

          <div className="prose prose-blue max-w-none text-gray-600 space-y-6 text-base leading-relaxed">
            <p>
              This Cookie Policy explains how <strong>B2B India</strong> (accessible via <strong>b2bindia.site</strong>), operated by <strong>Aaudumbar Agro Pvt. Ltd.</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), uses cookies, web beacons, local storage, and related tracking technologies when you visit or interact with our online B2B conglomerate wholesale marketplace.
            </p>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. What Are Cookies and Local Storage?
              </h2>
              <p>
                Cookies are small alphanumeric text files placed on your computer, tablet, or smartphone by web servers when you navigate across websites. They allow web platforms to remember your device, maintain authenticated login sessions, track multi-stage procurement RFQs, and understand how users navigate through our directory of 38 industrial commodity sectors.
              </p>
              <p className="mt-3">
                In addition to HTTP cookies, B2B India may utilize modern browser storage technologies, including <code>localStorage</code> and <code>sessionStorage</code>, to securely store temporary transaction tokens, quotation filters, and APMC mandi rate display preferences without transmitting excess overhead with every server request.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. Categories of Cookies We Use
              </h2>
              <p>
                We classify the cookies utilized across our digital trade terminal into four primary functional categories:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-3">
                <li>
                  <strong>Strictly Necessary &amp; Security Cookies:</strong> Essential for authenticating buyers and suppliers via Supabase/Firebase Auth, preventing Cross-Site Request Forgery (CSRF), and verifying 10% advance escrow transactions on Razorpay. The platform cannot operate reliably without these technologies.
                </li>
                <li>
                  <strong>Performance &amp; Analytics Cookies:</strong> Facilitate measurement of platform metrics, such as page load speed, search query efficiency across 498+ mandi commodities, and user drop-off points. We anonymize IP addresses to uphold institutional procurement confidentiality.
                </li>
                <li>
                  <strong>Functional &amp; Preference Cookies:</strong> Retain your chosen platform configurations, including vernacular language selection, state-level freight pincode filters, and collapsed catalog views between visits.
                </li>
                <li>
                  <strong>Transaction &amp; Communication Cookies:</strong> Power real-time customer support chat, WhatsApp quotation dispatch confirmation, and automated delivery milestone push alerts.
                </li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. Overview of Cookies Deployed on B2B India
              </h2>
              <div className="overflow-x-auto my-4">
                <table className="min-w-full text-left text-sm border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-gray-50 text-gray-800 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Cookie / Key</th>
                      <th className="py-3 px-4">Provider</th>
                      <th className="py-3 px-4">Purpose</th>
                      <th className="py-3 px-4">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs">sb-auth-token</td>
                      <td className="py-3 px-4">B2B India (Supabase)</td>
                      <td className="py-3 px-4">Encrypted user session authentication</td>
                      <td className="py-3 px-4">Session / 30 Days</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs">rzp_checkout_id</td>
                      <td className="py-3 px-4">Razorpay Gateway</td>
                      <td className="py-3 px-4">Maintains 10% advance escrow payment state</td>
                      <td className="py-3 px-4">Session</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs">_ga, _gid</td>
                      <td className="py-3 px-4">Google Analytics</td>
                      <td className="py-3 px-4">Anonymized traffic &amp; conversion telemetry</td>
                      <td className="py-3 px-4">2 Years / 24 Hours</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-mono text-xs">b2b_recent_views</td>
                      <td className="py-3 px-4">B2B India Local Storage</td>
                      <td className="py-3 px-4">Preserves recently viewed bulk commodities</td>
                      <td className="py-3 px-4">Persistent (Local)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. Compliance with Indian Digital Data Protection (DPDP) Act 2023
              </h2>
              <p>
                In strict adherence to India&apos;s <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> and the <strong>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong>, B2B India collects only data deemed strictly necessary for commercial trade execution and compliance. We do not sell or lease institutional transaction records or browser telemetry to third-party data brokers.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. How to Control and Manage Cookies
              </h2>
              <p>
                Most contemporary web browsers permit granular control over cookie permissions through their respective privacy configurations. You may instruct your browser to reject all cookies, purge existing session logs, or notify you each time a website attempts to set a cookie:
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2">
                <li><strong>Google Chrome:</strong> Settings → Privacy and Security → Third-Party Cookies.</li>
                <li><strong>Mozilla Firefox:</strong> Settings → Privacy &amp; Security → Enhanced Tracking Protection.</li>
                <li><strong>Apple Safari:</strong> Preferences → Privacy → Block all cookies / Prevent cross-site tracking.</li>
                <li><strong>Microsoft Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies.</li>
              </ul>
              <p className="mt-3 text-sm text-gray-500">
                Please note that disabling essential cookies may prevent you from logging into your supplier account, accessing RFQ bids, or completing escrow payment transactions.
              </p>
            </section>

            <section className="mt-8 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                6. Contact &amp; Data Protection Officer
              </h2>
              <p>
                For inquiries regarding our Cookie Policy, data processing safeguards, or privacy compliance, please direct your communication to our nodal privacy cell:
              </p>
              <div className="bg-gray-50 rounded-2xl p-5 mt-4 border border-gray-200 text-sm">
                <p className="font-bold text-gray-900 mb-1">Aaudumbar Agro Pvt. Ltd. — Legal &amp; Compliance Cell</p>
                <p className="mb-1"><strong>Email:</strong> <a href="mailto:support@b2bindia.site" className="text-brand-600 hover:underline">support@b2bindia.site</a></p>
                <p className="mb-1"><strong>Corporate Desk:</strong> <a href="tel:+918408841998" className="text-brand-600 hover:underline">+91 8408841998</a></p>
                <p><strong>Registered Address:</strong> Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar 431009, Maharashtra, India</p>
              </div>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

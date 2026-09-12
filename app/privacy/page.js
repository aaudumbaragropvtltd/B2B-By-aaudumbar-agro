import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for B2B India — Learn how we collect, use, and protect your data on India\'s cross-industry B2B marketplace.',
};

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-8 border-b border-gray-100 pb-6">Last updated: August 2026 &nbsp;|&nbsp; Effective from: August 21, 2026</p>

          <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
            <p className="text-lg leading-relaxed">
              B2B India (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is operated by <strong>Aaudumbar Agro Pvt. Ltd.</strong>, a company registered in India. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website <strong>www.b2bindia.site</strong> and use our B2B marketplace services.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">1.1 Personal Information</h3>
            <p>When you register for an account or use our services, we may collect:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Identity Data:</strong> Full name, company name, designation, and profile photograph.</li>
              <li><strong>Contact Data:</strong> Email address, phone number, business address, and pin code.</li>
              <li><strong>Verification Data:</strong> GST Identification Number (GSTIN), PAN, Aadhaar (for KYC purposes), and trade licence details.</li>
              <li><strong>Financial Data:</strong> Bank account details, UPI ID, and payment transaction records processed through our escrow system.</li>
              <li><strong>Authentication Data:</strong> Login credentials, Google account information (when using &quot;Sign in with Google&quot;).</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">1.2 Automatically Collected Data</h3>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, search queries, RFQs submitted, and order history.</li>
              <li><strong>Device Data:</strong> IP address, browser type, operating system, device identifiers, and screen resolution.</li>
              <li><strong>Cookies:</strong> Session cookies, authentication tokens, and analytics cookies (see our <a href="/cookie" className="text-brand-600 hover:underline">Cookie Policy</a>).</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. How We Use Your Information</h2>
            <p>We use the information collected for the following purposes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Account Management:</strong> To create, maintain, and verify your buyer or supplier account.</li>
              <li><strong>Transaction Processing:</strong> To facilitate orders, escrow payments, invoicing, and settlement between parties.</li>
              <li><strong>GST Verification:</strong> To verify your GSTIN with government databases and ensure compliance.</li>
              <li><strong>AI-Powered Services:</strong> To provide AI-driven pricing intelligence, product recommendations, and market insights.</li>
              <li><strong>Communication:</strong> To send order updates, RFQ responses, quotations, invoices, and platform notifications.</li>
              <li><strong>Security:</strong> To detect fraud, prevent unauthorized access, and protect the integrity of transactions.</li>
              <li><strong>Legal Compliance:</strong> To comply with applicable Indian laws, including GST Act, IT Act, and Companies Act.</li>
              <li><strong>Platform Improvement:</strong> To analyse usage patterns and improve our services, features, and user experience.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. Data Sharing and Disclosure</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Trading Partners:</strong> Your business profile, product listings, and contact information are visible to other verified users on the platform to facilitate B2B trade.</li>
              <li><strong>Payment Processors:</strong> Razorpay and our escrow partners process your payment data securely. We do not store full card or bank details on our servers.</li>
              <li><strong>Government Authorities:</strong> We may disclose information when required by law, court order, or regulatory authority (including GST authorities and Income Tax Department).</li>
              <li><strong>Service Providers:</strong> Third-party services including Supabase (authentication), Google Cloud (analytics), and Firebase (notifications) process data on our behalf under strict contractual obligations.</li>
            </ul>
            <p className="mt-3"><strong>We do not sell your personal data to third parties.</strong></p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. Data Security</h2>
            <p>We implement appropriate technical and organisational measures to protect your data:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>All data is transmitted over TLS/SSL encrypted connections.</li>
              <li>Authentication is secured via Supabase with HTTP-only session cookies.</li>
              <li>Payment data is processed through PCI-DSS compliant payment gateways.</li>
              <li>Access to personal data is restricted to authorised personnel only.</li>
              <li>Regular security audits and vulnerability assessments are conducted.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5. Data Retention</h2>
            <p>We retain your personal data for as long as your account is active or as needed to provide services. Transaction records are retained for a minimum of 8 years as required under the GST Act and Income Tax Act. You may request deletion of your account data by contacting us, subject to legal retention requirements.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">6. Your Rights</h2>
            <p>Under the Digital Personal Data Protection Act, 2023 (DPDP Act), you have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Access and obtain a copy of your personal data.</li>
              <li>Request correction of inaccurate or incomplete data.</li>
              <li>Request erasure of your data (subject to legal obligations).</li>
              <li>Withdraw consent for data processing at any time.</li>
              <li>Nominate another individual to exercise your data rights.</li>
              <li>Lodge a grievance with the Data Protection Board of India.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">7. Third-Party Links</h2>
            <p>Our platform may contain links to third-party websites or services (e.g., supplier external websites, payment gateway pages). We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies independently.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">8. Children&apos;s Privacy</h2>
            <p>B2B India is a business-to-business platform intended for use by registered businesses and individuals aged 18 years or above. We do not knowingly collect personal data from children under 18.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated &quot;Last updated&quot; date. Continued use of the platform after changes constitutes your acceptance of the revised policy.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">10. Grievance Officer</h2>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mt-3">
              <p className="mb-1"><strong>Grievance Officer:</strong> Aaudumbar Agro Pvt. Ltd.</p>
              <p className="mb-1"><strong>Email:</strong> <a href="mailto:support@b2bindia.site" className="text-brand-600 hover:underline">support@b2bindia.site</a></p>
              <p className="mb-1"><strong>Phone:</strong> <a href="tel:+918408841998" className="text-brand-600 hover:underline">+91 8408841998</a></p>
              <p className="mb-0"><strong>Address:</strong> Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar 431009, Maharashtra, India</p>
            </div>
            <p className="mt-3 text-sm text-gray-500">We will acknowledge your grievance within 24 hours and resolve it within 30 days from the date of receipt, as mandated under the Information Technology Act, 2000 and the DPDP Act, 2023.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

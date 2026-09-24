import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for B2B India — Rules governing use of India\'s cross-industry B2B marketplace, escrow, and trade.',
};

export default function TermsOfService() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Terms of Service</h1>
          <p className="text-sm text-gray-400 mb-8 border-b border-gray-100 pb-6">Last updated: August 2026 &nbsp;|&nbsp; Effective from: August 21, 2026</p>

          <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
            <p className="text-lg leading-relaxed">
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the B2B India platform operated by <strong>Aaudumbar Agro Pvt. Ltd.</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), accessible at <strong>www.b2bindia.site</strong>. By registering, accessing, or using our platform, you agree to be bound by these Terms.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">1. Eligibility</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>You must be at least 18 years of age to use the platform.</li>
              <li>You must be a registered business entity or an authorised representative of one.</li>
              <li>You must possess a valid GST Identification Number (GSTIN) to complete supplier or buyer registration.</li>
              <li>By using the platform, you represent and warrant that you have the authority to bind your business entity to these Terms.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">2. Account Registration &amp; Verification</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>You must provide accurate, current, and complete information during registration.</li>
              <li>All suppliers must undergo <strong>GST verification</strong> before their catalogue becomes publicly visible.</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials. Any activity under your account is your responsibility.</li>
              <li>We reserve the right to suspend or terminate accounts that provide false information or violate these Terms.</li>
              <li>You may register as a <strong>Buyer</strong>, <strong>Supplier</strong>, or <strong>Both</strong>. Each role is subject to specific obligations outlined below.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">3. Buyer Obligations</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Buyers must submit genuine Request for Quotations (RFQs) and purchase orders.</li>
              <li>Buyers are required to honour accepted quotations and make timely payments as per the agreed terms.</li>
              <li>Buyers must inspect goods upon delivery and report any discrepancies within the platform&apos;s dispute window (typically 48 hours from delivery).</li>
              <li>Frivolous or fraudulent RFQs may result in account suspension.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">4. Supplier Obligations</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Suppliers must ensure that all product listings are accurate, including descriptions, pricing, images, MOQ (Minimum Order Quantity), and availability.</li>
              <li>Suppliers must fulfil accepted orders within the committed delivery timeline.</li>
              <li>Suppliers must provide valid tax invoices compliant with GST regulations for every transaction.</li>
              <li>Misleading product listings, counterfeit goods, or fraudulent practices will result in immediate account termination and potential legal action.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">5. Escrow Payment System &amp; Milestone Settlement</h2>
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <p className="mb-3 font-semibold text-slate-800">B2B India operates a secure milestone-based escrow trade system:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>10% Advance Deposit:</strong> Buyers pay a <strong>10% non-refundable advance</strong> upon quotation acceptance to lock commodity rates, secure stock allocation, and initiate packaging at the godown.</li>
                <li><strong>90% Remaining Balance at Truck Loading:</strong> The remaining <strong>90% balance is strictly payable at the time of loading the goods into the transport truck at the warehouse / godown</strong>. Physical quality inspection and weighbridge verification are conducted on-site prior to vehicle dispatch.</li>
                <li><strong>Dispatch Authorization:</strong> Final dispatch gate pass, 100% Tax Invoices, and E-Way Bills are released only after 100% full payment clearance at the warehouse loading dock.</li>
                <li><strong>Refund Guarantee:</strong> If the supplier fails to fulfill stock or if goods fail verified quality standards during dock inspection, the 10% advance is refunded to the buyer in full.</li>
                <li><strong>Disputes:</strong> In case of discrepancies, funds remain securely held in escrow until formal mediation.</li>
              </ul>
            </div>
            <p className="mt-3 text-sm text-gray-500">All online payments are securely processed through Razorpay, an RBI-authorized payment aggregator.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">6. Pricing &amp; AI-Driven Intelligence</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>B2B India uses AI-powered pricing intelligence to provide market insights and fair price recommendations.</li>
              <li>AI-suggested prices are advisory only. The final transaction price is always agreed upon between the buyer and supplier.</li>
              <li>We do not guarantee the accuracy of AI-generated market predictions or pricing suggestions.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">7. Dispute Resolution</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>In the event of a dispute between a buyer and supplier, either party may raise a dispute through the platform&apos;s built-in resolution system.</li>
              <li>B2B India will act as a neutral mediator and may request supporting documentation (invoices, delivery receipts, photographs) from both parties.</li>
              <li>B2B India reserves the right to make a final determination regarding the release of escrow funds in unresolved disputes.</li>
              <li>For disputes exceeding ₹10,00,000 (Ten Lakhs), the matter shall be referred to arbitration under the Arbitration and Conciliation Act, 1996, with the seat of arbitration in Chhatrapati Sambhajinagar, Maharashtra.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">8. Prohibited Activities</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Use the platform for any illegal, fraudulent, or unauthorised purpose.</li>
              <li>List prohibited, counterfeit, hazardous, or restricted goods.</li>
              <li>Attempt to circumvent the escrow system or make off-platform payments to avoid platform protections.</li>
              <li>Scrape, harvest, or collect data from the platform using automated means.</li>
              <li>Impersonate another business, individual, or entity.</li>
              <li>Interfere with or disrupt the platform&apos;s security, infrastructure, or other users&apos; experience.</li>
              <li>Share login credentials or allow unauthorised persons to access your account.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">9. Intellectual Property</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>All content, trademarks, logos, and software on the B2B India platform are owned by Aaudumbar Agro Pvt. Ltd. or its licensors.</li>
              <li>You retain ownership of content you upload (product images, descriptions, documents) but grant us a non-exclusive, royalty-free licence to display and distribute it on the platform.</li>
              <li>You must not reproduce, modify, or distribute any platform content without prior written consent.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">10. Platform Fees, Memberships &amp; Gateway Charges</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Supplier Membership Plan:</strong> Suppliers must maintain an active annual membership plan to list live product catalogs.
                <ul className="list-circle pl-5 mt-1 space-y-1 text-sm text-gray-700">
                  <li><strong>Annual Plan:</strong> ₹2,000 + 18% GST (₹360) = ₹2,360 (Valid for 12 months / 365 days).</li>
                  <li><strong>Expiry Rule:</strong> When a supplier membership expires, their catalog listings are automatically hidden from the public website until renewal. Upon renewal, all previously uploaded products are restored live instantly.</li>
                </ul>
              </li>
              <li><strong>Payment Gateway Surcharge:</strong> A standard Razorpay platform processing fee of <strong>2.5% + 18% GST on the fee</strong> applies across all online checkout methods (UPI, Credit/Debit Cards, NetBanking).</li>
              <li><strong>Direct Wholesale Sales Billing:</strong> All direct trades are executed on the official bill of <strong>Aaudumbar Agro Pvt. Ltd. (B2B India)</strong> to the buyer, complete with GSTIN, PAN, and full 8-column HSN code itemization.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">11. Limitation of Liability</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>B2B India acts as a <strong>marketplace facilitator</strong> and is not a party to the transaction between buyers and suppliers.</li>
              <li>We do not guarantee the quality, safety, legality, or delivery of goods listed by suppliers.</li>
              <li>Our total liability for any claim arising from your use of the platform shall not exceed the amount of fees paid by you to B2B India in the preceding 12 months.</li>
              <li>We are not liable for indirect, incidental, consequential, or punitive damages.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">12. Termination</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>You may deactivate your account at any time by contacting our support team.</li>
              <li>We may suspend or terminate your account without notice for violation of these Terms.</li>
              <li>Upon termination, any pending escrow transactions will be resolved according to our dispute resolution process.</li>
              <li>Sections relating to intellectual property, limitation of liability, and governing law survive termination.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">13. Governing Law &amp; Jurisdiction</h2>
            <p>These Terms are governed by and construed in accordance with the laws of India. Any legal proceedings arising from these Terms shall be subject to the exclusive jurisdiction of the courts in <strong>Chhatrapati Sambhajinagar, Maharashtra, India</strong>.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">14. Changes to These Terms</h2>
            <p>We may update these Terms from time to time. Any material changes will be notified via email or a prominent notice on the platform. Continued use of the platform after the effective date of revised Terms constitutes acceptance.</p>

            <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4">15. Contact Us</h2>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mt-3">
              <p className="mb-1"><strong>Aaudumbar Agro Pvt. Ltd.</strong></p>
              <p className="mb-1"><strong>Email:</strong> <a href="mailto:support@b2bindia.site" className="text-brand-600 hover:underline">support@b2bindia.site</a></p>
              <p className="mb-1"><strong>Phone:</strong> <a href="tel:+918408841998" className="text-brand-600 hover:underline">+91 8408841998</a></p>
              <p className="mb-0"><strong>Address:</strong> Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar 431009, Maharashtra, India</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

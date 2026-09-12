import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Cancellation & Refund Policy',
  description: 'Cancellation and Refund Policy for B2B India marketplace — Operated by Aaudumbar Agro Pvt. Ltd.',
};

export default function RefundPolicy() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Cancellation &amp; Refund Policy</h1>
          <p className="text-sm text-gray-400 mb-8 border-b border-gray-100 pb-6">
            Last updated: August 2026 &nbsp;|&nbsp; Effective from: August 21, 2026
          </p>

          <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
            <p className="text-lg leading-relaxed">
              At <strong>B2B India</strong> (operated by <strong>Aaudumbar Agro Pvt. Ltd.</strong>), we operate a transparent, milestone-based escrow trade system to protect both buyers and suppliers across all wholesale transactions.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">1. Order Cancellation by Buyer</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Prior to Warehouse Dispatch / Loading:</strong> Buyers may request order cancellation prior to the commencement of vehicle loading at the supplier&apos;s godown or warehouse. In such cases, if the cancellation is due to documented supplier delay or non-availability of stock, the initial 10% advance deposit is refunded in full.</li>
              <li><strong>Post Vehicle Loading / In-Transit:</strong> Once the consignment has been inspected, loaded into the logistics truck, and dispatched with an active E-Way bill, orders cannot be cancelled mid-transit.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">2. Order Cancellation by Supplier or Platform</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>If a verified supplier is unable to fulfill the order quantity or quality specifications agreed upon in the accepted quotation, B2B India reserves the right to cancel the transaction.</li>
              <li>In the event of cancellation initiated by the supplier or the platform, <strong>100% of all funds paid by the buyer (including the 10% advance) will be refunded immediately</strong> to the original payment source.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">3. Inspection &amp; Quality Rejection (Dockside Verification)</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Physical quality inspection, moisture testing, and weighbridge verification are conducted at the warehouse loading dock prior to final dispatch.</li>
              <li>If the goods fail to match the contracted technical specifications or quality grade during inspection, the buyer has the right to reject the consignment.</li>
              <li>Upon verified quality rejection by platform inspectors, the 10% advance deposit is refunded in full to the buyer within 5–7 business days.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">4. Supplier Membership Refund Policy</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Supplier catalog subscription plans (Quarterly ₹708 / Annual ₹2,360) grant immediate access to verified buyer RFQs, catalog listing services, and enterprise portal access.</li>
              <li>Subscription fees are non-refundable once the supplier dashboard and catalog indexing have been activated.</li>
              <li>If a payment was charged multiple times due to a gateway technical error, the excess amount will be refunded automatically within 3–5 working days.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">5. Refund Processing Timeline</h2>
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 text-emerald-900">
              <p className="font-semibold mb-2">Refund Turnaround Time:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>UPI / NetBanking / Debit Card:</strong> 5 to 7 business days from the date of refund approval.</li>
                <li><strong>Credit Card:</strong> 5 to 10 business days (depending on your issuing bank&apos;s billing cycle).</li>
                <li>All refunds are credited directly back to the original bank account or card used during checkout via our RBI-authorized payment aggregator, Razorpay.</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">6. Grievance &amp; Dispute Resolution</h2>
            <p>
              For any refund status inquiries or cancellation requests, please contact our dedicated accounts and compliance desk:
            </p>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mt-4">
              <p className="mb-1 font-bold text-gray-900">Aaudumbar Agro Pvt. Ltd. (B2B India)</p>
              <p className="mb-1"><strong>Nodal Officer:</strong> Accounts &amp; Escrow Grievance Cell</p>
              <p className="mb-1"><strong>Email:</strong> <a href="mailto:support@b2bindia.site" className="text-brand-600 hover:underline">support@b2bindia.site</a></p>
              <p className="mb-1"><strong>Helpline:</strong> <a href="tel:+918408841998" className="text-brand-600 hover:underline">+91 8408841998</a></p>
              <p className="mb-0"><strong>Registered Office:</strong> Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar 431009, Maharashtra, India</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

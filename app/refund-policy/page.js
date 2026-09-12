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
              At <strong>B2B India</strong> (operated by <strong>Aaudumbar Agro Pvt. Ltd.</strong>), all wholesale commodity transactions operate under a binding milestone-based escrow trade agreement to maintain integrity and price stability for both buyers and verified suppliers.
            </p>

            {/* Core Non-Refundable Rule Highlight Box */}
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 text-amber-950">
              <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                ⚠️ Strict 10% Advance Policy Notice
              </h3>
              <p className="text-sm leading-relaxed font-medium">
                Once an order is confirmed and placed, the <strong>10% advance deposit is strictly non-refundable</strong>. 
                Order cancellation and refund of the advance amount is <strong>ONLY permitted if the goods fail quality inspection</strong> against the contracted technical specifications during dockside verification.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">1. Non-Refundable Advance Deposit Upon Order Placement</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>When an order is placed and the 10% advance deposit is paid, commercial commodity prices are instantly locked, physical stock is reserved at the supplier&apos;s godown, and packaging/weighing operations are initiated.</li>
              <li><strong>No Change-of-Mind Cancellations:</strong> The 10% advance deposit will <strong>NOT be refunded</strong> if the buyer cancels the order after placement due to market price fluctuations, procurement delays, change of mind, or buyer internal reasons.</li>
              <li>Once vehicle loading commences or goods are dispatched in transit with an active E-Way bill, orders cannot be cancelled under any circumstances.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">2. Sole Ground for Cancellation &amp; Refund: Quality Mismatch</h2>
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 text-slate-800">
              <p className="font-semibold mb-2 text-blue-950">Quality Inspection &amp; Dockside Verification Process:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>On-Site Dock Inspection:</strong> Prior to transport truck dispatch, physical quality examination, moisture testing, weighbridge measurement, and grade verification are carried out at the warehouse loading dock.</li>
                <li><strong>Quality Rejection:</strong> If the consignment <strong>does not match the agreed technical specifications, moisture limits, or quality grade</strong> stipulated in the approved quotation, the buyer has the formal right to reject the stock.</li>
                <li><strong>100% Full Refund Guarantee:</strong> If the quality does not match and the supplier cannot provide an immediate conforming batch, the order will be cancelled by the platform and <strong>100% of the 10% advance deposit will be refunded in full to the buyer</strong>.</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">3. Cancellation Due to Supplier Non-Fulfillment</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>If a verified supplier fails to make the agreed stock available within the committed fulfillment timeline, B2B India will cancel the transaction.</li>
              <li>In case of supplier non-fulfillment or platform-initiated cancellation, <strong>100% of the advance amount is refunded immediately</strong> to the buyer without any deduction.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">4. Supplier Membership Subscriptions</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Supplier catalog membership plans (Quarterly ₹708 / Annual ₹2,360) provide immediate indexing of products and access to verified buyer RFQs.</li>
              <li>Membership fees are strictly non-refundable once the supplier account features have been activated.</li>
              <li>Accidental duplicate transactions resulting from payment gateway network errors will be refunded automatically within 3–5 working days.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">5. Refund Processing Timeline</h2>
            <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 text-emerald-900">
              <p className="font-semibold mb-2">Turnaround Time for Approved Quality Mismatch Refunds:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li><strong>UPI / IMPS / NetBanking / Debit Card:</strong> 5 to 7 business days from formal quality rejection approval.</li>
                <li><strong>Credit Card:</strong> 5 to 10 business days (depending on your issuing bank&apos;s settlement schedule).</li>
                <li>Refunds are transferred directly back to the original source bank account or card via our payment aggregator, Razorpay.</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">6. Grievance &amp; Quality Dispute Desk</h2>
            <p>
              For quality dispute reports, lab test reports, or refund verification, contact our dedicated escrow officer:
            </p>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mt-4">
              <p className="mb-1 font-bold text-gray-900">Aaudumbar Agro Pvt. Ltd. (B2B India)</p>
              <p className="mb-1"><strong>Nodal Officer:</strong> Quality &amp; Escrow Grievance Desk</p>
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

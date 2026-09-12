import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Shipping & Delivery Policy',
  description: 'Shipping and Delivery Policy for wholesale trade on B2B India — Operated by Aaudumbar Agro Pvt. Ltd.',
};

export default function ShippingPolicy() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Shipping &amp; Delivery Policy</h1>
          <p className="text-sm text-gray-400 mb-8 border-b border-gray-100 pb-6">
            Last updated: August 2026 &nbsp;|&nbsp; Effective from: August 21, 2026
          </p>

          <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
            <p className="text-lg leading-relaxed">
              <strong>B2B India</strong> (operated by <strong>Aaudumbar Agro Pvt. Ltd.</strong>) facilitates pan-India bulk commodity and wholesale commercial freight. We partner with verified commercial fleet operators and logistics networks to ensure timely and insured delivery.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">1. Delivery Modes</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Platform Partner Logistics (Doorstep / Destination):</strong> B2B India coordinates third-party multi-axle freight carriers, generates GST-compliant E-Way bills, and tracks consignments from loading dock to the buyer&apos;s specified warehouse or delivery facility.</li>
              <li><strong>Self-Pickup / Ex-Godown (FOB):</strong> Buyers may opt to arrange their own transport vehicles from the supplier&apos;s godown or processing plant. Gate pass and loading clearances are provided once milestone payments are confirmed.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">2. Processing &amp; Dispatch Timeline</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Order Processing:</strong> Standard bulk order processing, batch quality inspection, and packaging at the supplier godown takes <strong>24 to 48 hours</strong> following quotation acceptance and advance payment confirmation.</li>
              <li><strong>Dispatch:</strong> Consignments are loaded onto transport trucks upon clearance of dockside weighbridge verification. E-Way bill numbers and vehicle details are shared with the buyer instantly via the dashboard and WhatsApp notifications.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">3. Estimated Delivery Times (Transit Time)</h2>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-800">
                <li><strong>Intra-State / Regional (within 300 km):</strong> 1 to 2 business days.</li>
                <li><strong>Inter-State / Major Commercial Corridors:</strong> 3 to 5 business days.</li>
                <li><strong>Remote / Long-Haul Freight (North-East, J&amp;K, Islands):</strong> 5 to 8 business days.</li>
              </ul>
              <p className="mt-3 text-xs text-slate-500">
                * Note: Delivery timelines may vary based on weather conditions, seasonal transport demand, road permits, or state border checkpost inspections.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">4. Shipping Charges &amp; E-Way Bills</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Freight charges are calculated dynamically based on cargo weight (metric tons/quintals), distance (km), and vehicle category (tempo, 10-wheeler, multi-axle trailer).</li>
              <li>All freight quotes include GST on transport (where applicable) and mandatory government E-Way bill documentation.</li>
              <li>Shipping charges are explicitly itemized in the final invoice prior to payment.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">5. Shipping Support &amp; Fleet Coordination</h2>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mt-4">
              <p className="mb-1 font-bold text-gray-900">Aaudumbar Agro Pvt. Ltd. Logistics Cell</p>
              <p className="mb-1"><strong>Email:</strong> <a href="mailto:support@b2bindia.site" className="text-brand-600 hover:underline">support@b2bindia.site</a></p>
              <p className="mb-1"><strong>Fleet Helpline:</strong> <a href="tel:+918408841998" className="text-brand-600 hover:underline">+91 8408841998</a></p>
              <p className="mb-0"><strong>Operating Hub:</strong> Plot No. 5, Prerna Nagar, Garkheda Parisar, Chhatrapati Sambhajinagar 431009, Maharashtra, India</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

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
              <strong>B2B India</strong> (operated by <strong>Aaudumbar Agro Pvt. Ltd.</strong>) facilitates pan-India bulk commodity and wholesale commercial freight connecting verified suppliers and buyers.
            </p>

            {/* Truck Charges Highlight Box */}
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 text-amber-950">
              <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center gap-2">
                🚚 Doorstep Delivery &amp; Truck Charges Notice
              </h3>
              <p className="text-sm leading-relaxed font-medium">
                If you choose for <strong>B2B India to ship and deliver goods to your doorstep</strong>, 
                <strong> you (the buyer) need to pay the freight and truck charges</strong>. 
                Transportation charges are calculated based on the distance, vehicle type, and cargo weight, and must be borne by the buyer.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">1. Delivery Options</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Doorstep Delivery (Arranged by B2B India):</strong> If you choose for B2B India to coordinate transport and ship the consignment directly to your factory, godown, or facility doorstep, <strong>the buyer is required to pay all truck and transportation charges</strong>. We coordinate with commercial logistics operators, generate compliant GST E-Way bills, and schedule the carrier.
              </li>
              <li>
                <strong>Self-Pickup / Ex-Godown:</strong> Buyers may arrange their own transport vehicles from the supplier&apos;s warehouse/godown. Gate pass and dockside loading are provided once 100% full payment is cleared at the warehouse dock. In this case, no freight charges are billed by B2B India.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">2. Truck Freight Calculation &amp; Payment</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Payable by Buyer:</strong> When doorstep delivery is selected, the truck freight cost is strictly payable by the buyer.
              </li>
              <li>
                <strong>Transparent Pricing:</strong> Freight charges depend on the distance between the dispatch godown and destination pincode, cargo tonnage (quintals/metric tons), and vehicle category (pickup, 6-wheeler, 10-wheeler, multi-axle trailer).
              </li>
              <li>
                <strong>E-Way Bills:</strong> All dispatches are covered by official government GST E-Way bills with complete vehicle registration and transporter details.
              </li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">3. Processing &amp; Dispatch Timeline</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Order Processing:</strong> Standard order preparation, quality grading, and warehouse bagging takes <strong>24 to 48 hours</strong> following quotation acceptance and advance payment.</li>
              <li><strong>Truck Loading &amp; Dispatch:</strong> Consignments are loaded onto trucks at the supplier godown after weighbridge and physical inspection. Dispatch credentials and driver contact details are shared immediately via the dashboard and WhatsApp.</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-3">4. Estimated Transit Times</h2>
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <ul className="list-disc pl-5 space-y-2 text-sm text-slate-800">
                <li><strong>Regional Deliveries (within 300 km):</strong> 1 to 2 business days.</li>
                <li><strong>Inter-State Commercial Freight:</strong> 3 to 5 business days.</li>
                <li><strong>Long-Haul / Remote Corridors:</strong> 5 to 8 business days.</li>
              </ul>
              <p className="mt-3 text-xs text-slate-500">
                * Note: Transit times depend on highway regulations, seasonal weather conditions, and state border commercial checkposts.
              </p>
            </div>

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

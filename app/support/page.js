import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SupportChatPanel from '@/components/SupportChatPanel';
import { getSiteUrl } from '@/utils/seoUtils';

const siteUrl = getSiteUrl();

export const metadata = {
  title: 'Enterprise Support & Help Desk',
  description:
    'B2B India enterprise support desk. Get 24/7 assistance on 10% advance escrow protection, gate pass logistics, supplier verification, and wholesale commodity orders.',
  alternates: {
    canonical: `${siteUrl}/support`,
  },
  openGraph: {
    title: 'Enterprise Support & Help Desk | B2B India',
    description:
      'Direct contact channels, logistics tracking, escrow resolution, and procurement assistance for verified wholesale buyers and suppliers.',
    url: `${siteUrl}/support`,
    siteName: 'B2B India | b2bindia.site',
    locale: 'en_IN',
    type: 'website',
  },
};

const SUPPORT_FAQS = [
  {
    question: 'How does the 10% advance escrow payment protect wholesale buyers?',
    answer:
      'When you place a bulk order on B2B India, your 10% advance deposit is safely held in an automated milestone escrow account operated by Aaudumbar Agro Pvt. Ltd. It locks the contracted commodity price and initiates supplier grading, weighing, and bagging. The deposit is never released to the supplier until the goods undergo quality inspection at the loading dock.',
  },
  {
    question: 'Can I inspect goods at the warehouse before paying the 90% balance?',
    answer:
      'Yes. Before transport dispatch or vehicle loading, dockside physical inspection is conducted at the supplier godown. Buyers (or their authorized inspection agents) verify grain quality, moisture content, weighbridge slips, and batch specifications. The remaining 90% balance is payable only after quality approval.',
  },
  {
    question: 'What happens if goods fail dockside quality inspection?',
    answer:
      'If the goods delivered to the loading dock fail to match the contracted technical specifications or quality grade, the buyer has the formal right to reject the consignment. If the supplier cannot provide a conforming replacement immediately, 100% of the 10% advance deposit is refunded immediately to the buyer.',
  },
  {
    question: 'How are commercial truck freight charges calculated and paid?',
    answer:
      'If you request B2B India to arrange doorstep transportation, freight charges are calculated based on origin-destination distance (using precision Haversine logistics routing), cargo tonnage, and truck classification. Freight charges are paid by the buyer and covered by official government GST E-Way bills.',
  },
  {
    question: 'How can manufacturers and distributors register as verified suppliers?',
    answer:
      'Suppliers can register via the Supplier Portal by submitting their valid 15-digit GSTIN, corporate PAN, company bank mandate, and manufacturing facility address. Accounts undergo operational due diligence before receiving Gold, Platinum, or Diamond verified badges.',
  },
  {
    question: 'How do I contact an emergency dispute officer or escalation manager?',
    answer:
      'For active order disputes, gate pass delays, or shipment discrepancies, buyers and suppliers can contact our dedicated escalation desk at support@b2bindia.site or call our priority corporate hotline at +91-8408841998 (Mon–Sat, 9:00 AM – 8:00 PM IST).',
  },
];

export default function PublicSupportPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: SUPPORT_FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        {/* Page Header */}
        <header className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/60 text-xs font-bold uppercase tracking-wider text-brand-700">
            <span>B2B India Customer Care</span>
            <span>•</span>
            <span>24/7 Support Desk</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Enterprise Support &amp; Concierge Desk
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Get instant resolution on 10% advance escrow protection, dockside quality inspection,
            freight logistics, GST invoicing, and nationwide manufacturer procurement.
          </p>
        </header>

        {/* Support Channels Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl mb-4">
              🛡️
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Escrow &amp; Payments</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Questions regarding the 10% advance deposit, Razorpay settlements, and 90% balance payments.
            </p>
            <a
              href="mailto:support@b2bindia.site?subject=Escrow%20Support%20Inquiry"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              escrow@b2bindia.site &rarr;
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl mb-4">
              🚚
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Logistics &amp; Hauling</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Truck freight coordination, vehicle dispatch, GST E-Way bill generation, and godown gate passes.
            </p>
            <a
              href="mailto:support@b2bindia.site?subject=Logistics%20Support%20Inquiry"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              logistics@b2bindia.site &rarr;
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-4">
              🏭
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Supplier Verification</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Assistance with GSTIN verification, PAN validation, warehouse documentation, and tier upgrades.
            </p>
            <a
              href="mailto:support@b2bindia.site?subject=Supplier%20Verification%20Inquiry"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              kyc@b2bindia.site &rarr;
            </a>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-2xl mb-4">
              📞
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Corporate Hotline</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Direct voice assistance with our senior procurement officers and dispute resolution team.
            </p>
            <a
              href="tel:+918408841998"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
            >
              +91-8408841998 &rarr;
            </a>
          </div>
        </section>

        {/* Interactive Support Chat Panel */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Interactive Sourcing Assistant &amp; Live Ticket Desk
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ask questions or track orders in real time using our automated intelligence assistant.
            </p>
          </div>
          <SupportChatPanel isDashboard={false} />
        </section>

        {/* Enterprise Support FAQ Section */}
        <section className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-sm space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Frequently Asked Enterprise Procurement Questions
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Clear guidelines on wholesale contracts, payments, inspection protocols, and shipping terms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            {SUPPORT_FAQS.map((faq, index) => (
              <article key={index} className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  {faq.question}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <strong>Corporate Headquarters:</strong> Aaudumbar Agro Pvt. Ltd., Plot No. 5, Prerna Nagar,
              Garkheda Parisar, Chhatrapati Sambhajinagar, Maharashtra 431009, India.
            </div>
            <div>
              <strong>Operational Hours:</strong> Monday – Saturday, 9:00 AM – 8:00 PM IST
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

import ProfitMarginViewer from '@/components/admin/ProfitMarginViewer';

export const metadata = {
  title: 'Profit Margins & Pricing Intelligence - B2B India Admin',
  description: 'Track actual product base rates, platform commission earnings, and GST tax breakdowns across all 38 sectors.',
};

export default function AdminProfitMarginsPage() {
  return (
    <div className="flex-1 bg-slate-950 min-h-screen text-slate-100">
      <ProfitMarginViewer />
    </div>
  );
}

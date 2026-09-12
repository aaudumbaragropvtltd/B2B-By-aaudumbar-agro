import BannerManager from '@/components/admin/BannerManager';

export const metadata = {
  title: 'CMS Banner Management - B2B India Admin',
  description: 'Manage homepage hero promotional banners and marketing slides.',
};

export default function AdminCmsPage() {
  return (
    <div className="flex-1 bg-slate-950 min-h-screen text-slate-100">
      <BannerManager />
    </div>
  );
}

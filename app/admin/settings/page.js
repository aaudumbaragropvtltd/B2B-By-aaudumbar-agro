import SettingsManager from '@/components/admin/SettingsManager';

export const metadata = {
  title: 'Platform Settings & Business Rules - B2B India Admin',
  description: 'Manage live platform commercial fees, GST rates, and system flags.',
};

export default function AdminSettingsPage() {
  return (
    <div className="flex-1 bg-slate-950 min-h-screen text-slate-100">
      <SettingsManager />
    </div>
  );
}

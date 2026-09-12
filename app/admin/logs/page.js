import LogViewer from '@/components/admin/LogViewer';

export const metadata = {
  title: 'System Health & Audit Logs - B2B India Admin',
  description: 'Monitor live system health, API events, and error logs.',
};

export default function AdminLogsPage() {
  return (
    <div className="flex-1 bg-slate-950 min-h-screen text-slate-100">
      <LogViewer />
    </div>
  );
}

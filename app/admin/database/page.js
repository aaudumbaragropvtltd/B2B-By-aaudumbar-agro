import DatabaseManager from '@/components/admin/DatabaseManager';

export const metadata = {
  title: 'Database Management - B2B India Admin',
  description: 'Manage database records directly from the admin panel.',
};

export default function DatabasePage() {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="px-6 py-4 border-b bg-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Database Manager</h1>
          <p className="text-sm text-gray-500">Direct database access for administrators.</p>
        </div>
      </div>
      <div className="flex-1 bg-white">
        <DatabaseManager />
      </div>
    </div>
  );
}

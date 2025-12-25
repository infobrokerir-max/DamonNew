import { useStore, useProjects } from '../services/api';
import { 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

export default function Dashboard() {
  const { currentUser } = useStore();
  const projects = useProjects();

  const stats = {
    total: projects.length,
    pending: projects.filter(p => p.status === 'pending_approval').length,
    approved: projects.filter(p => p.status === 'approved' || p.status === 'in_progress').length,
    rejected: projects.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">خوش آمدید، {currentUser?.full_name}</h1>
        <p className="text-gray-500 mt-1">نمای کلی وضعیت پروژه‌ها</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="کل پروژه‌ها" 
          value={stats.total} 
          icon={<Briefcase className="text-blue-600" />} 
          bg="bg-blue-50" 
        />
        <StatCard 
          title="منتظر بررسی" 
          value={stats.pending} 
          icon={<Clock className="text-amber-600" />} 
          bg="bg-amber-50" 
        />
        <StatCard 
          title="تایید شده" 
          value={stats.approved} 
          icon={<CheckCircle2 className="text-green-600" />} 
          bg="bg-green-50" 
        />
        <StatCard 
          title="رد شده" 
          value={stats.rejected} 
          icon={<AlertCircle className="text-red-600" />} 
          bg="bg-red-50" 
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">آخرین پروژه‌ها</h3>
        {projects.length === 0 ? (
          <p className="text-gray-400 text-center py-8">پروژه‌ای یافت نشد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-sm">
                  <th className="pb-3 font-medium">نام پروژه</th>
                  <th className="pb-3 font-medium">کارفرما</th>
                  <th className="pb-3 font-medium">نوع</th>
                  <th className="pb-3 font-medium">وضعیت</th>
                  <th className="pb-3 font-medium">تاریخ ایجاد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projects.slice(0, 5).map(p => (
                  <tr key={p.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-medium text-gray-800">{p.project_name}</td>
                    <td className="py-4 text-gray-600">{p.employer_name}</td>
                    <td className="py-4 text-gray-600">{p.project_type}</td>
                    <td className="py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-4 text-gray-500 text-sm">
                      {new Date(p.created_at).toLocaleDateString('fa-IR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bg }: { title: string, value: number, icon: React.ReactNode, bg: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${bg}`}>
        {icon}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending_approval: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-green-100 text-green-700 border-green-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200",
    quoted: "bg-indigo-100 text-indigo-700 border-indigo-200",
    won: "bg-emerald-100 text-emerald-700 border-emerald-200",
    lost: "bg-gray-100 text-gray-700 border-gray-200",
    on_hold: "bg-orange-100 text-orange-700 border-orange-200",
  };
  
  const labels = {
    pending_approval: "در انتظار تایید",
    approved: "تایید شده",
    rejected: "رد شده",
    in_progress: "در حال انجام",
    quoted: "قیمت داده شده",
    won: "برنده شده",
    lost: "از دست رفته",
    on_hold: "متوقف شده",
  };

  const s = status as keyof typeof styles;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[s] || styles.lost}`}>
      {labels[s] || status}
    </span>
  );
}

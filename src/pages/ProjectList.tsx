import { useStore, useProjects } from '../services/api';
import { Link } from 'react-router-dom';
import { StatusBadge } from './Dashboard';
import { Search, MapPin, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function ProjectList() {
  const projects = useProjects();
  const { currentUser, deleteProject } = useStore();
  const [search, setSearch] = useState('');

  const filtered = projects.filter(p => 
    p.project_name.includes(search) || 
    p.employer_name.includes(search)
  );

  const handleDelete = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault(); // Prevent navigation
    if (window.confirm('آیا از حذف این پروژه اطمینان دارید؟ این عملیات غیرقابل بازگشت است.')) {
      deleteProject(projectId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت پروژه‌ها</h1>
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="جستجو در نام پروژه یا کارفرما..." 
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(p => (
          <Link to={`/projects/${p.id}`} key={p.id} className="block group relative">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg">
                  {p.project_name.charAt(0)}
                </div>
                <StatusBadge status={p.status} />
              </div>
              
              <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-sky-600 transition-colors">
                {p.project_name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{p.employer_name} | {p.project_type}</p>
              
              <div className="flex items-start justify-between mt-auto">
                <div className="flex items-start gap-2 text-gray-500 text-sm">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{p.address_text}</span>
                </div>
                
                {currentUser?.role === 'admin' && (
                  <button 
                    onClick={(e) => handleDelete(e, p.id)}
                    className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors z-10"
                    title="حذف پروژه"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            پروژه‌ای یافت نشد.
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { useStore } from '../services/api';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Map, 
  Settings, 
  Users, 
  LogOut, 
  PlusCircle,
  Tags,
  Cpu,
  Calculator
} from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  const { currentUser, logout, inquiries } = useStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Calculate pending inquiries for badge
  const pendingInquiriesCount = inquiries.filter(i => i.status === 'pending').length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-sky-400">دامون سرویس</h1>
          <p className="text-xs text-slate-400 mt-1">سامانه مدیریت و قیمت‌دهی</p>
        </div>

        <div className="p-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-lg font-bold">
              {currentUser.full_name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium">{currentUser.full_name}</p>
              <p className="text-xs text-slate-400">
                {currentUser.role === 'admin' && 'مدیر سیستم'}
                {currentUser.role === 'sales_manager' && 'مدیر فروش'}
                {currentUser.role === 'employee' && 'کارمند'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="داشبورد" />
          <NavItem to="/projects" icon={<FolderKanban size={20} />} label="پروژه‌ها" />
          <NavItem to="/map" icon={<Map size={20} />} label="نقشه پروژه‌ها" />
          
          {currentUser.role === 'admin' && (
            <>
              <div className="pt-4 pb-2 text-xs text-slate-500 font-bold px-2">مدیریت سیستم</div>
              <NavItem 
                to="/admin/inquiries" 
                icon={<Calculator size={20} />} 
                label="استعلام‌های منتظر تایید" 
                badge={pendingInquiriesCount > 0 ? pendingInquiriesCount : undefined}
              />
              <NavItem to="/admin/settings" icon={<Settings size={20} />} label="تنظیمات قیمت" />
              <NavItem to="/admin/users" icon={<Users size={20} />} label="کاربران" />
              <NavItem to="/admin/categories" icon={<Tags size={20} />} label="دسته‌بندی‌ها" />
              <NavItem to="/admin/devices" icon={<Cpu size={20} />} label="دستگاه‌ها" />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors text-sm"
          >
            <LogOut size={18} />
            <span>خروج از حساب</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-lg font-semibold text-gray-700">پنل کاربری</h2>
          {currentUser.role === 'employee' && (
             <NavLink to="/projects/new" className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <PlusCircle size={18} />
                <span>پروژه جدید</span>
             </NavLink>
          )}
        </header>
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 relative">
           <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label, badge }: { to: string, icon: React.ReactNode, label: string, badge?: number }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => clsx(
        "flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200",
        isActive 
          ? "bg-sky-600 text-white shadow-lg shadow-sky-900/20" 
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {badge !== undefined && (
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

import { useState } from 'react';
import { useStore } from '../../services/api';
import { Trash2, UserPlus, Shield, User as UserIcon, Briefcase } from 'lucide-react';
import { Role } from '../../lib/types';

export default function AdminUsers() {
  const { users, createUser, deleteUser, currentUser } = useStore();
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    role: 'employee' as Role
  });

  if (currentUser?.role !== 'admin') return <div>دسترسی غیرمجاز</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.full_name) return;
    
    createUser(formData);
    setShowModal(false);
    setFormData({ full_name: '', username: '', password: '', role: 'employee' });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مدیریت کاربران</h1>
          <p className="text-gray-500 mt-1">تعریف کارمندان و مدیران فروش</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-lg shadow-sky-600/20 transition-colors"
        >
          <UserPlus size={18} />
          <span className="hidden sm:inline">افزودن کاربر جدید</span>
          <span className="sm:hidden">افزودن</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">نام و نام خانوادگی</th>
                <th className="px-6 py-4 font-medium">نام کاربری</th>
                <th className="px-6 py-4 font-medium">نقش</th>
                <th className="px-6 py-4 font-medium">وضعیت</th>
                <th className="px-6 py-4 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">
                      {user.full_name.charAt(0)}
                    </div>
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm">{user.username}</td>
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      فعال
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.role !== 'admin' && (
                      <button 
                        onClick={() => deleteUser(user.id)}
                        className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                        title="حذف کاربر"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">افزودن کاربر جدید</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام و نام خانوادگی</label>
                <input 
                  required
                  type="text" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  value={formData.full_name}
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نام کاربری</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none ltr text-left"
                    value={formData.username}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رمز عبور</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none ltr text-left"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نقش کاربری</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`cursor-pointer border rounded-lg p-3 flex items-center gap-2 transition-all ${formData.role === 'employee' ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      className="hidden" 
                      checked={formData.role === 'employee'}
                      onChange={() => setFormData({...formData, role: 'employee'})}
                    />
                    <Briefcase size={20} className={formData.role === 'employee' ? 'text-sky-600' : 'text-gray-400'} />
                    <span className="text-sm font-medium">کارمند</span>
                  </label>

                  <label className={`cursor-pointer border rounded-lg p-3 flex items-center gap-2 transition-all ${formData.role === 'sales_manager' ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input 
                      type="radio" 
                      name="role" 
                      className="hidden" 
                      checked={formData.role === 'sales_manager'}
                      onChange={() => setFormData({...formData, role: 'sales_manager'})}
                    />
                    <Shield size={20} className={formData.role === 'sales_manager' ? 'text-sky-600' : 'text-gray-400'} />
                    <span className="text-sm font-medium">مدیر فروش</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
                >
                  انصراف
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium shadow-lg shadow-sky-600/20"
                >
                  ایجاد کاربر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
        <Shield size={12} />
        مدیر سیستم
      </span>
    );
  }
  if (role === 'sales_manager') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
        <UserIcon size={12} />
        مدیر فروش
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
      <Briefcase size={12} />
      کارمند
    </span>
  );
}

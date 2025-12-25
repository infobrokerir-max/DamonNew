import { useState } from 'react';
import { useStore } from '../../services/api';
import { Trash2, Plus, Tags, Edit2, Save, X } from 'lucide-react';
import { Category } from '../../lib/types';

export default function AdminCategories() {
  const { categories, createCategory, updateCategory, deleteCategory, currentUser } = useStore();
  
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  if (currentUser?.role !== 'admin') return <div>دسترسی غیرمجاز</div>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      updateCategory(editingId, name, desc);
      setEditingId(null);
    } else {
      createCategory(name, desc);
    }
    
    setName('');
    setDesc('');
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.category_name);
    setDesc(cat.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setDesc('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-sky-100 text-sky-600 rounded-xl">
          <Tags size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مدیریت دسته‌بندی‌ها</h1>
          <p className="text-gray-500">تعریف و ویرایش گروه‌های محصولات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit md:sticky md:top-6">
          <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-gray-800">
               {editingId ? 'ویرایش دسته‌بندی' : 'افزودن دسته جدید'}
             </h3>
             {editingId && (
               <button onClick={cancelEdit} className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded">
                 انصراف
               </button>
             )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام دسته‌بندی</label>
              <input 
                type="text" 
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="مثال: VRF"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات (اختیاری)</label>
              <textarea 
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none h-24"
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              className={`w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 text-white transition-colors ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-sky-600 hover:bg-sky-700'}`}
            >
              {editingId ? <Save size={18} /> : <Plus size={18} />}
              {editingId ? 'ذخیره تغییرات' : 'افزودن'}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[400px]">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm">
                <tr>
                  <th className="px-6 py-4">نام دسته</th>
                  <th className="px-6 py-4">توضیحات</th>
                  <th className="px-6 py-4">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map(c => (
                  <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${editingId === c.id ? 'bg-sky-50' : ''}`}>
                    <td className="px-6 py-4 font-medium text-gray-800">{c.category_name}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{c.description || '-'}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button 
                        onClick={() => handleEdit(c)} 
                        className="text-amber-500 hover:text-amber-700 p-2 hover:bg-amber-50 rounded transition-colors"
                        title="ویرایش"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => deleteCategory(c.id)} 
                        className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-8 text-gray-400">هیچ دسته‌ای تعریف نشده است.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

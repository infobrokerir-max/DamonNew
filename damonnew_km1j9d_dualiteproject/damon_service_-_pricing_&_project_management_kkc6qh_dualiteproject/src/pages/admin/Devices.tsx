import { useState } from 'react';
import { useStore } from '../../services/api';
import { Trash2, Plus, Cpu, Search, Edit2, Calculator, X } from 'lucide-react';
import { calculatePrice } from '../../lib/pricing';
import { PriceBreakdown } from '../../lib/types';

export default function AdminDevices() {
  const { devices, categories, settings, createDevice, updateDevice, deleteDevice, currentUser } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState<PriceBreakdown | null>(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Use strings for number fields to allow decimal input without immediate parsing issues
  const [formData, setFormData] = useState({
    model_name: '',
    category_id: '',
    factory_pricelist_eur: '',
    length_meter: '',
    weight_unit: '',
  });

  if (currentUser?.role !== 'admin') return <div>دسترسی غیرمجاز</div>;

  const openModal = (device?: any) => {
    if (device) {
      setEditingId(device.id);
      setFormData({
        model_name: device.model_name,
        category_id: device.category_id,
        factory_pricelist_eur: String(device.factory_pricelist_eur),
        length_meter: String(device.length_meter),
        weight_unit: String(device.weight_unit),
      });
    } else {
      setEditingId(null);
      setFormData({ model_name: '', category_id: '', factory_pricelist_eur: '', length_meter: '', weight_unit: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id) return alert('لطفا دسته‌بندی را انتخاب کنید');
    
    const payload = {
      model_name: formData.model_name,
      category_id: formData.category_id,
      factory_pricelist_eur: Number(formData.factory_pricelist_eur),
      length_meter: Number(formData.length_meter),
      weight_unit: Number(formData.weight_unit),
    };

    if (editingId) {
      updateDevice(editingId, payload);
    } else {
      createDevice(payload);
    }
    
    setShowModal(false);
  };

  const handleShowBreakdown = (device: any) => {
     const breakdown = calculatePrice(
       device.factory_pricelist_eur,
       device.length_meter,
       device.weight_unit,
       settings
     );
     setShowBreakdownModal(breakdown);
  };

  // Calculate preview for the modal
  const previewPrice = calculatePrice(
    Number(formData.factory_pricelist_eur) || 0,
    Number(formData.length_meter) || 0,
    Number(formData.weight_unit) || 0,
    settings
  );

  const filteredDevices = devices.filter(d => 
    d.model_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-100 text-sky-600 rounded-xl shrink-0">
            <Cpu size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">مدیریت دستگاه‌ها</h1>
            <p className="text-gray-500">تعریف مدل‌ها و قیمت‌های پایه (محرمانه)</p>
          </div>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-lg shadow-sky-600/20 transition-colors w-full md:w-auto"
        >
          <Plus size={18} />
          افزودن دستگاه جدید
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
           <div className="relative w-full max-w-md">
             <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
               type="text" 
               placeholder="جستجو در مدل‌ها..." 
               className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
               value={search}
               onChange={e => setSearch(e.target.value)}
             />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm">
              <tr>
                <th className="px-6 py-4">مدل دستگاه</th>
                <th className="px-6 py-4">دسته‌بندی</th>
                <th className="px-6 py-4 text-amber-700">قیمت خرید (P)</th>
                <th className="px-6 py-4 text-blue-700">طول (m)</th>
                <th className="px-6 py-4 text-purple-700">وزن (kg)</th>
                <th className="px-6 py-4">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDevices.map(d => {
                const cat = categories.find(c => c.id === d.category_id);
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-800 ltr text-right">{d.model_name}</td>
                    <td className="px-6 py-4 text-gray-600">{cat?.category_name || '-'}</td>
                    <td className="px-6 py-4 text-amber-700 font-mono">€ {d.factory_pricelist_eur.toLocaleString()}</td>
                    <td className="px-6 py-4 text-blue-700 font-mono">{d.length_meter}</td>
                    <td className="px-6 py-4 text-purple-700 font-mono">{d.weight_unit}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => handleShowBreakdown(d)} className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded transition-colors" title="محاسبه قیمت">
                        <Calculator size={18} />
                      </button>
                      <button onClick={() => openModal(d)} className="text-amber-500 hover:text-amber-700 p-2 hover:bg-amber-50 rounded transition-colors" title="ویرایش">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteDevice(d.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded transition-colors" title="حذف">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {editingId ? 'ویرایش دستگاه' : 'افزودن دستگاه جدید'}
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form Section */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نام مدل</label>
                  <input 
                    required
                    type="text" 
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none ltr text-left"
                    value={formData.model_name}
                    onChange={e => setFormData({...formData, model_name: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی</label>
                  <select 
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
                    value={formData.category_id}
                    onChange={e => setFormData({...formData, category_id: e.target.value})}
                  >
                    <option value="">انتخاب کنید...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-700 mb-1">قیمت خرید کارخانه (€)</label>
                  <input 
                    required
                    type="number" step="0.01"
                    className="w-full p-2.5 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none ltr text-left"
                    value={formData.factory_pricelist_eur}
                    onChange={e => setFormData({...formData, factory_pricelist_eur: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">طول (متر)</label>
                    <input 
                      required
                      type="number" step="0.01"
                      className="w-full p-2.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ltr text-left"
                      value={formData.length_meter}
                      onChange={e => setFormData({...formData, length_meter: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-700 mb-1">وزن (کیلوگرم)</label>
                    <input 
                      required
                      type="number" step="0.01"
                      className="w-full p-2.5 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ltr text-left"
                      value={formData.weight_unit}
                      onChange={e => setFormData({...formData, weight_unit: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 mt-2 border-t border-gray-100">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">انصراف</button>
                  <button type="submit" className="flex-1 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 shadow-lg shadow-sky-600/20">
                    {editingId ? 'ذخیره تغییرات' : 'ثبت دستگاه'}
                  </button>
                </div>
              </form>

              {/* Preview Section */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                 <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <Calculator size={18} />
                   پیش‌نمایش محاسبات (زنده)
                 </h4>
                 <div className="space-y-2 text-sm font-mono ltr text-left">
                    <div className="flex justify-between"><span>Factory Price (P):</span> <span className="font-bold">€{previewPrice.P.toLocaleString()}</span></div>
                    <div className="flex justify-between text-gray-500"><span>Discount (D):</span> <span>{previewPrice.D}</span></div>
                    <div className="flex justify-between bg-white p-1 border rounded"><span>Company Price (P*D):</span> <span className="font-bold">€{previewPrice.CompanyPriceEUR.toLocaleString()}</span></div>
                    
                    <div className="flex justify-between mt-2"><span>Length (L):</span> <span>{previewPrice.L} m</span></div>
                    <div className="flex justify-between text-gray-500"><span>Freight (F):</span> <span>{previewPrice.F}</span></div>
                    <div className="flex justify-between bg-white p-1 border rounded"><span>Shipment Cost (L*F):</span> <span className="font-bold">€{previewPrice.ShipmentEUR.toLocaleString()}</span></div>

                    <div className="flex justify-between mt-2"><span>Weight (W):</span> <span>{previewPrice.W} kg</span></div>
                    <div className="flex justify-between text-gray-500"><span>Customs (CN/CD):</span> <span>{previewPrice.CN}/{previewPrice.CD}</span></div>
                    <div className="flex justify-between bg-white p-1 border rounded"><span>Customs Cost:</span> <span className="font-bold">€{previewPrice.CustomEUR.toLocaleString()}</span></div>

                    <div className="flex justify-between mt-2 text-gray-500"><span>Warranty Rate (WR):</span> <span>{previewPrice.WR}</span></div>
                    <div className="flex justify-between bg-white p-1 border rounded"><span>Warranty Cost:</span> <span className="font-bold">€{previewPrice.WarrantyEUR.toLocaleString()}</span></div>

                    <div className="border-t my-2 pt-2 flex justify-between font-bold"><span>Subtotal:</span> <span>€{previewPrice.SubtotalEUR.toLocaleString()}</span></div>

                    <div className="flex justify-between text-xs text-gray-500"><span>Factors (COM/OFF/PF):</span> <span>{previewPrice.COM} / {previewPrice.OFF} / {previewPrice.PF}</span></div>

                    <div className="bg-sky-100 p-3 rounded mt-4 flex justify-between text-lg font-bold text-sky-800 border border-sky-200">
                      <span>Final Sell Price:</span>
                      <span>€{previewPrice.FinalSellPrice.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Modal (Read Only) */}
      {showBreakdownModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-bold text-gray-800">جزئیات محاسبه قیمت</h3>
              <button onClick={() => setShowBreakdownModal(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            <div className="space-y-2 text-sm font-mono ltr text-left">
              <div className="flex justify-between"><span>Factory Price (P):</span> <span className="font-bold">€{showBreakdownModal.P.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Discount (D):</span> <span>{showBreakdownModal.D}</span></div>
              <div className="flex justify-between bg-gray-50 p-1"><span>Company Price (P*D):</span> <span className="font-bold">€{showBreakdownModal.CompanyPriceEUR.toLocaleString()}</span></div>
              
              <div className="flex justify-between mt-2"><span>Length (L):</span> <span>{showBreakdownModal.L} m</span></div>
              <div className="flex justify-between"><span>Freight Rate (F):</span> <span>{showBreakdownModal.F}</span></div>
              <div className="flex justify-between bg-gray-50 p-1"><span>Shipment Cost (L*F):</span> <span className="font-bold">€{showBreakdownModal.ShipmentEUR.toLocaleString()}</span></div>

              <div className="flex justify-between mt-2"><span>Weight (W):</span> <span>{showBreakdownModal.W} kg</span></div>
              <div className="flex justify-between"><span>Customs (CN/CD):</span> <span>{showBreakdownModal.CN}/{showBreakdownModal.CD}</span></div>
              <div className="flex justify-between bg-gray-50 p-1"><span>Customs Cost:</span> <span className="font-bold">€{showBreakdownModal.CustomEUR.toLocaleString()}</span></div>

              <div className="flex justify-between mt-2"><span>Warranty Rate (WR):</span> <span>{showBreakdownModal.WR}</span></div>
              <div className="flex justify-between bg-gray-50 p-1"><span>Warranty Cost:</span> <span className="font-bold">€{showBreakdownModal.WarrantyEUR.toLocaleString()}</span></div>

              <div className="border-t my-2 pt-2 flex justify-between font-bold"><span>Subtotal:</span> <span>€{showBreakdownModal.SubtotalEUR.toLocaleString()}</span></div>

              <div className="flex justify-between"><span>Commission Factor:</span> <span>{showBreakdownModal.COM}</span></div>
              <div className="flex justify-between"><span>Office Factor:</span> <span>{showBreakdownModal.OFF}</span></div>
              <div className="flex justify-between"><span>Profit Factor:</span> <span>{showBreakdownModal.PF}</span></div>

              <div className="bg-sky-50 p-3 rounded mt-4 flex justify-between text-lg font-bold text-sky-800">
                <span>Final Sell Price:</span>
                <span>€{showBreakdownModal.FinalSellPrice.toLocaleString()}</span>
              </div>
            </div>
            <button onClick={() => setShowBreakdownModal(null)} className="w-full mt-6 py-2 bg-gray-800 text-white rounded-lg">بستن</button>
          </div>
        </div>
      )}
    </div>
  );
}

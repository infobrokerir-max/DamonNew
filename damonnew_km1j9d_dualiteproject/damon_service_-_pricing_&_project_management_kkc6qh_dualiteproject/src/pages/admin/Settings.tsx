import { useState } from 'react';
import { useStore } from '../../services/api';
import { Save, AlertTriangle, Database, RefreshCw, CheckCircle } from 'lucide-react';

export default function AdminSettings() {
  const { settings, updateSettings, currentUser, syncWithGoogleSheets, isSyncing, syncError } = useStore();
  const [formData, setFormData] = useState(settings);

  if (currentUser?.role !== 'admin') return <div>دسترسی غیرمجاز</div>;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setFormData({ ...formData, [e.target.name]: isNaN(val) ? 0 : val });
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    updateSettings(formData);
    alert('تنظیمات با موفقیت ذخیره شد.');
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">تنظیمات سیستم</h1>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-sky-600/20 transition-colors"
        >
          <Save size={18} />
          ذخیره تغییرات
        </button>
      </div>

      {/* Google Sheets Integration Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          <div className="p-2 bg-green-100 text-green-700 rounded-lg">
            <Database size={24} />
          </div>
          <div>
             <h3 className="text-lg font-bold text-gray-800">اتصال به دیتابیس گوگل شیت</h3>
             <p className="text-sm text-gray-500">برای ذخیره و بازیابی اطلاعات از فایل اکسل آنلاین</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">آدرس وب‌اپلیکیشن گوگل اسکریپت (Google Script Web App URL)</label>
            <input 
              type="text" 
              name="google_script_url"
              value={formData.google_script_url || ''}
              onChange={handleTextChange}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none ltr text-left font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-2">
              دستورالعمل: فایل <code>google-script-template.js</code> را در بخش Apps Script گوگل شیت خود کپی کنید و به عنوان Web App (دسترسی Anyone) منتشر کنید.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
             <button 
               onClick={syncWithGoogleSheets}
               disabled={isSyncing || !formData.google_script_url}
               className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
             >
               <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
               {isSyncing ? 'در حال همگام‌سازی...' : 'همگام‌سازی دستی'}
             </button>
             
             {settings.last_sync_at && (
               <span className="text-xs text-gray-500 flex items-center gap-1">
                 <CheckCircle size={14} className="text-green-500" />
                 آخرین آپدیت: {new Date(settings.last_sync_at).toLocaleString('fa-IR')}
               </span>
             )}
          </div>
          {syncError && <p className="text-red-500 text-sm mt-2">{syncError}</p>}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3 text-amber-800 text-sm">
        <AlertTriangle className="shrink-0 mt-0.5" />
        <p>
          هشدار: تغییر ضرایب زیر بلافاصله روی تمام استعلام‌های جدید تاثیر می‌گذارد.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-4">ضرایب محاسباتی</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          
          <SettingInput 
            label="ضریب تخفیف (D)" 
            name="discount_multiplier" 
            value={formData.discount_multiplier} 
            onChange={handleChange} 
            desc="Discount Multiplier (Ex: 0.38)"
          />

          <SettingInput 
            label="هزینه حمل به ازای متر (F)" 
            name="freight_rate_per_meter_eur" 
            value={formData.freight_rate_per_meter_eur} 
            onChange={handleChange} 
            desc="Freight Rate (EUR)"
          />

          <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="col-span-2 font-bold text-gray-700 text-sm mb-2">محاسبه گمرک (Customs)</h4>
            <SettingInput 
              label="صورت کسر گمرک (CN)" 
              name="customs_numerator" 
              value={formData.customs_numerator} 
              onChange={handleChange} 
            />
            <SettingInput 
              label="مخرج کسر گمرک (CD)" 
              name="customs_denominator" 
              value={formData.customs_denominator} 
              onChange={handleChange} 
            />
          </div>

          <SettingInput 
            label="نرخ گارانتی (WR)" 
            name="warranty_rate" 
            value={formData.warranty_rate} 
            onChange={handleChange} 
            desc="Warranty Rate (Ex: 0.05)"
          />

          <SettingInput 
            label="ضریب کمیسیون (COM)" 
            name="commission_factor" 
            value={formData.commission_factor} 
            onChange={handleChange} 
            desc="Commission Factor (Ex: 0.95)"
          />

          <SettingInput 
            label="ضریب دفتر (OFF)" 
            name="office_factor" 
            value={formData.office_factor} 
            onChange={handleChange} 
            desc="Office Factor (Ex: 0.95)"
          />

          <SettingInput 
            label="ضریب سود (PF)" 
            name="profit_factor" 
            value={formData.profit_factor} 
            onChange={handleChange} 
            desc="Profit Factor (Ex: 0.65)"
          />

        </div>
      </div>
    </div>
  );
}

function SettingInput({ label, name, value, onChange, desc }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input 
        type="number" 
        step="0.01"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none ltr text-left font-mono"
      />
      {desc && <p className="text-xs text-gray-400 mt-1 ltr text-left">{desc}</p>}
    </div>
  );
}

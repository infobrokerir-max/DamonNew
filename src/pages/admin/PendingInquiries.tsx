import { useState } from 'react';
import { useStore } from '../../services/api';
import { Check, X, Eye, Calculator, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PriceBreakdown } from '../../lib/types';

export default function AdminPendingInquiries() {
  const { inquiries, projects, devices, users, approveInquiry, rejectInquiry, currentUser } = useStore();
  const [breakdownModal, setBreakdownModal] = useState<PriceBreakdown | null>(null);

  if (currentUser?.role !== 'admin') return <div>دسترسی غیرمجاز</div>;

  // Filter only pending inquiries and sort by newest first
  const pendingInquiries = inquiries
    .filter(i => i.status === 'pending')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-sky-100 text-sky-600 rounded-xl">
          <Calculator size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">استعلام‌های در انتظار تایید</h1>
          <p className="text-gray-500">لیست درخواست‌های قیمت‌گذاری که نیاز به بررسی و تایید دارند</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {pendingInquiries.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Check size={32} className="text-green-500" />
            </div>
            <p className="text-lg font-medium text-gray-600">هیچ استعلام منتظری وجود ندارد</p>
            <p className="text-sm">تمام درخواست‌ها بررسی شده‌اند.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[800px]">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-sm">
                <tr>
                  <th className="px-6 py-4">پروژه</th>
                  <th className="px-6 py-4">درخواست کننده</th>
                  <th className="px-6 py-4">دستگاه</th>
                  <th className="px-6 py-4">قیمت محاسبه شده</th>
                  <th className="px-6 py-4">زمان درخواست</th>
                  <th className="px-6 py-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingInquiries.map(inq => {
                  const project = projects.find(p => p.id === inq.project_id);
                  const user = users.find(u => u.id === inq.requested_by_user_id);
                  const device = devices.find(d => d.id === inq.device_id);

                  return (
                    <tr key={inq.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <Link to={`/projects/${project?.id}`} className="font-bold text-sky-600 hover:underline block">
                          {project?.project_name || 'ناشناس'}
                        </Link>
                        <span className="text-xs text-gray-500">{project?.employer_name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                            {user?.full_name.charAt(0)}
                          </div>
                          {user?.full_name || 'ناشناس'}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800 ltr text-right">
                        {device?.model_name || 'Unknown Device'}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800 dir-ltr text-right">
                        € {inq.sell_price_eur_snapshot.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(inq.created_at).toLocaleDateString('fa-IR')}
                        <br />
                        {new Date(inq.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => approveInquiry(inq.id)} 
                            className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                            title="تایید قیمت"
                          >
                            <Check size={16} /> تایید
                          </button>
                          <button 
                            onClick={() => rejectInquiry(inq.id)} 
                            className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                            title="رد درخواست"
                          >
                            <X size={16} /> رد
                          </button>
                          <button 
                            onClick={() => setBreakdownModal(inq.calculation_breakdown)} 
                            className="p-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            title="مشاهده ریز محاسبات"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Breakdown Modal (Reused) */}
      {breakdownModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">جزئیات محاسبه قیمت</h3>
            <div className="space-y-2 text-sm font-mono ltr text-left">
              <div className="flex justify-between"><span>Factory Price (P):</span> <span className="font-bold">€{breakdownModal.P.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Discount (D):</span> <span>{breakdownModal.D}</span></div>
              <div className="flex justify-between bg-gray-50 p-1"><span>Company Price (P*D):</span> <span className="font-bold">€{breakdownModal.CompanyPriceEUR.toLocaleString()}</span></div>
              
              <div className="flex justify-between mt-2"><span>Length (L):</span> <span>{breakdownModal.L} m</span></div>
              <div className="flex justify-between"><span>Freight Rate (F):</span> <span>{breakdownModal.F}</span></div>
              <div className="flex justify-between bg-gray-50 p-1"><span>Shipment Cost (L*F):</span> <span className="font-bold">€{breakdownModal.ShipmentEUR.toLocaleString()}</span></div>

              <div className="flex justify-between mt-2"><span>Weight (W):</span> <span>{breakdownModal.W} kg</span></div>
              <div className="flex justify-between"><span>Customs (CN/CD):</span> <span>{breakdownModal.CN}/{breakdownModal.CD}</span></div>
              <div className="flex justify-between bg-gray-50 p-1"><span>Customs Cost:</span> <span className="font-bold">€{breakdownModal.CustomEUR.toLocaleString()}</span></div>

              <div className="flex justify-between mt-2"><span>Warranty Rate (WR):</span> <span>{breakdownModal.WR}</span></div>
              <div className="flex justify-between bg-gray-50 p-1"><span>Warranty Cost:</span> <span className="font-bold">€{breakdownModal.WarrantyEUR.toLocaleString()}</span></div>

              <div className="border-t my-2 pt-2 flex justify-between font-bold"><span>Subtotal:</span> <span>€{breakdownModal.SubtotalEUR.toLocaleString()}</span></div>

              <div className="flex justify-between"><span>Commission Factor:</span> <span>{breakdownModal.COM}</span></div>
              <div className="flex justify-between"><span>Office Factor:</span> <span>{breakdownModal.OFF}</span></div>
              <div className="flex justify-between"><span>Profit Factor:</span> <span>{breakdownModal.PF}</span></div>

              <div className="bg-sky-50 p-3 rounded mt-4 flex justify-between text-lg font-bold text-sky-800">
                <span>Final Sell Price:</span>
                <span>€{breakdownModal.FinalSellPrice.toLocaleString()}</span>
              </div>
            </div>
            <button onClick={() => setBreakdownModal(null)} className="w-full mt-6 py-2 bg-gray-800 text-white rounded-lg">بستن</button>
          </div>
        </div>
      )}
    </div>
  );
}

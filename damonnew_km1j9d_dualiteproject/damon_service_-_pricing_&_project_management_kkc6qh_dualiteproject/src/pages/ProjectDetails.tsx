import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore, useDevices } from '../services/api';
import { StatusBadge } from './Dashboard';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { 
  ArrowRight, MapPin, Calculator, MessageSquare, 
  Send, Shield, Check, X, Eye, Trash2
} from 'lucide-react';
import clsx from 'clsx';
import { PriceBreakdown } from '../lib/types';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    projects, currentUser, inquiries, comments, categories,
    updateProjectStatus, addComment, requestInquiry, approveInquiry, rejectInquiry, deleteProject
  } = useStore();
  const devices = useDevices();

  const project = projects.find(p => p.id === id);
  const projectInquiries = inquiries.filter(i => i.project_id === id).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const projectComments = comments.filter(c => c.project_id === id);

  const [commentText, setCommentText] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [breakdownModal, setBreakdownModal] = useState<PriceBreakdown | null>(null);

  if (!project || !currentUser) return <div>پروژه یافت نشد</div>;

  const canApprove = (currentUser.role === 'sales_manager' || currentUser.role === 'admin') && project.status === 'pending_approval';
  const canInquire = (currentUser.role === 'employee' && project.status === 'approved') || currentUser.role !== 'employee';

  const handleStatusChange = (status: string, note?: string) => {
    updateProjectStatus(project.id, status as any, note);
    setShowRejectModal(false);
  };

  const handleDeleteProject = () => {
    if (window.confirm('هشدار: آیا از حذف کامل این پروژه و تمام سوابق آن اطمینان دارید؟')) {
      deleteProject(project.id);
      navigate('/projects');
    }
  };

  const handleInquiry = () => {
    if (!selectedDevice) return;
    requestInquiry(project.id, selectedDevice);
    setSelectedDevice('');
    alert('درخواست استعلام با موفقیت ارسال شد. پس از تایید ادمین، قیمت قابل مشاهده خواهد بود.');
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    addComment(project.id, commentText);
    setCommentText('');
  };

  const filteredDevices = devices.filter(d => d.category_id === selectedCategory);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors mt-1">
            <ArrowRight className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex flex-wrap items-center gap-3">
              {project.project_name}
              <StatusBadge status={project.status} />
            </h1>
            <p className="text-gray-500 text-sm mt-1">{project.employer_name} | {project.project_type}</p>
          </div>
        </div>
        
        {currentUser.role === 'admin' && (
          <button 
            onClick={handleDeleteProject}
            className="flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-medium transition-colors w-full md:w-auto"
          >
            <Trash2 size={18} />
            حذف پروژه
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {canApprove && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-amber-800 w-full sm:w-auto">
                <Shield size={24} className="shrink-0" />
                <div>
                  <p className="font-bold">نیاز به بررسی</p>
                  <p className="text-sm">این پروژه منتظر تایید شماست.</p>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setShowRejectModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  رد پروژه
                </button>
                <button 
                  onClick={() => handleStatusChange('approved')}
                  className="flex-1 sm:flex-none px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-colors shadow-sm"
                >
                  تایید پروژه
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-48 md:h-64 z-0 relative">
              <MapContainer 
                center={[project.tehran_lat, project.tehran_lng]} 
                zoom={14} 
                scrollWheelZoom={false} 
                className="h-full w-full"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[project.tehran_lat, project.tehran_lng]} />
              </MapContainer>
            </div>
            <div className="p-4 md:p-6">
              <div className="flex items-start gap-3 text-gray-600 mb-4">
                <MapPin className="shrink-0 mt-1" />
                <p>{project.address_text}</p>
              </div>
              {project.additional_info && (
                <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                  <span className="font-bold block mb-1">توضیحات تکمیلی:</span>
                  {project.additional_info}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Calculator size={20} className="text-sky-600" />
              استعلام قیمت
            </h3>

            {canInquire ? (
              <div className="bg-sky-50/50 border border-sky-100 rounded-xl p-4 md:p-5 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <select 
                    className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white w-full"
                    value={selectedCategory}
                    onChange={e => { setSelectedCategory(e.target.value); setSelectedDevice(''); }}
                  >
                    <option value="">انتخاب دسته‌بندی...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                  </select>
                  
                  <select 
                    className="p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white md:col-span-2 w-full"
                    value={selectedDevice}
                    onChange={e => setSelectedDevice(e.target.value)}
                    disabled={!selectedCategory}
                  >
                    <option value="">انتخاب دستگاه...</option>
                    {filteredDevices.map(d => <option key={d.id} value={d.id}>{d.model_name}</option>)}
                  </select>
                </div>
                <button 
                  onClick={handleInquiry}
                  disabled={!selectedDevice}
                  className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg transition-colors"
                >
                  درخواست استعلام قیمت
                </button>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500 mb-8 text-sm">
                امکان استعلام برای این پروژه در وضعیت فعلی وجود ندارد.
              </div>
            )}

            <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
              <table className="w-full text-right text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-500">
                    <th className="pb-3">دستگاه</th>
                    <th className="pb-3">وضعیت</th>
                    <th className="pb-3">قیمت فروش (EUR)</th>
                    {/* Only Admin can see Price List (P) */}
                    {currentUser.role === 'admin' && <th className="pb-3 text-amber-600">قیمت لیست (P)</th>}
                    <th className="pb-3">تاریخ درخواست</th>
                    {currentUser.role === 'admin' && <th className="pb-3">عملیات</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projectInquiries.map(inq => {
                     const device = devices.find(d => d.id === inq.device_id);
                     const isAdmin = currentUser.role === 'admin';
                     const isPending = inq.status === 'pending';
                     const isRejected = inq.status === 'rejected';
                     
                     return (
                      <tr key={inq.id} className={isPending ? "bg-amber-50/30" : ""}>
                        <td className="py-3 font-medium">{device?.model_name || 'Unknown'}</td>
                        <td className="py-3">
                          {isPending && <span className="text-amber-600 text-xs font-bold bg-amber-100 px-2 py-1 rounded">در انتظار تایید</span>}
                          {inq.status === 'approved' && <span className="text-green-600 text-xs font-bold bg-green-100 px-2 py-1 rounded">تایید شده</span>}
                          {isRejected && <span className="text-red-600 text-xs font-bold bg-red-100 px-2 py-1 rounded">رد شده</span>}
                        </td>
                        <td className="py-3 font-bold text-gray-800">
                          {inq.status === 'approved' || isAdmin ? (
                            `€ ${inq.sell_price_eur_snapshot.toLocaleString()}`
                          ) : (
                            <span className="text-gray-400 text-xs">پنهان</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="py-3 text-amber-600">
                            € {(device as any)?.factory_pricelist_eur?.toLocaleString() || '-'}
                          </td>
                        )}
                        <td className="py-3 text-gray-500 text-xs">
                           {new Date(inq.created_at).toLocaleDateString('fa-IR')} <br/>
                           {new Date(inq.created_at).toLocaleTimeString('fa-IR')}
                        </td>
                        {isAdmin && (
                          <td className="py-3 flex items-center gap-2">
                            {isPending && (
                              <>
                                <button onClick={() => approveInquiry(inq.id)} title="تایید" className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"><Check size={16} /></button>
                                <button onClick={() => rejectInquiry(inq.id)} title="رد" className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"><X size={16} /></button>
                              </>
                            )}
                            <button onClick={() => setBreakdownModal(inq.calculation_breakdown)} title="مشاهده محاسبات" className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"><Eye size={16} /></button>
                          </td>
                        )}
                      </tr>
                     );
                  })}
                </tbody>
              </table>
              {projectInquiries.length === 0 && <p className="text-center text-gray-400 mt-4">هیچ استعلامی ثبت نشده است.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 h-[500px] lg:h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-sky-600" />
              گفتگو و سوابق
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-6 pl-2 custom-scrollbar mb-4">
              {projectComments.map(comment => {
                 const author = useStore.getState().users.find(u => u.id === comment.author_user_id);
                 const isMe = author?.id === currentUser.id;
                 const isSystem = comment.id.startsWith('cm-sys');

                 if (isSystem) {
                   return (
                     <div key={comment.id} className="flex justify-center">
                       <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full text-center">
                         {comment.body} <br className="sm:hidden" />
                         <span className="opacity-70 text-[10px]">
                           {new Date(comment.created_at).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}
                         </span>
                       </span>
                     </div>
                   )
                 }

                 return (
                   <div key={comment.id} className={clsx("flex flex-col", isMe ? "items-start" : "items-end")}>
                     <div className={clsx(
                       "max-w-[90%] rounded-2xl p-3 text-sm",
                       isMe ? "bg-sky-100 text-sky-900 rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
                     )}>
                       <p className="font-bold text-xs mb-1 opacity-70">{author?.full_name} ({author?.role})</p>
                       <p>{comment.body}</p>
                     </div>
                     <span className="text-[10px] text-gray-400 mt-1 px-1">
                       {new Date(comment.created_at).toLocaleDateString('fa-IR')} {new Date(comment.created_at).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}
                     </span>
                   </div>
                 );
              })}
            </div>

            <div className="relative mt-auto">
              <input 
                type="text" 
                placeholder="نوشتن پیام..." 
                className="w-full pr-4 pl-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleComment()}
              />
              <button 
                onClick={handleComment}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
              >
                <Send size={16} className="rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-red-600 mb-4">رد پروژه</h3>
            <textarea 
              className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-red-500 outline-none mb-4"
              placeholder="علت رد..."
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
            ></textarea>
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">انصراف</button>
              <button onClick={() => handleStatusChange('rejected', rejectNote)} disabled={!rejectNote.trim()} className="flex-1 py-2 bg-red-600 text-white rounded-lg">ثبت رد</button>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Modal */}
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

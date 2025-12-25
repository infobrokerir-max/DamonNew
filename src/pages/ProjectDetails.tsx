import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../services/api';
import { StatusBadge } from './Dashboard';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import {
  ArrowRight, MapPin, Calculator, MessageSquare,
  Send, Shield, Search
} from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentUser, getProjectDetail, approveProject, rejectProject,
    addComment, requestQuote, loadCategories, categories, searchDevices
  } = useStore();

  const [projectData, setProjectData] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [deviceQuery, setDeviceQuery] = useState('');
  const [deviceResults, setDeviceResults] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (id) {
      loadProjectDetail();
    }
  }, [id]);

  const loadProjectDetail = async () => {
    if (!id) return;
    const data = await getProjectDetail(id);
    setProjectData(data);
  };

  const handleApprove = async () => {
    if (!id) return;
    const success = await approveProject(id);
    if (success) {
      loadProjectDetail();
    }
  };

  const handleReject = async () => {
    if (!id || !rejectNote.trim()) {
      alert('لطفا دلیل رد پروژه را وارد کنید.');
      return;
    }
    const success = await rejectProject(id, rejectNote);
    if (success) {
      setShowRejectModal(false);
      setRejectNote('');
      loadProjectDetail();
    }
  };

  const handleSearchDevices = async () => {
    if (!deviceQuery.trim()) return;
    const results = await searchDevices(deviceQuery, selectedCategory);
    setDeviceResults(results);
  };

  const handleRequestQuote = async () => {
    if (!selectedDevice || !id) return;
    const result = await requestQuote(id, selectedDevice, 1);
    if (result) {
      alert(`قیمت: ${result.sell_price_eur} یورو`);
      loadProjectDetail();
      setSelectedDevice('');
      setDeviceResults([]);
      setDeviceQuery('');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !id) return;
    const success = await addComment(id, commentText);
    if (success) {
      setCommentText('');
      loadProjectDetail();
    }
  };

  if (!projectData || !currentUser) {
    return <div className="text-center py-8">در حال بارگذاری...</div>;
  }

  const project = projectData.project;
  const canApprove = (currentUser.role === 'sales_manager' || currentUser.role === 'admin') && project.status === 'pending_approval';

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors mt-1">
          <ArrowRight className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            {project.project_name}
            <StatusBadge status={project.status} />
          </h1>
          <p className="text-gray-500 mt-1">{project.employer_name} | {project.project_type}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {canApprove && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-3 text-amber-800">
                <Shield size={24} />
                <div>
                  <p className="font-bold">نیاز به بررسی</p>
                  <p className="text-sm">این پروژه منتظر تایید شماست.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  رد پروژه
                </button>
                <button
                  onClick={handleApprove}
                  className="px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg font-medium transition-colors shadow-sm"
                >
                  تایید پروژه
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-64 z-0 relative">
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
            <div className="p-6">
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Calculator size={20} className="text-sky-600" />
              استعلام قیمت
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">انتخاب دسته‌بندی</label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="">همه دسته‌ها</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">جستجوی دستگاه</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                    placeholder="نام مدل را وارد کنید..."
                    value={deviceQuery}
                    onChange={e => setDeviceQuery(e.target.value)}
                  />
                  <button
                    onClick={handleSearchDevices}
                    className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                  >
                    <Search size={20} />
                  </button>
                </div>
              </div>

              {deviceResults.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">نتایج جستجو:</label>
                  {deviceResults.map(dev => (
                    <label key={dev.device_id} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="device"
                        value={dev.device_id}
                        checked={selectedDevice === dev.device_id}
                        onChange={e => setSelectedDevice(e.target.value)}
                      />
                      <span className="text-sm text-gray-700">{dev.model_name} ({dev.category_name})</span>
                    </label>
                  ))}
                </div>
              )}

              {selectedDevice && (
                <button
                  onClick={handleRequestQuote}
                  className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                >
                  دریافت قیمت
                </button>
              )}
            </div>

            {projectData.inquiries && projectData.inquiries.length > 0 && (
              <div>
                <h4 className="font-bold text-gray-800 mb-3">استعلام‌های ثبت شده:</h4>
                <div className="space-y-2">
                  {projectData.inquiries.map((inq: any) => (
                    <div key={inq.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{inq.model_name}</p>
                          <p className="text-sm text-gray-500">{inq.category_name}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-green-600">{inq.sell_price_eur} EUR</p>
                          {currentUser.role === 'admin' && inq.factory_pricelist_eur && (
                            <p className="text-xs text-gray-500">کارخانه: {inq.factory_pricelist_eur} EUR</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-sky-600" />
              نظرات
            </h3>

            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {projectData.comments && projectData.comments.length > 0 ? (
                projectData.comments.map((c: any) => (
                  <div key={c.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-gray-800">{c.author_role_snapshot}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(c.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{c.body}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-4">نظری ثبت نشده است.</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                placeholder="نظر خود را بنویسید..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
              />
              <button
                onClick={handleComment}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">رد پروژه</h3>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none mb-4"
              rows={4}
              placeholder="لطفا دلیل رد پروژه را وارد کنید..."
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                ثبت رد پروژه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

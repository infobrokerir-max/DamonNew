import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../services/api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin } from 'lucide-react';

// Component to handle map clicks
function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function ProjectCreate() {
  const navigate = useNavigate();
  const { createProject } = useStore();
  
  const [formData, setFormData] = useState({
    project_name: '',
    employer_name: '',
    project_type: 'مسکونی',
    address_text: '',
    additional_info: '',
  });
  
  const [position, setPosition] = useState<[number, number]>([35.6892, 51.3890]); // Tehran center

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject({
      ...formData,
      tehran_lat: position[0],
      tehran_lng: position[1],
    });
    navigate('/projects');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">ایجاد پروژه جدید</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نام پروژه *</label>
            <input 
              required
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              value={formData.project_name}
              onChange={e => setFormData({...formData, project_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نام کارفرما *</label>
            <input 
              required
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              value={formData.employer_name}
              onChange={e => setFormData({...formData, employer_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع پروژه *</label>
            <select 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none bg-white"
              value={formData.project_type}
              onChange={e => setFormData({...formData, project_type: e.target.value})}
            >
              <option value="مسکونی">مسکونی</option>
              <option value="اداری">اداری</option>
              <option value="تجاری">تجاری</option>
              <option value="درمانی">درمانی</option>
              <option value="صنعتی">صنعتی</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">آدرس دقیق *</label>
            <input 
              required
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              value={formData.address_text}
              onChange={e => setFormData({...formData, address_text: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <MapPin size={16} />
            موقعیت روی نقشه (برای انتخاب کلیک کنید)
          </label>
          <div className="h-64 rounded-lg overflow-hidden border border-gray-300 z-0 relative">
            <MapContainer center={position} zoom={11} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker position={position} setPosition={setPosition} />
            </MapContainer>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات تکمیلی</label>
          <textarea 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none h-24"
            value={formData.additional_info}
            onChange={e => setFormData({...formData, additional_info: e.target.value})}
          ></textarea>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
          <button 
            type="button"
            onClick={() => navigate('/projects')}
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
          >
            انصراف
          </button>
          <button 
            type="submit"
            className="px-6 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium shadow-lg shadow-sky-600/20"
          >
            ثبت پروژه
          </button>
        </div>
      </form>
    </div>
  );
}

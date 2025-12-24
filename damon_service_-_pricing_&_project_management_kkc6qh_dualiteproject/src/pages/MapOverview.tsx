import { useProjects } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { StatusBadge } from './Dashboard';

export default function MapOverview() {
  const projects = useProjects();

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">نقشه پراکندگی پروژه‌ها</h1>
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 shadow-sm z-0 relative">
        <MapContainer center={[35.6892, 51.3890]} zoom={11} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {projects.map(p => (
            <Marker key={p.id} position={[p.tehran_lat, p.tehran_lng]}>
              <Popup>
                <div className="text-right font-vazir min-w-[200px]">
                  <h3 className="font-bold text-base mb-1">{p.project_name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{p.employer_name}</p>
                  <div className="mb-3">
                    <StatusBadge status={p.status} />
                  </div>
                  <Link 
                    to={`/projects/${p.id}`}
                    className="block text-center bg-sky-600 text-white py-1.5 rounded text-sm hover:bg-sky-700"
                  >
                    مشاهده جزئیات
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../services/google-apps-client';
import { Lock, User, Key } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!username.trim()) {
      setError('لطفا نام کاربری را وارد کنید.');
      return;
    }

    if (!newPassword) {
      setError('لطفا رمز عبور جدید را وارد کنید.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('رمز عبور و تکرار آن مطابقت ندارند.');
      return;
    }

    setIsLoading(true);

    const response = await apiClient.resetPassword(username, newPassword);

    setIsLoading(false);

    if (response.ok && response.data) {
      setSuccess(`رمز عبور با موفقیت تغییر یافت. حالا می‌توانید با رمز عبور جدید وارد شوید.`);
      setUsername('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(response.message || 'خطا در تغییر رمز عبور');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <Key size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">تنظیم مجدد رمز عبور</h1>
          <p className="text-gray-500 mt-2">رمز عبور جدید خود را وارد کنید</p>
        </div>

        <form onSubmit={handleReset} className="space-y-6">
          <div className="relative">
            <User className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="نام کاربری"
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="رمز عبور جدید"
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="تکرار رمز عبور جدید"
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none transition-all"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-sky-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'در حال تغییر...' : 'تغییر رمز عبور'}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sky-600 hover:text-sky-700 text-sm font-medium"
            >
              بازگشت به صفحه ورود
            </Link>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs text-amber-800">
              <strong>نکته:</strong> این ابزار فقط برای محیط توسعه (Development) است. در محیط تولید، این قابلیت باید غیرفعال شود.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

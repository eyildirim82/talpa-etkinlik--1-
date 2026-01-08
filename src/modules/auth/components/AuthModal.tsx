import React, { useState } from 'react';
import { X, AlertTriangle, User, Lock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { loginWithFormData, signupWithFormData } from '../api/auth.api';
import { Button } from '@/src/components/common/Button';

interface AuthModalProps {
  onClose: () => void;
}

type Tab = 'login' | 'signup';

export const AuthModal = ({ onClose }: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const action = activeTab === 'login' ? loginWithFormData : signupWithFormData;
      const result = await action(formData);

      if (!result.success) {
        setError(result.message);
      } else {
        // Giriş başarılı olduğunda profile ve booking query'lerini invalidate et
        // Bu sayede auth state otomatik olarak güncellenecek
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['booking'] });
        queryClient.invalidateQueries({ queryKey: ['activeEvent'] });
        onClose();
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      <div className="relative z-20 w-full max-w-md">

        {/* Main Card */}
        <div className="bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-200 backdrop-blur-md bg-opacity-95 transform transition-all animate-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {activeTab === 'login' ? 'Hoşgeldiniz' : 'Aramıza Katılın'}
            </h2>
            <p className="text-gray-500 text-sm">
              {activeTab === 'login'
                ? 'Hesabınıza giriş yaparak etkinlikleri takip edin.'
                : 'Kayıt olarak TALPA etkinliklerine erişim sağlayabilirsiniz.'}
            </p>
          </div>

          {/* Form Section */}
          <div className="px-8 pb-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md flex items-center gap-2 text-red-600 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Tab Switcher (Optional, simplified for this layout) */}
              <div className="flex justify-center mb-4 text-xs font-bold tracking-widest uppercase border-b border-gray-100 pb-2 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`transition-colors ${activeTab === 'login' ? 'text-talpa-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  GİRİŞ YAP
                </button>
                <div className="w-px bg-gray-200 h-3 self-center" />
                <button
                  type="button"
                  onClick={() => setActiveTab('signup')}
                  className={`transition-colors ${activeTab === 'signup' ? 'text-talpa-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  KAYIT OL
                </button>
              </div>

              {activeTab === 'signup' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1">Ad Soyad</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="text-gray-400 w-5 h-5" />
                      </div>
                      <input
                        name="fullName"
                        type="text"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-talpa-primary focus:border-talpa-primary sm:text-sm transition-colors"
                        placeholder="Ad Soyad"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1">Sicil No</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="text-gray-400 w-5 h-5" />
                      </div>
                      <input
                        name="sicilNo"
                        type="text"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-talpa-primary focus:border-talpa-primary sm:text-sm transition-colors"
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1" htmlFor="email">
                  E-Posta veya Kullanıcı Adı
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="text-gray-400 w-5 h-5" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-talpa-primary focus:border-talpa-primary sm:text-sm transition-colors"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider" htmlFor="password">
                    Şifre
                  </label>
                  {activeTab === 'login' && (
                    <a className="text-xs font-medium text-talpa-primary hover:text-talpa-accent transition-colors cursor-pointer">
                      Şifremi Unuttum?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-gray-400 w-5 h-5" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-talpa-primary focus:border-talpa-primary sm:text-sm transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  isLoading={isLoading}
                  fullWidth
                  variant="primary"
                  className="uppercase tracking-wide font-bold"
                >
                  {activeTab === 'login' ? 'GİRİŞ YAP' : 'KAYIT OL'}
                </Button>
              </div>

            </form>
          </div>
        </div>

        {/* External Close Button */}
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm transition-colors flex items-center justify-center w-full group gap-1"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            Pencereyi Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
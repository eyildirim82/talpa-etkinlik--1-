import React, { useState } from 'react';
import { X, AlertTriangle, User, Lock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { loginWithFormData, signupWithFormData } from '../api/auth.api';
import { Button } from '@/src/components/common/Button';
import { Input } from '@/shared/components/ui';

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
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      <div className="relative z-20 w-full max-w-md">

        {/* Main Card */}
        <div className="bg-ui-surface shadow-2xl rounded-lg overflow-hidden border border-ui-border backdrop-blur-md bg-opacity-95 transform transition-all animate-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <h2 className="text-h2 text-text-primary mb-2">
              {activeTab === 'login' ? 'Hoşgeldiniz' : 'Aramıza Katılın'}
            </h2>
            <p className="text-text-secondary text-sm">
              {activeTab === 'login'
                ? 'Hesabınıza giriş yaparak etkinlikleri takip edin.'
                : 'Kayıt olarak TALPA etkinliklerine erişim sağlayabilirsiniz.'}
            </p>
          </div>

          {/* Form Section */}
          <div className="px-8 pb-8">
            {error && (
              <div className="mb-4 p-3 bg-state-error-bg border border-state-error-border rounded-md flex items-center gap-2 text-state-error-text text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Tab Switcher (Optional, simplified for this layout) */}
              <div className="flex justify-center mb-4 text-xs font-bold tracking-widest uppercase border-b border-ui-border-subtle pb-2 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`transition-colors ${activeTab === 'login' ? 'text-brand-accent' : 'text-text-disabled hover:text-text-secondary'}`}
                >
                  GİRİŞ YAP
                </button>
                <div className="w-px bg-ui-border h-3 self-center" />
                <button
                  type="button"
                  onClick={() => setActiveTab('signup')}
                  className={`transition-colors ${activeTab === 'signup' ? 'text-brand-accent' : 'text-text-disabled hover:text-text-secondary'}`}
                >
                  KAYIT OL
                </button>
              </div>

              {activeTab === 'signup' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                  <Input
                    name="fullName"
                    label="AD SOYAD"
                    placeholder="Ad Soyad"
                    required
                    leftIcon={<User className="w-5 h-5" />}
                  />
                  <Input
                    name="sicilNo"
                    label="SİCİL NO"
                    placeholder="12345"
                    required
                    leftIcon={<User className="w-5 h-5" />}
                  />
                </div>
              )}

              <Input
                id="email"
                name="email"
                type="email"
                label="E-POSTA VEYA KULLANICI ADI"
                placeholder="user@example.com"
                required
                leftIcon={<User className="w-5 h-5" />}
              />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider" htmlFor="password">
                    ŞİFRE
                  </label>
                  {activeTab === 'login' && (
                    <a className="text-xs font-medium text-brand-accent hover:text-brand-accent/80 transition-colors cursor-pointer">
                      Şifremi Unuttum?
                    </a>
                  )}
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-5 h-5" />}
                />
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
            className="text-white/60 hover:text-white text-sm transition-colors flex items-center justify-center w-full group gap-1"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            Pencereyi Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
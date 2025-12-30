import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { login, signup } from '../actions/auth';

interface AuthModalProps {
  onClose: () => void;
}

type Tab = 'login' | 'signup';

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const action = activeTab === 'login' ? login : signup;
      const result = await action(formData);

      if (!result.success) {
        setError(result.message);
      } else {
        onClose();
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15, 23, 41, 0.6)',
      backdropFilter: 'blur(4px)',
      padding: '1rem'
    }}>
      <div className="bg-white w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header / Tabs */}
        <div className="flex border-b border-talpa-border">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-5 text-sm font-bold tracking-wider uppercase transition-colors ${activeTab === 'login'
                ? 'bg-white text-talpa-primary border-b-2 border-talpa-primary'
                : 'bg-gray-50 text-talpa-secondary hover:bg-gray-100'
              }`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-5 text-sm font-bold tracking-wider uppercase transition-colors ${activeTab === 'signup'
                ? 'bg-white text-talpa-primary border-b-2 border-talpa-primary'
                : 'bg-gray-50 text-talpa-secondary hover:bg-gray-100'
              }`}
          >
            Kayıt Ol
          </button>
          <button
            onClick={onClose}
            className="px-5 bg-gray-50 hover:bg-red-50 hover:text-talpa-danger border-l border-talpa-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 p-4 flex items-start gap-3 border-b border-red-100">
            <AlertTriangle className="w-5 h-5 text-talpa-danger shrink-0" />
            <p className="text-sm text-talpa-danger font-medium">{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="p-8 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">

            {activeTab === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-talpa-secondary uppercase tracking-wide mb-1">
                    Ad Soyad
                  </label>
                  <input
                    name="fullName"
                    type="text"
                    required
                    className="w-full h-12 bg-gray-50 border border-gray-300 rounded-none px-4 text-talpa-primary focus:border-talpa-primary focus:ring-0 outline-none transition-all placeholder:text-gray-400"
                    placeholder="Örn: Ahmet Yılmaz"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-talpa-secondary uppercase tracking-wide mb-1">
                    TALPA Sicil No
                  </label>
                  <input
                    name="sicilNo"
                    type="text"
                    required
                    className="w-full h-12 bg-gray-50 border border-gray-300 rounded-none px-4 font-mono text-talpa-primary focus:border-talpa-primary focus:ring-0 outline-none transition-all placeholder:text-gray-400"
                    placeholder="12345"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-talpa-secondary uppercase tracking-wide mb-1">
                E-Posta Adresi
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full h-12 bg-gray-50 border border-gray-300 rounded-none px-4 font-mono text-talpa-primary focus:border-talpa-primary focus:ring-0 outline-none transition-all placeholder:text-gray-400"
                placeholder="kaptan@talpa.org"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-talpa-secondary uppercase tracking-wide mb-1">
                Şifre
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full h-12 bg-gray-50 border border-gray-300 rounded-none px-4 font-mono text-talpa-primary focus:border-talpa-primary focus:ring-0 outline-none transition-all placeholder:text-gray-400"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-talpa-primary text-white h-14 font-mono font-bold uppercase tracking-wider hover:bg-slate-800 disabled:opacity-70 disabled:cursor-wait transition-all flex items-center justify-center gap-2"
              >
                {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />}
                {activeTab === 'login' ? 'GİRİŞ YAP' : 'HESAP OLUŞTUR'}
              </button>
            </div>

            <p className="text-xs text-center text-talpa-secondary">
              {activeTab === 'login'
                ? 'TALPA Etkinlik platformuna hoş geldiniz.'
                : 'Kayıt olarak TALPA etkinliklerine erişim sağlayabilirsiniz.'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};
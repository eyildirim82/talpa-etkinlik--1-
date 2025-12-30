import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { X } from 'lucide-react';

interface LoginModalProps {
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  const { isLoading } = useApp();
  const [memberId, setMemberId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return;
    
    // Login functionality has been moved to AuthModal using Server Actions.
    // This component is kept for UI reference or future implementation.
    console.warn('Member ID login is deprecated. Please use AuthModal.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-talpa-primary/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 pb-0 flex justify-between items-center">
          <h2 className="text-lg font-bold text-talpa-primary">Üye Girişi</h2>
          <button onClick={onClose} className="p-2 hover:bg-talpa-bg rounded-full transition-colors text-talpa-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 pt-6">
          <p className="text-sm text-talpa-secondary mb-6">
            Lütfen devam etmek için TALPA üye numaranızı veya sicil numaranızı giriniz.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-talpa-primary mb-2">
                Üye Numarası / Sicil No
              </label>
              <input 
                type="text" 
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="Örn: 19842"
                className="w-full h-12 border border-talpa-border rounded-lg px-4 text-base focus:border-talpa-accent focus:ring-1 focus:ring-talpa-accent outline-none transition-all placeholder:text-gray-300"
                autoFocus
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading || !memberId}
              className="w-full bg-talpa-accent text-white h-12 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
            >
              {isLoading ? 'Kontrol Ediliyor...' : 'Devam Et'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
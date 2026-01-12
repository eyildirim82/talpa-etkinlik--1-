import React, { useState } from 'react';
import { Input } from '@/shared/components/ui/Input';

interface LoginFormProps {
    onLogin: (email: string, password: string, isSignup: boolean, name?: string, sicil?: string) => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin, isLoading, error }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [signupName, setSignupName] = useState('');
    const [signupSicil, setSignupSicil] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onLogin(loginEmail, loginPassword, isSignup, signupName, signupSicil);
    };

    return (
        <div className="p-5">
            {/* Tab Switcher */}
            <div className="flex gap-4 mb-4 border-b border-ui-border-subtle pb-3">
                <button
                    onClick={() => setIsSignup(false)}
                    className={`text-caption font-semibold uppercase tracking-wider transition-colors ${
                        !isSignup ? 'text-brand-accent' : 'text-text-secondary'
                    }`}
                >
                    Giriş Yap
                </button>
                <button
                    onClick={() => setIsSignup(true)}
                    className={`text-caption font-semibold uppercase tracking-wider transition-colors ${
                        isSignup ? 'text-brand-accent' : 'text-text-secondary'
                    }`}
                >
                    Kayıt Ol
                </button>
            </div>

            {error && (
                <div className={`p-2 mb-3 rounded text-caption ${
                    error.includes('başarılı') 
                        ? 'bg-state-success/10 text-state-success border border-state-success/20' 
                        : 'bg-state-error/10 text-state-error border border-state-error/20'
                }`}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
                {isSignup && (
                    <>
                        <Input
                            type="text"
                            placeholder="Ad Soyad"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            required
                            size="sm"
                        />
                        <Input
                            type="text"
                            placeholder="Sicil No"
                            value={signupSicil}
                            onChange={(e) => setSignupSicil(e.target.value)}
                            required
                            size="sm"
                        />
                    </>
                )}
                <Input
                    type="email"
                    placeholder="E-posta"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    size="sm"
                />
                <Input
                    type="password"
                    placeholder="Şifre"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    minLength={6}
                    size="sm"
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 bg-brand-primary text-white text-caption font-bold uppercase tracking-wider rounded-sm hover:bg-brand-primary/90 transition-colors disabled:opacity-70 disabled:cursor-wait"
                >
                    {isLoading ? 'İşleniyor...' : (isSignup ? 'Kayıt Ol' : 'Giriş Yap')}
                </button>
            </form>
        </div>
    );
};

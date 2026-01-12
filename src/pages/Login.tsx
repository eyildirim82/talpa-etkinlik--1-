
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBrowserClient } from '@/shared/infrastructure/supabase';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const supabase = createBrowserClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            if (data.user) {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Giriş yapılırken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-ui-background flex items-center justify-center p-4">
            <div className="bg-ui-surface w-full max-w-md rounded-xl shadow-lg border border-ui-border overflow-hidden">
                {/* Header */}
                <div className="bg-brand-accent px-8 py-6 text-center">
                    <div className="flex justify-center mb-3">
                        <div className="p-3 bg-white/10 rounded-full text-white">
                            <Lock className="w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Kaptan Pilot Girişi</h2>
                    <p className="text-blue-100 text-sm mt-1">TALPA Etkinlik Yönetim Sistemi</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-state-error-bg border border-state-error-border rounded-lg flex items-start gap-3 text-state-error-text text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <Input
                            type="email"
                            label="E-posta Adresi"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="ornek@talpa.org"
                            leftIcon={<Mail />}
                        />

                        <Input
                            type="password"
                            label="Şifre"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            leftIcon={<Lock />}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-brand-accent hover:bg-brand-accent/90 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Giriş Yapılıyor...</span>
                                </>
                            ) : (
                                <>
                                    <span>Giriş Yap</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <a href="#" className="text-sm text-text-secondary hover:text-brand-accent transition-colors underline decoration-dotted">
                            Şifremi Unuttum
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

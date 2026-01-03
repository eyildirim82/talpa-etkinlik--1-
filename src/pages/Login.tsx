
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBrowserClient } from '@/shared/infrastructure/supabase';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

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
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="bg-talpa-primary px-8 py-6 text-center">
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
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 text-red-600 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta Adresi</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-talpa-primary/20 focus:border-talpa-primary transition-colors text-sm"
                                    placeholder="ornek@talpa.org"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-talpa-primary/20 focus:border-talpa-primary transition-colors text-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-talpa-primary hover:bg-talpa-accent text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-[0.98]"
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
                        <a href="#" className="text-sm text-talpa-secondary hover:text-talpa-primary transition-colors underline decoration-dotted">
                            Şifremi Unuttum
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

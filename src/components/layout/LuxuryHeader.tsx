import React, { useEffect, useState } from 'react';
import { User } from '@/types';
import { Settings } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input';

// Luxury Navigation Header with Dropdown - LUXE Design
export const LuxuryHeader = ({ user, onAuthClick, onAdminClick }: { user: User | null; onAuthClick: () => void; onAdminClick?: () => void }) => {
    const isAdmin = user?.is_admin === true;
    const [showDropdown, setShowDropdown] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isSignup, setIsSignup] = useState(false);
    const [signupName, setSignupName] = useState('');
    const [signupSicil, setSignupSicil] = useState('');

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.account-dropdown-container')) {
                setShowDropdown(false);
            }
        };
        if (showDropdown) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showDropdown]);

    const handleAccountClick = () => {
        setShowDropdown(!showDropdown);
        setLoginError(null);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError(null);

        try {
            const { createBrowserClient } = await import('@/shared/infrastructure/supabase');
            const supabase = createBrowserClient();

            if (isSignup) {
                const { error } = await supabase.auth.signUp({
                    email: loginEmail,
                    password: loginPassword,
                    options: {
                        data: {
                            full_name: signupName,
                            talpa_sicil_no: signupSicil,
                        }
                    }
                });
                if (error) throw error;
                setLoginError('Kayıt başarılı! Lütfen e-postanızı kontrol edin.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: loginEmail,
                    password: loginPassword,
                });
                if (error) throw error;
                window.location.reload();
            }
        } catch (err: any) {
            setLoginError(err.message || 'Bir hata oluştu.');
        } finally {
            setLoginLoading(false);
        }
    };

    return (
        <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b border-ui-border-subtle bg-ui-surface/95 backdrop-blur-lg">
            <div className="max-w-[1440px] mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
                {/* Left: Logo */}
                <div className="flex items-center gap-2">
                    <img
                        src="/Logo.png"
                        alt="TALPA"
                        className="h-8 w-auto"
                    />
                </div>

                {/* Center: Navigation */}
                <nav className="hidden md:flex items-center gap-10">
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="text-text-secondary hover:text-brand-primary text-caption font-medium uppercase tracking-widest transition-colors"
                    >
                        Etkinlikler
                    </button>
                    <button
                        onClick={() => alert('Hizmetler yakında...')}
                        className="text-text-secondary hover:text-brand-primary text-caption font-medium uppercase tracking-widest transition-colors"
                    >
                        Hizmetler
                    </button>
                    <button
                        onClick={() => alert('Üyelik bilgileri için lütfen iletişime geçiniz.')}
                        className="text-text-secondary hover:text-brand-primary text-caption font-medium uppercase tracking-widest transition-colors"
                    >
                        Üyelik
                    </button>
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-5">
                    <button className="text-text-secondary hover:text-brand-primary transition-colors">
                        <span className="material-symbols-outlined text-[20px]">search</span>
                    </button>
                    <button className="text-text-secondary hover:text-brand-primary transition-colors relative">
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                        <span className="absolute top-0 right-0 size-1.5 bg-brand-accent rounded-full"></span>
                    </button>
                    
                    {/* Account Dropdown */}
                    <div className="account-dropdown-container relative">
                        <button
                            onClick={handleAccountClick}
                            className="size-8 rounded-full bg-cover bg-center ring-2 ring-ui-border-subtle cursor-pointer hover:ring-ui-border transition-all bg-ui-background [background-image:var(--avatar-bg-image)]"
                            style={{
                                '--avatar-bg-image': user?.avatar_url 
                                    ? `url('${user.avatar_url}')` 
                                    : 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBcZnoS3yNTBh7mxo8vZLFRifJVHL-RTn85cOhRuc310Soqqul0WHkSt7aSLXfuKcsDHZ3BSRYHUcC4ZnfVFT8l7zeQkLd6RcjW-MsCdVQbE56AmC4VfBsRWhh6qCFsDZ52wLXcyfT9jRD64X-G-7v1dR3ll1QT-fuz2tspSseFT6iCZY-AIUUyZ77UZccp1gMH8szRjDu1s6mj6ALerSKiIICRgx8pqQXtdi6WnVRBB-txnOfq4J3PC5DUXXFiHvCgtJrCPs8hdug")'
                            } as React.CSSProperties & { '--avatar-bg-image': string }}
                        />

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <div className="absolute top-full right-0 mt-3 bg-ui-surface border border-ui-border rounded-sm min-w-[280px] shadow-lg z-50 overflow-hidden">
                                {user ? (
                                    /* Logged In - Account Menu */
                                    <>
                                        <div className="px-4 py-3 border-b border-ui-border-subtle bg-ui-background">
                                            <div className="text-text-primary text-body-sm font-semibold">
                                                {user.full_name}
                                            </div>
                                            <div className="text-text-secondary text-caption mt-1">
                                                Sicil: {user.talpa_sicil_no || 'N/A'}
                                            </div>
                                        </div>
                                        <div className="py-2">
                                            <button
                                                onClick={() => { setShowDropdown(false); alert('Profil sayfası yakında...'); }}
                                                className="block w-full px-4 py-2 text-left text-body-sm text-text-primary hover:bg-ui-background transition-colors"
                                            >
                                                👤 Profilim
                                            </button>
                                            <button
                                                onClick={() => { setShowDropdown(false); alert('Biletlerim sayfası yakında...'); }}
                                                className="block w-full px-4 py-2 text-left text-body-sm text-text-primary hover:bg-ui-background transition-colors"
                                            >
                                                🎫 Biletlerim
                                            </button>
                                            {isAdmin && onAdminClick && (
                                                <button
                                                    onClick={() => { setShowDropdown(false); onAdminClick(); }}
                                                    className="block w-full px-4 py-2 text-left text-body-sm text-text-primary hover:bg-ui-background transition-colors"
                                                >
                                                    ⚙️ Admin
                                                </button>
                                            )}
                                            <div className="h-px bg-ui-border-subtle my-2" />
                                            <button
                                                onClick={async () => {
                                                    setShowDropdown(false);
                                                    const { createBrowserClient } = await import('@/shared/infrastructure/supabase');
                                                    const supabase = createBrowserClient();
                                                    await supabase.auth.signOut();
                                                    window.location.reload();
                                                }}
                                                className="block w-full px-4 py-2 text-left text-sm text-brand-accent hover:bg-state-error/10 transition-colors"
                                            >
                                                🚪 Çıkış Yap
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    /* Not Logged In - Login Form */
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

                                        {loginError && (
                                            <div className={`p-2 mb-3 rounded text-caption ${
                                                loginError.includes('başarılı') 
                                                    ? 'bg-green-50 text-green-700 border border-green-200' 
                                                    : 'bg-red-50 text-red-700 border border-red-200'
                                            }`}>
                                                {loginError}
                                            </div>
                                        )}

                                        <form onSubmit={handleLogin} className="space-y-3">
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
                                                disabled={loginLoading}
                                                className="w-full py-2 bg-brand-primary text-white text-caption font-bold uppercase tracking-wider rounded-sm hover:bg-brand-primary/90 transition-colors disabled:opacity-70 disabled:cursor-wait"
                                            >
                                                {loginLoading ? 'İşleniyor...' : (isSignup ? 'Kayıt Ol' : 'Giriş Yap')}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

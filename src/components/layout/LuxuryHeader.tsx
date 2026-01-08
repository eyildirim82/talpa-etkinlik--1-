import React, { useEffect, useState } from 'react';
import { User } from '@/types';
import { Settings } from 'lucide-react';

// Luxury Navigation Header with Dropdown
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
        <header style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'rgba(10, 25, 41, 0.95)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(229, 229, 229, 0.1)',
            padding: '0.75rem 3rem'
        }}>
            <div style={{
                maxWidth: '1600px',
                margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: '2rem'
            }}>
                {/* Left Navigation */}
                <nav style={{
                    display: 'flex',
                    gap: '2rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                }}>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        style={{
                            color: '#E5E5E5',
                            textDecoration: 'none',
                            transition: 'color 0.3s',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = '#D4AF37'}
                        onMouseLeave={(e) => e.currentTarget.style.color = '#E5E5E5'}
                    >
                        Etkinlikler
                    </button>

                    {/* Account Button with Dropdown */}
                    <div className="account-dropdown-container" style={{ position: 'relative' }}>
                        <button
                            onClick={handleAccountClick}
                            style={{
                                color: user ? '#D4AF37' : '#E5E5E5',
                                textDecoration: 'none',
                                transition: 'color 0.3s',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#D4AF37'}
                            onMouseLeave={(e) => e.currentTarget.style.color = user ? '#D4AF37' : '#E5E5E5'}
                        >
                            {user ? 'Hesabım' : 'Giriş Yap'}
                            <span style={{
                                fontSize: '0.6rem',
                                transition: 'transform 0.2s',
                                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}>▼</span>
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                marginTop: '0.75rem',
                                background: 'rgba(10, 25, 41, 0.98)',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                borderRadius: '4px',
                                minWidth: user ? '200px' : '280px',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
                                zIndex: 1001,
                                overflow: 'hidden'
                            }}>
                                {user ? (
                                    /* Logged In - Account Menu */
                                    <>
                                        <div style={{
                                            padding: '1rem',
                                            borderBottom: '1px solid rgba(229, 229, 229, 0.1)',
                                            background: 'rgba(212, 175, 55, 0.05)'
                                        }}>
                                            <div style={{ color: '#D4AF37', fontSize: '0.875rem', fontWeight: '600' }}>
                                                {user.full_name}
                                            </div>
                                            <div style={{ color: '#888', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                                                Sicil: {user.talpa_sicil_no || 'N/A'}
                                            </div>
                                        </div>
                                        <div style={{ padding: '0.5rem 0' }}>
                                            <button
                                                onClick={() => { setShowDropdown(false); alert('Profil sayfası yakında...'); }}
                                                style={{ display: 'block', width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#E5E5E5', fontSize: '0.75rem', textAlign: 'left', cursor: 'pointer' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                            >👤 Profilim</button>
                                            <button
                                                onClick={() => { setShowDropdown(false); alert('Biletlerim sayfası yakında...'); }}
                                                style={{ display: 'block', width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#E5E5E5', fontSize: '0.75rem', textAlign: 'left', cursor: 'pointer' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                            >🎫 Biletlerim</button>
                                            <div style={{ height: '1px', background: 'rgba(229,229,229,0.1)', margin: '0.5rem 0' }} />
                                            <button
                                                onClick={async () => {
                                                    setShowDropdown(false);
                                                    const { createBrowserClient } = await import('@/shared/infrastructure/supabase');
                                                    const supabase = createBrowserClient();
                                                    await supabase.auth.signOut();
                                                    window.location.reload();
                                                }}
                                                style={{ display: 'block', width: '100%', padding: '0.75rem 1rem', background: 'none', border: 'none', color: '#C41E3A', fontSize: '0.75rem', textAlign: 'left', cursor: 'pointer' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(196, 30, 58, 0.1)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                            >🚪 Çıkış Yap</button>
                                        </div>
                                    </>
                                ) : (
                                    /* Not Logged In - Login Form */
                                    <div style={{ padding: '1.25rem' }}>
                                        {/* Tab Switcher */}
                                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(229,229,229,0.1)', paddingBottom: '0.75rem' }}>
                                            <button
                                                onClick={() => setIsSignup(false)}
                                                style={{ background: 'none', border: 'none', color: isSignup ? '#888' : '#D4AF37', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                            >Giriş Yap</button>
                                            <button
                                                onClick={() => setIsSignup(true)}
                                                style={{ background: 'none', border: 'none', color: isSignup ? '#D4AF37' : '#888', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                            >Kayıt Ol</button>
                                        </div>

                                        {loginError && (
                                            <div style={{ padding: '0.5rem', marginBottom: '0.75rem', background: loginError.includes('başarılı') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${loginError.includes('başarılı') ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '4px', color: loginError.includes('başarılı') ? '#22c55e' : '#ef4444', fontSize: '0.7rem' }}>
                                                {loginError}
                                            </div>
                                        )}

                                        <form onSubmit={handleLogin}>
                                            {isSignup && (
                                                <>
                                                    <input
                                                        type="text"
                                                        placeholder="Ad Soyad"
                                                        value={signupName}
                                                        onChange={(e) => setSignupName(e.target.value)}
                                                        required
                                                        style={{ width: '100%', padding: '0.625rem', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(229,229,229,0.2)', borderRadius: '4px', color: '#E5E5E5', fontSize: '0.8rem', outline: 'none' }}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Sicil No"
                                                        value={signupSicil}
                                                        onChange={(e) => setSignupSicil(e.target.value)}
                                                        required
                                                        style={{ width: '100%', padding: '0.625rem', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(229,229,229,0.2)', borderRadius: '4px', color: '#E5E5E5', fontSize: '0.8rem', outline: 'none' }}
                                                    />
                                                </>
                                            )}
                                            <input
                                                type="email"
                                                placeholder="E-posta"
                                                value={loginEmail}
                                                onChange={(e) => setLoginEmail(e.target.value)}
                                                required
                                                style={{ width: '100%', padding: '0.625rem', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(229,229,229,0.2)', borderRadius: '4px', color: '#E5E5E5', fontSize: '0.8rem', outline: 'none' }}
                                            />
                                            <input
                                                type="password"
                                                placeholder="Şifre"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                required
                                                minLength={6}
                                                style={{ width: '100%', padding: '0.625rem', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(229,229,229,0.2)', borderRadius: '4px', color: '#E5E5E5', fontSize: '0.8rem', outline: 'none' }}
                                            />
                                            <button
                                                type="submit"
                                                disabled={loginLoading}
                                                style={{ width: '100%', padding: '0.75rem', background: '#D4AF37', color: '#0A1929', border: 'none', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: loginLoading ? 'wait' : 'pointer', opacity: loginLoading ? 0.7 : 1 }}
                                            >
                                                {loginLoading ? 'İşleniyor...' : (isSignup ? 'Kayıt Ol' : 'Giriş Yap')}
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </nav>

                {/* Centered Logo */}
                <div style={{ textAlign: 'center' }}>
                    <img
                        src="/Logo.png"
                        alt="TALPA"
                        style={{ height: '50px', width: 'auto' }}
                    />
                </div>

                {/* Right Navigation */}
                <nav style={{
                    display: 'flex',
                    gap: '2rem',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                }}>
                    {user && (
                        <>
                            {isAdmin && onAdminClick && (
                                <button
                                    onClick={onAdminClick}
                                    style={{
                                        background: '#C41E3A',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        padding: '0.625rem 1.5rem',
                                        borderRadius: '2px',
                                        fontSize: '0.7rem',
                                        fontWeight: '600',
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        cursor: 'pointer',
                                        transition: 'background 0.3s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#A01729'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#C41E3A'}
                                >
                                    <Settings style={{ width: '14px', height: '14px' }} />
                                    Admin
                                </button>
                            )}
                            <span style={{ color: '#D4AF37' }}>{user.full_name}</span>
                        </>
                    )}
                    <button
                        onClick={() => alert('İletişim bilgileri için: info@talpa.org')}
                        style={{
                            background: '#C41E3A',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '0.75rem 2rem',
                            borderRadius: '2px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            transition: 'background 0.3s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#A01729'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#C41E3A'}
                    >
                        İletişim
                    </button>
                </nav>
            </div>
        </header>
    );
};

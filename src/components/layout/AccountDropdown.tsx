import React from 'react';
import { User } from '@/types';
import { LoginForm } from './LoginForm';

interface AccountDropdownProps {
    user: User | null;
    isAdmin: boolean;
    showDropdown: boolean;
    loginEmail: string;
    loginPassword: string;
    loginLoading: boolean;
    loginError: string | null;
    isSignup: boolean;
    signupName: string;
    signupSicil: string;
    onLogin: (e: React.FormEvent) => Promise<void>;
    onSignupChange: (value: boolean) => void;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onNameChange: (value: string) => void;
    onSicilChange: (value: string) => void;
    onClose: () => void;
    onAdminClick?: () => void;
    onLogout: () => Promise<void>;
}

export const AccountDropdown: React.FC<AccountDropdownProps> = ({
    user,
    isAdmin,
    showDropdown,
    loginEmail,
    loginPassword,
    loginLoading,
    loginError,
    isSignup,
    signupName,
    signupSicil,
    onLogin,
    onSignupChange,
    onEmailChange,
    onPasswordChange,
    onNameChange,
    onSicilChange,
    onClose,
    onAdminClick,
    onLogout,
}) => {
    if (!showDropdown) return null;

    return (
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
                            onClick={() => { onClose(); alert('Profil sayfası yakında...'); }}
                            className="block w-full px-4 py-2 text-left text-body-sm text-text-primary hover:bg-ui-background transition-colors"
                        >
                            👤 Profilim
                        </button>
                        <button
                            onClick={() => { onClose(); alert('Biletlerim sayfası yakında...'); }}
                            className="block w-full px-4 py-2 text-left text-body-sm text-text-primary hover:bg-ui-background transition-colors"
                        >
                            🎫 Biletlerim
                        </button>
                        {isAdmin && onAdminClick && (
                            <button
                                onClick={() => { onClose(); onAdminClick(); }}
                                className="block w-full px-4 py-2 text-left text-body-sm text-text-primary hover:bg-ui-background transition-colors"
                            >
                                ⚙️ Admin
                            </button>
                        )}
                        <div className="h-px bg-ui-border-subtle my-2" />
                        <button
                            onClick={async () => {
                                onClose();
                                await onLogout();
                            }}
                            className="block w-full px-4 py-2 text-left text-body-sm text-brand-accent hover:bg-state-error/10 transition-colors"
                        >
                            🚪 Çıkış Yap
                        </button>
                    </div>
                </>
            ) : (
                /* Not Logged In - Login Form */
                <LoginForm
                    onLogin={async (email, password, signup, name, sicil) => {
                        // This will be handled by the parent component
                        // For now, we'll use the existing form structure
                    }}
                    isLoading={loginLoading}
                    error={loginError}
                />
            )}
        </div>
    );
};

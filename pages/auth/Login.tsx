
import React, { useState, useEffect } from 'react';
// Fix: Use inline type import for SubmitHandler
import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
// Fix: Import InferType from yup
import type { InferType } from 'yup';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Checkbox from '../../components/ui/Checkbox';
import { useAuthStore } from '../../store/authStore';
import { useBrandingStore } from '../../store/brandingStore'; // Add branding store import
import { getThemeColors } from '../../utils/themeUtils';
import { useDeviceFingerprint } from '../../hooks/useDeviceFingerprint';
import type { User } from '../../types';
import { Mail, Lock, AlertTriangle, Check } from 'lucide-react';
import { authService } from '../../services/authService';
import { api } from '../../services/api';


const emailValidationSchema = yup.object({
    email: yup.string().email('Must be a valid email').required('Email is required'),
    password: yup.string().required('Password is required'),
    rememberMe: yup.boolean().optional(),
}).defined();
// Fix: Use imported InferType
type EmailFormInputs = InferType<typeof emailValidationSchema>;


const getHomeRoute = (user: User) => {
    // If the user is unverified, send them to the pending approval page.
    if (user.role === 'unverified') {
        return "/pending-approval";
    }
    // Otherwise, all users land on their profile page.
    return "/profile";
};


const Login: React.FC = () => {
    const { user, loginWithEmail, loginWithGoogle, error, setError, loading, setLoginAnimationPending, isLoginAnimationPending } = useAuthStore();
    const { colorScheme } = useBrandingStore(); // Get color scheme
    const themeColors = getThemeColors(colorScheme);
    const navigate = useNavigate();
    const location = useLocation();

    // Device fingerprinting for tracking device changes (no security blocking)
    const { deviceInfo, isNewDevice, previousDevice } = useDeviceFingerprint();
    const [deviceAlertSent, setDeviceAlertSent] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);


    useEffect(() => {
        setError(null);

        // Check for email confirmation errors in the URL hash
        const hashParams = new URLSearchParams(location.hash.substring(1));
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');

        if (errorCode === 'otp_expired' && errorDescription) {
            setError("Email confirmation link has expired or is invalid. Please try signing up again or request a new confirmation email.");
            // Clean the URL so the error doesn't persist on refresh
            navigate('/auth/login', { replace: true });
        }
    }, [setError, location, navigate]);

    // Monitor device changes and send alerts (for all users, after login)
    useEffect(() => {
        if (user && isNewDevice && previousDevice && !deviceAlertSent) {
            api.sendDeviceChangeAlert(
                user.id,
                user.name,
                previousDevice.deviceName,
                deviceInfo?.deviceName || 'Unknown Device'
            ).catch(err => console.error('Failed to send device change alert:', err));

            setDeviceAlertSent(true);
        }
    }, [user, isNewDevice, previousDevice, deviceAlertSent, deviceInfo]);

    // This effect will run when the `user` state changes in the store.
    useEffect(() => {
        if (user && !isLoginAnimationPending) {
            navigate(getHomeRoute(user), { replace: true });
        }
    }, [user, navigate, isLoginAnimationPending]);


    // Email form
    const { register: registerEmail, handleSubmit: handleEmailSubmit, setValue, formState: { errors: emailErrors } } = useForm<EmailFormInputs>({
        // FIX: Cast resolver to resolve type incompatibility between yup and react-hook-form.
        resolver: yupResolver(emailValidationSchema) as unknown as Resolver<EmailFormInputs>,
    });

    useEffect(() => {
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setValue('email', rememberedEmail);
            setValue('rememberMe', true);
        }

        // Pre-check "Remember Me" on mobile devices
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            setValue('rememberMe', true);
        }
    }, [setValue]);

    const onEmailSubmit: SubmitHandler<EmailFormInputs> = async (data) => {
        setLoginAnimationPending(true);

        // Force "Remember Me" on mobile devices to ensure persistent login
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const shouldRemember = isMobile ? true : (data.rememberMe || false);

        const result = await loginWithEmail(data.email, data.password, shouldRemember);

        if (result.error) {
            setLoginAnimationPending(false);
        } else {
            setIsSuccess(true);
            setTimeout(() => {
                setLoginAnimationPending(false);
            }, 1500);
        }
    };

    const handleGoogleLogin = async () => {
        await loginWithGoogle();
    };

    const isFormDisabled = loading || isSuccess;

    return (
        <>
            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-3">
                <fieldset disabled={isFormDisabled} className="space-y-3">
                    <div className="relative group">
                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors pointer-events-none`} style={{ color: themeColors.isDark ? '#9ca3af' : '#6b7280' }} />
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="Email"
                            registration={registerEmail('email')}
                            error={emailErrors.email?.message}
                            className="!pl-12 !py-3 !rounded-xl transition-all"
                            style={{
                                backgroundColor: themeColors.isDark ? '#1f2937' : '#f9fafb',
                                color: themeColors.isDark ? '#ffffff' : '#111827',
                                borderColor: themeColors.isDark ? '#374151' : '#e5e7eb'
                            }}
                        />
                    </div>
                    <div className="relative group">
                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors pointer-events-none`} style={{ color: themeColors.isDark ? '#9ca3af' : '#6b7280' }} />
                        <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Password"
                            registration={registerEmail('password')}
                            error={emailErrors.password?.message}
                            className="!pl-12 !py-3 !rounded-xl transition-all"
                            style={{
                                backgroundColor: themeColors.isDark ? '#1f2937' : '#f9fafb',
                                color: themeColors.isDark ? '#ffffff' : '#111827',
                                borderColor: themeColors.isDark ? '#374151' : '#e5e7eb'
                            }}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3">
                        <div className="flex-shrink-0 login-checkbox-container">
                            <Checkbox
                                id="rememberMe"
                                label="Remember me"
                                labelClassName="font-medium"
                                // Spread the props returned by react-hook-form's register function
                                {...registerEmail('rememberMe')}
                                inputClassName={`text-blue-600 focus:ring-blue-600 border-white/20 rounded bg-black/40`}
                            />
                            <style dangerouslySetInnerHTML={{__html: `
                                .login-checkbox-container label {
                                    color: #ffffff !important;
                                    opacity: 1 !important;
                                    pointer-events: auto !important;
                                    position: relative !important;
                                    z-index: 10 !important;
                                }
                            `}} />
                        </div>
                        <Link
                            to="/auth/forgot-password"
                            className={`text-sm font-medium hover:opacity-70 transition-colors auth-link ${isFormDisabled ? 'pointer-events-none opacity-50' : ''}`}
                            aria-disabled={isFormDisabled}
                            onClick={(e) => { if (isFormDisabled) e.preventDefault(); }}
                            style={{ color: themeColors.primary }}
                        >
                            Forgot your password?
                        </Link>
                    </div>
                </fieldset>

                <div className="min-h-[24px] flex items-center justify-center">
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-400 text-center p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                </div>

                <Button
                    type="submit"
                    className={`w-full !font-bold !py-3 !rounded-full shadow-lg transition-all transform hover:scale-[1.02] signin-btn !text-white`}
                    style={{
                        backgroundColor: themeColors.activeItemBg,
                        borderColor: themeColors.sidebarBorder,
                    }}
                    isLoading={loading && !isSuccess}
                    size="lg"
                    disabled={isFormDisabled && !isSuccess}
                >
                    {isSuccess ? <Check className="w-6 h-6 animate-bounce" /> : "Sign In"}
                </Button>
            </form>

            <div className="flex items-center my-6">
                <div className="flex-1 border-t" style={{ borderColor: themeColors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}></div>
                <span className="px-4 text-sm font-medium" style={{ color: themeColors.isDark ? '#ffffff' : '#6b7280' }}>OR</span>
                <div className="flex-1 border-t" style={{ borderColor: themeColors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}></div>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 hover:bg-gray-100 font-bold py-3 rounded-full transition-all transform hover:scale-[1.02] shadow-lg google-btn"
                disabled={isFormDisabled}
            >
                <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.487-11.181-8.264l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.508,44,30.021,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                Sign in with Google
            </button>

            <div className="text-center mt-4">
                <p className="text-sm" style={{ color: themeColors.isDark ? '#ffffff' : '#6b7280' }}>
                    Don't have an account?{' '}
                    <Link to="/auth/signup" className="font-medium transition-opacity hover:opacity-80" style={{ color: themeColors.primary }}>Sign Up</Link>
                </p>
            </div>
        </>
    );
};
export default Login;

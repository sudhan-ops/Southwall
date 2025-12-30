import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Apple, ArrowRight } from 'lucide-react';
import { IOSInstallModal } from './IOSInstallModal';

export const InstallAppPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
    const [isAppInstalled, setIsAppInstalled] = useState(false);
    const [showFab, setShowFab] = useState(false);

    useEffect(() => {
        // Detect Platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setPlatform('ios');
        } else if (/android/.test(userAgent)) {
            setPlatform('android');
        } else {
            setPlatform('desktop');
        }

        // Check if already installed
        const checkInstalled = () => {
            if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
                setIsAppInstalled(true);
            }
        };
        checkInstalled();
        window.matchMedia('(display-mode: standalone)').addEventListener('change', checkInstalled);

        // Handle beforeinstallprompt
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);

            const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
            if (!isDismissed) {
                setIsVisible(true);
            } else {
                // If dismissed, still show the FAB
                setShowFab(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        // iOS Logic: Always show prompt initially if not installed and not dismissed
        // If dismissed, show FAB
        if (/iphone|ipad|ipod/.test(userAgent) && !isAppInstalled) {
            const isDismissed = sessionStorage.getItem('pwa-prompt-dismissed');
            if (!isDismissed) {
                setIsVisible(true);
            } else {
                setShowFab(true);
            }
        }

        // Desktop/Android Fallback: If no event fires (e.g. heuristics), show FAB after 2s if not installed
        // This ensures the option is available even if Chrome decides not to "prompt" automatically
        const fallbackTimer = setTimeout(() => {
            if (!isAppInstalled && !isVisible) {
                setShowFab(true);
            }
        }, 2000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkInstalled);
            clearTimeout(fallbackTimer);
        };
    }, [isAppInstalled, isVisible]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // For Android/Desktop without prompt, we can't do much programmatically 
            // but show instructions or hope they trigger browser menu
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
            setShowFab(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        setShowFab(true); // Show FAB when main prompt is dismissed
        sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    };

    const handleFabClick = () => {
        setIsVisible(true);
        setShowFab(false);
    };

    if (isAppInstalled) return null;

    if (!isVisible && !showFab && !isIOSModalOpen) return null;

    return (
        <>
            {/* Floating Action Button (Fallback when prompt is hidden) */}
            {showFab && !isVisible && !isIOSModalOpen && (
                <button
                    onClick={handleFabClick}
                    className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 active:scale-95 animate-bounce-subtle"
                    title="Install App"
                >
                    <Download size={24} />
                </button>
            )}

            {/* Main Prompt Card */}
            {isVisible && (
                <div className="fixed bottom-24 left-4 right-4 z-50 animate-slide-up md:max-w-lg md:left-auto md:right-6">
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 dark:border-slate-800 p-6 overflow-hidden relative group">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500"></div>

                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-50 dark:bg-slate-800 rounded-full"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-shrink-0 w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                <Download size={28} />
                            </div>

                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">Download Southwall</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Choose your platform for a premium experience</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {/* Web / Desktop Button */}
                            <button
                                onClick={handleInstallClick}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${platform === 'desktop'
                                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                                        : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300">
                                        <Monitor size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Web / Desktop</p>
                                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Available Now</p>
                                    </div>
                                </div>
                                <ArrowRight size={18} className="text-slate-400" />
                            </button>

                            {/* Android Button */}
                            <button
                                onClick={handleInstallClick}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${platform === 'android'
                                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                                        : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-opacity-80">
                                        <Smartphone size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Android App</p>
                                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Direct Download</p>
                                    </div>
                                </div>
                                <ArrowRight size={18} className="text-slate-400" />
                            </button>

                            {/* iOS Button */}
                            <button
                                onClick={() => setIsIOSModalOpen(true)}
                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${platform === 'ios'
                                        ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                                        : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-900 dark:text-white">
                                        <Apple size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">iPhone / iOS</p>
                                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Install Guide</p>
                                    </div>
                                </div>
                                <ArrowRight size={18} className="text-slate-400" />
                            </button>
                        </div>

                        <p className="mt-5 text-[10px] text-center text-slate-400 font-medium uppercase tracking-[0.2em]">
                            Fast • Secure • Offline Ready
                        </p>
                    </div>
                </div>
            )}

            <IOSInstallModal
                isOpen={isIOSModalOpen}
                onClose={() => setIsIOSModalOpen(false)}
            />
        </>
    );
};

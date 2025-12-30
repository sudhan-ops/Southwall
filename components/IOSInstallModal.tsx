import React from 'react';
import { X, Share, PlusSquare, ArrowBigDown } from 'lucide-react';

interface IOSInstallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const IOSInstallModal: React.FC<IOSInstallModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-fade-in-scale">
                <div className="relative p-6 text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 rounded-full"
                    >
                        <X size={20} />
                    </button>

                    <div className="mt-4 mb-6 inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl text-emerald-600 dark:text-emerald-400 shadow-inner">
                        <img src="/icons/icon-192x192.png" alt="App Icon" className="w-16 h-16 rounded-2xl shadow-lg" />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Install on iOS</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm px-4">
                        Follow these simple steps to add Southwall to your home screen.
                    </p>

                    <div className="mt-8 space-y-6 text-left px-2">
                        <div className="flex items-center gap-4 group">
                            <div className="flex-shrink-0 w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                1
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                    Tap the <Share size={18} className="text-blue-500" /> Share button
                                </p>
                                <p className="text-xs text-slate-400">Found in the bottom bar of Safari</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                            <div className="flex-shrink-0 w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                2
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                    Select <PlusSquare size={18} className="text-emerald-500" /> Add to Home Screen
                                </p>
                                <p className="text-xs text-slate-400">Scroll down in the share menu</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                            <div className="flex-shrink-0 w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold group-hover:bg-teal-500 group-hover:text-white transition-colors">
                                3
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                    Tap <span className="font-bold text-teal-600 dark:text-teal-400">Add</span> at the top right
                                </p>
                                <p className="text-xs text-slate-400">The app will appear on your home screen</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="mt-10 w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold py-4 rounded-2xl shadow-xl hover:opacity-90 transition-all active:scale-95"
                    >
                        Got it!
                    </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 py-4 flex items-center justify-center gap-2">
                    <ArrowBigDown size={16} className="text-slate-400 animate-bounce" />
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Safari Browser Recommended</span>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../../components/ui/Button';

const WaitingForApproval: React.FC = () => {
    const { logout, user } = useAuthStore();

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6 bg-card p-10 rounded-2xl shadow-card border border-border/40">
                <div className="bg-yellow-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="h-10 w-10 text-yellow-500 animate-pulse" />
                </div>
                
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">Waiting for Approval</h1>
                    <p className="text-muted text-sm leading-relaxed">
                        Hello <span className="font-semibold text-foreground">{user?.name}</span>, your account setup is complete, but it requires activation by an administrator.
                    </p>
                </div>

                <div className="bg-accent/5 p-4 rounded-xl border border-accent/10">
                    <p className="text-xs text-accent font-medium uppercase tracking-wider mb-2 text-left opacity-70">Next Steps</p>
                    <ul className="text-left text-sm space-y-2 text-muted">
                        <li className="flex items-start">
                            <span className="bg-accent/20 text-accent rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold mr-2 mt-0.5 shrink-0">1</span>
                            An admin will verify your details soon.
                        </li>
                        <li className="flex items-start">
                            <span className="bg-accent/20 text-accent rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold mr-2 mt-0.5 shrink-0">2</span>
                            You will receive an email once approved.
                        </li>
                        <li className="flex items-start">
                            <span className="bg-accent/20 text-accent rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold mr-2 mt-0.5 shrink-0">3</span>
                            After approval, you can access your dashboard.
                        </li>
                    </ul>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => window.location.reload()} 
                        className="w-full"
                    >
                        Check Status Again
                    </Button>
                    <Button 
                        variant="icon" 
                        onClick={() => logout()} 
                        className="w-full text-muted hover:text-red-400 !bg-transparent border-none"
                    >
                        <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </Button>
                </div>
                
                <p className="text-[11px] text-muted opacity-60 italic">
                    If you believe this is an error, please contact support.
                </p>
            </div>
        </div>
    );
};

export default WaitingForApproval;

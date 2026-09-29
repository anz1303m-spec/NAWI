import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const data = await login(email, password);
            if (data.user && data.user.role === 'admin') navigate('/admin');
            else if (data.user && data.user.role === 'viewer') navigate('/viewer');
            else navigate('/home');
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Plus_Jakarta_Sans'] text-[#0F172A]">
            <Navbar />

            <div className="flex-1 flex items-center justify-center p-6">
                {/* Auth Card */}
                <div className="bg-white p-8 md:p-10 rounded-[16px] border border-[#E2E8F0] shadow-sm max-w-md w-full">
                    {/* Brand Header */}
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-[#2563EB] rounded-[16px] grid place-items-center text-white text-2xl mx-auto mb-5 shadow-sm">
                            <i className="fas fa-balance-scale-right"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-[#0F172A] mb-1.5 font-['Outfit'] tracking-tight">
                            Secure Login
                        </h2>
                        <p className="text-[#64748B] text-xs">
                            Sign in to access your NAWI verification workspace
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] px-4 py-2.5 rounded-[12px] mb-5 text-xs font-bold">
                            <i className="fas fa-exclamation-circle mr-1.5"></i> {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                                EMAIL ADDRESS
                            </label>
                            <input
                                type="email"
                                className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-[10px] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all"
                                placeholder="name@organization.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                                PASSWORD
                            </label>
                            <input
                                type="password"
                                className="w-full px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-[10px] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="w-full mt-2 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold rounded-[10px] shadow-sm transition-all flex items-center justify-center gap-2" 
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Signing in...
                                </>
                            ) : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 text-center text-[#64748B] text-[11px] flex items-center justify-center gap-1.5">
                        <i className="fas fa-shield-alt"></i> Encrypted JWT Authentication • Legal Metrology Governance
                    </div>
                </div>
            </div>
        </div>
    );
}

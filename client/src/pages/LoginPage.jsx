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
                {/* Auth Card: Convex Tactile Relief */}
                <div className="bg-white p-8 md:p-10 rounded-[14px] border border-[#E2E8F0] shadow-sm max-w-md w-full">
                    {/* Brand Header */}
                    <div className="text-center mb-7">
                        <div className="w-13 h-13 bg-[#0F172A] rounded-[13px] grid place-items-center text-white text-xl mx-auto mb-4 shadow-sm">
                            <i className="fas fa-balance-scale-right"></i>
                        </div>
                        <h2 className="text-xl font-bold text-[#0F172A] mb-1 font-['Outfit'] uppercase tracking-tight">
                            Officer Authentication
                        </h2>
                        <p className="text-[#64748B] text-xs">
                            Sign in to access official NAWI verification and inspection records
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="bg-[#FEE2E2] border border-[#FECACA] text-[#991B1B] px-4 py-2.5 rounded-[13px] mb-5 text-xs font-bold">
                            <i className="fas fa-exclamation-circle mr-1.5"></i> {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                                Official Email Address
                            </label>
                            <input
                                type="email"
                                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[13px] text-xs text-[#0F172A] shadow-[inset_1px_1px_3px_#CBD5E1] focus:border-[#2563EB] outline-none transition-all"
                                placeholder="officer@metrology.gov.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[13px] text-xs text-[#0F172A] shadow-[inset_1px_1px_3px_#CBD5E1] focus:border-[#2563EB] outline-none transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn w-full mt-3 py-3 text-xs tracking-wider uppercase font-bold" 
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Authenticating Credentials...
                                </>
                            ) : 'Authorize Session'}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-[#DED7C8] text-center text-[#7A7469] text-[11px]">
                        <i className="fas fa-shield-alt mr-1"></i> Role-Based Access Control: Verification, Review, Sealing
                    </div>
                </div>
            </div>
        </div>
    );
}

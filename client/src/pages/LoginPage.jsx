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
        <div className="min-h-screen bg-[#F4F0E8] flex flex-col font-['Plus_Jakarta_Sans'] text-[#1C1A17]">
            <Navbar />

            <div className="flex-1 flex items-center justify-center p-6">
                {/* Auth Card: Convex Tactile Relief */}
                <div className="bg-[#F4F0E8] p-8 md:p-10 rounded-[14px] border border-[#DED7C8] shadow-[6px_6px_18px_#DBD3C3,-6px_-6px_18px_#FFFFFF] max-w-md w-full">
                    {/* Brand Header */}
                    <div className="text-center mb-7">
                        <div className="w-13 h-13 bg-[#1C1A17] rounded-[13px] grid place-items-center text-[#F4F0E8] text-xl mx-auto mb-4 shadow-[3px_3px_8px_#DBD3C3,-3px_-3px_8px_#FFFFFF]">
                            <i className="fas fa-balance-scale-right"></i>
                        </div>
                        <h2 className="text-xl font-bold text-[#1C1A17] mb-1 font-['Outfit'] uppercase tracking-tight">
                            Officer Authentication
                        </h2>
                        <p className="text-[#5C5852] text-xs">
                            Sign in to access official NAWI verification and inspection records
                        </p>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="bg-[#F5DDDC] border border-[#EBC3C2] text-[#8B2522] px-4 py-2.5 rounded-[13px] mb-5 text-xs font-bold">
                            <i className="fas fa-exclamation-circle mr-1.5"></i> {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-[#1C1A17] uppercase tracking-wider mb-1.5">
                                Official Email Address
                            </label>
                            <input
                                type="email"
                                className="w-full px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DED7C8] rounded-[13px] text-xs text-[#1C1A17] shadow-[inset_2px_2px_4px_#DBD3C3,inset_-2px_-2px_4px_#FFFFFF] focus:border-[#1C1A17] outline-none transition-all"
                                placeholder="officer@metrology.gov.in"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-[#1C1A17] uppercase tracking-wider mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                className="w-full px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DED7C8] rounded-[13px] text-xs text-[#1C1A17] shadow-[inset_2px_2px_4px_#DBD3C3,inset_-2px_-2px_4px_#FFFFFF] focus:border-[#1C1A17] outline-none transition-all"
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

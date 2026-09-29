import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    const closeMenu = () => setMobileOpen(false);

    return (
        <nav 
            className="sticky top-0 z-[1000] w-full flex items-center justify-between px-5 md:px-10 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] shadow-sm"
        >
            {/* Brand Logo & Name */}
            <Link 
                to="/" 
                className="flex items-center gap-3 no-underline tracking-wide hover:opacity-90 transition-opacity"
                onClick={closeMenu}
                style={{ textDecoration: 'none' }}
            >
                <div className="w-9 h-9 bg-[#2563EB] rounded-[11px] grid place-items-center text-white text-base shadow-sm">
                    <i className="fas fa-balance-scale-right"></i>
                </div>
                <div className="flex flex-col">
                    <span className="text-[#0F172A] font-['Outfit'] text-xl font-bold tracking-tight leading-none">
                        NAWI
                    </span>
                    <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider mt-0.5">
                        OIML R 76-1 Metrology
                    </span>
                </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
                <a 
                    href="/#how-it-works" 
                    className="text-[#64748B] hover:text-[#0F172A] no-underline text-xs font-bold uppercase tracking-wider transition-colors duration-150"
                    style={{ textDecoration: 'none' }}
                >
                    Evaluation Process
                </a>
                <Link 
                    to="/verify" 
                    className={`no-underline text-xs font-bold uppercase tracking-wider transition-colors duration-150 px-3 py-1.5 rounded-[10px] ${
                        location.pathname.startsWith('/verify') 
                            ? 'bg-[#EFF6FF] text-[#2563EB] font-bold border border-[#BFDBFE]' 
                            : 'text-[#64748B] hover:text-[#0F172A]'
                    }`}
                    style={{ textDecoration: 'none' }}
                >
                    Certificate Verification
                </Link>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
                {user ? (
                    <Link 
                        to={user.role === 'admin' ? '/admin' : user.role === 'viewer' ? '/viewer' : '/home'} 
                        className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-[10px] font-semibold text-xs transition-all duration-150 shadow-sm no-underline flex items-center gap-2"
                        style={{ textDecoration: 'none' }}
                    >
                        Workspace Portal &rarr;
                    </Link>
                ) : (
                    <Link 
                        to="/login" 
                        className={`px-4 py-2 rounded-[10px] font-semibold text-xs transition-all duration-150 no-underline border ${
                            location.pathname === '/login' 
                                ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm' 
                                : 'bg-white text-[#0F172A] border-[#CBD5E1] shadow-sm hover:bg-[#F1F5F9]'
                        }`}
                        style={{ textDecoration: 'none' }}
                    >
                        Inspector Login
                    </Link>
                )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
                className="md:hidden text-[#0F172A] p-2 focus:outline-none text-xl transition-colors cursor-pointer bg-transparent border-0"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle Navigation Menu"
            >
                <i className={mobileOpen ? "fas fa-times" : "fas fa-bars"}></i>
            </button>

            {/* Mobile Menu Dropdown */}
            {mobileOpen && (
                <div 
                    className="md:hidden flex flex-col absolute top-full left-0 right-0 px-6 py-5 gap-4 z-[999] bg-[#F8FAFC] border-b border-[#E2E8F0] shadow-md"
                >
                    <a 
                        href="/#how-it-works" 
                        className="text-[#0F172A] no-underline text-sm font-semibold py-2 border-b border-[#E2E8F0] uppercase tracking-wider transition-colors" 
                        onClick={closeMenu}
                    >
                        Evaluation Process
                    </a>
                    <Link 
                        to="/verify" 
                        className="no-underline text-sm font-semibold py-2 border-b border-[#E2E8F0] uppercase tracking-wider text-[#0F172A]" 
                        onClick={closeMenu}
                    >
                        Certificate Verification
                    </Link>
                    <div className="flex flex-col gap-2.5 pt-2">
                        {user ? (
                            <Link 
                                to={user.role === 'admin' ? '/admin' : user.role === 'viewer' ? '/viewer' : '/home'} 
                                className="w-full text-center bg-[#2563EB] text-white py-2.5 rounded-[10px] font-semibold text-xs shadow-sm no-underline block" 
                                onClick={closeMenu}
                            >
                                Workspace Portal &rarr;
                            </Link>
                        ) : (
                            <Link 
                                to="/login" 
                                className="w-full text-center py-2.5 rounded-[10px] font-semibold text-xs no-underline block bg-[#2563EB] text-white shadow-sm"
                                onClick={closeMenu}
                            >
                                Inspector Login
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
}

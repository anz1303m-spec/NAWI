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
            className="sticky top-0 z-[1000] w-full flex items-center justify-between px-5 md:px-10 py-3.5 bg-[#F4F0E8] border-b border-[#DED7C8] shadow-[0_2px_8px_#DBD3C3]"
        >
            {/* Brand Logo & Name */}
            <Link 
                to="/" 
                className="flex items-center gap-3 no-underline tracking-wide hover:opacity-90 transition-opacity"
                onClick={closeMenu}
                style={{ textDecoration: 'none' }}
            >
                <div className="w-9 h-9 bg-[#1C1A17] rounded-[13px] grid place-items-center text-[#F4F0E8] text-base shadow-[2px_2px_5px_#DBD3C3,-2px_-2px_5px_#FFFFFF]">
                    <i className="fas fa-balance-scale-right"></i>
                </div>
                <div className="flex flex-col">
                    <span className="text-[#1C1A17] font-['Outfit'] text-xl font-bold tracking-tight leading-none">
                        NAWI
                    </span>
                    <span className="text-[#7A7469] text-[10px] font-bold uppercase tracking-wider mt-0.5">
                        OIML R 76-1 Metrology
                    </span>
                </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
                <a 
                    href="/#how-it-works" 
                    className="text-[#5C5852] hover:text-[#1C1A17] no-underline text-xs font-bold uppercase tracking-wider transition-colors duration-150"
                    style={{ textDecoration: 'none' }}
                >
                    Evaluation Process
                </a>
                <Link 
                    to="/verify" 
                    className={`no-underline text-xs font-bold uppercase tracking-wider transition-colors duration-150 px-3 py-1.5 rounded-[13px] ${
                        location.pathname.startsWith('/verify') 
                            ? 'bg-[#EAE4D6] text-[#1C1A17] shadow-[inset_2px_2px_4px_#DBD3C3,inset_-2px_-2px_4px_#FFFFFF] border border-[#DED7C8]' 
                            : 'text-[#5C5852] hover:text-[#1C1A17]'
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
                        className="bg-[#1C1A17] hover:bg-[#2B2824] text-[#F4F0E8] px-4 py-2 rounded-[13px] font-semibold text-xs transition-all duration-150 shadow-[3px_3px_8px_#DBD3C3,-3px_-3px_8px_#FFFFFF] active:translate-y-0.5 no-underline flex items-center gap-2 border border-[#1C1A17]"
                        style={{ textDecoration: 'none' }}
                    >
                        Workspace Portal &rarr;
                    </Link>
                ) : (
                    <Link 
                        to="/login" 
                        className={`px-4 py-2 rounded-[13px] font-semibold text-xs transition-all duration-150 no-underline border ${
                            location.pathname === '/login' 
                                ? 'bg-[#1C1A17] text-[#F4F0E8] border-[#1C1A17] shadow-[3px_3px_8px_#DBD3C3,-3px_-3px_8px_#FFFFFF]' 
                                : 'bg-[#F4F0E8] text-[#1C1A17] border-[#DED7C8] shadow-[3px_3px_8px_#DBD3C3,-3px_-3px_8px_#FFFFFF] hover:bg-[#EAE4D6]'
                        }`}
                        style={{ textDecoration: 'none' }}
                    >
                        Inspector Login
                    </Link>
                )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
                className="md:hidden text-[#1C1A17] p-2 focus:outline-none text-xl transition-colors cursor-pointer bg-transparent border-0"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle Navigation Menu"
            >
                <i className={mobileOpen ? "fas fa-times" : "fas fa-bars"}></i>
            </button>

            {/* Mobile Menu Dropdown */}
            {mobileOpen && (
                <div 
                    className="md:hidden flex flex-col absolute top-full left-0 right-0 px-6 py-5 gap-4 z-[999] bg-[#F4F0E8] border-b border-[#DED7C8] shadow-[0_8px_16px_#DBD3C3]"
                >
                    <a 
                        href="/#how-it-works" 
                        className="text-[#1C1A17] no-underline text-sm font-semibold py-2 border-b border-[#DED7C8] uppercase tracking-wider transition-colors" 
                        onClick={closeMenu}
                    >
                        Evaluation Process
                    </a>
                    <Link 
                        to="/verify" 
                        className="no-underline text-sm font-semibold py-2 border-b border-[#DED7C8] uppercase tracking-wider text-[#1C1A17]" 
                        onClick={closeMenu}
                    >
                        Certificate Verification
                    </Link>
                    <div className="flex flex-col gap-2.5 pt-2">
                        {user ? (
                            <Link 
                                to={user.role === 'admin' ? '/admin' : user.role === 'viewer' ? '/viewer' : '/home'} 
                                className="w-full text-center bg-[#1C1A17] text-[#F4F0E8] py-2.5 rounded-[13px] font-semibold text-xs shadow-[3px_3px_8px_#DBD3C3] no-underline block" 
                                onClick={closeMenu}
                            >
                                Workspace Portal &rarr;
                            </Link>
                        ) : (
                            <Link 
                                to="/login" 
                                className="w-full text-center py-2.5 rounded-[13px] font-semibold text-xs no-underline block bg-[#1C1A17] text-[#F4F0E8] shadow-[3px_3px_8px_#DBD3C3]"
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

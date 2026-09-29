import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ title }) {
    const { user } = useAuth();
    const role = user?.role || 'tester';

    const toggleSidebar = () => {
        window.dispatchEvent(new CustomEvent('toggle-sidebar'));
    };

    return (
        <header className="w-full bg-[#FFFFFF] border-b border-[#E2E8F0] px-4 md:px-7 py-3 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] sticky top-0 z-40">
            <div className="flex items-center gap-2.5 min-w-0">
                <button 
                    onClick={toggleSidebar}
                    className="md:hidden text-[#0F172A] p-2 hover:bg-[#F8FAFC] rounded-[10px] transition-colors flex items-center justify-center cursor-pointer border border-[#E2E8F0] shrink-0"
                    aria-label="Toggle Navigation Menu"
                >
                    <i className="fas fa-bars text-sm"></i>
                </button>
                <span className="w-2 h-2 rounded-full bg-[#2563EB] hidden sm:inline-block shrink-0"></span>
                <h1 className="text-xs sm:text-sm md:text-base font-bold text-[#0F172A] font-['Outfit'] uppercase tracking-tight m-0 p-0 truncate">
                    {title || 'Legal Metrology System'}
                </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1 rounded-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>
                    <span className="text-[10px] md:text-[11px] font-bold text-[#0F172A] tracking-wider uppercase">
                        OIML R 76-1 Standard
                    </span>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-[11px] text-[10px] md:text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                    {role === 'admin' ? 'Admin Authority' : role === 'viewer' ? 'Reviewer' : 'Verification Officer'}
                </div>
            </div>
        </header>
    );
}


import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ title }) {
    const { user } = useAuth();
    const role = user?.role || 'tester';

    return (
        <header className="w-full bg-[#F8FAFC] border-b border-[#E2E8F0] px-7 py-3.5 flex items-center justify-between shadow-[0_2px_6px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-[4px] bg-[#2563EB]"></span>
                <h1 className="text-sm md:text-base font-bold text-[#0F172A] font-['Outfit'] uppercase tracking-tight m-0 p-0">
                    {title || 'Legal Metrology System'}
                </h1>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1 rounded-[13px] shadow-[inset_1px_1px_3px_#E2E8F0]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#166534]"></span>
                    <span className="text-[11px] font-bold text-[#0F172A] tracking-wider uppercase">
                        OIML R 76-1 Standard
                    </span>
                </div>
                <div className="bg-[#F1F5F9] border border-[#E2E8F0] px-2.5 py-1 rounded-[13px] text-[11px] font-bold text-[#475569] uppercase tracking-wider">
                    {role === 'admin' ? 'Administrator Authority' : role === 'viewer' ? 'Quality Reviewer' : 'Verification Officer'}
                </div>
            </div>
        </header>
    );
}

import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header({ title }) {
    const { user } = useAuth();
    const role = user?.role || 'tester';

    return (
        <header className="w-full bg-[#F4F0E8] border-b border-[#DED7C8] px-7 py-3.5 flex items-center justify-between shadow-[0_2px_6px_#DBD3C3]">
            <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-[4px] bg-[#1C1A17]"></span>
                <h1 className="text-sm md:text-base font-bold text-[#1C1A17] font-['Outfit'] uppercase tracking-tight m-0 p-0">
                    {title || 'Legal Metrology System'}
                </h1>
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 bg-[#EAE4D6] border border-[#DED7C8] px-3 py-1 rounded-[13px] shadow-[inset_1px_1px_3px_#DBD3C3]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A27]"></span>
                    <span className="text-[11px] font-bold text-[#1C1A17] tracking-wider uppercase">
                        OIML R 76-1 Standard
                    </span>
                </div>
                <div className="bg-[#EAE4D6] border border-[#DED7C8] px-2.5 py-1 rounded-[13px] text-[11px] font-bold text-[#5C5852] uppercase tracking-wider">
                    {role === 'admin' ? 'Administrator Authority' : role === 'viewer' ? 'Quality Reviewer' : 'Verification Officer'}
                </div>
            </div>
        </header>
    );
}

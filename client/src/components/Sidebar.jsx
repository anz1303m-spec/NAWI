import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { user, logout, showToast } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const role = user?.role || 'tester';
    const username = user?.name || user?.username || (role === 'admin' ? 'Administrator' : role === 'viewer' ? 'Quality Reviewer' : 'Verification Officer');
    const hasActiveSession = !!localStorage.getItem('InstrumentData');

    const handleBlockedNav = (e, path) => {
        if (!hasActiveSession && (path === '/test-plan' || path === '/tests')) {
            e.preventDefault();
            showToast('No active test session found. Please configure an instrument to proceed.');
        }
    };

    return (
        <aside className="w-[260px] bg-[#F8FAFC] flex flex-col fixed top-0 left-0 bottom-0 z-[100] border-r border-[#E2E8F0] shadow-[2px_0_10px_rgba(0,0,0,0.03)]">
            {/* Sidebar Brand Header */}
            <div className="px-5 py-5 border-b border-[#E2E8F0] flex items-center gap-3">
                <div className="w-9 h-9 bg-[#2563EB] rounded-[13px] grid place-items-center text-white text-base shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
                    <i className="fas fa-balance-scale-right"></i>
                </div>
                <div className="flex flex-col">
                    <span className="text-[#0F172A] font-bold text-base font-['Outfit'] tracking-tight leading-tight">
                        NAWI VERIFY
                    </span>
                    <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">
                        OIML R 76-1 Portal
                    </span>
                </div>
            </div>
            
            {/* Sidebar Navigation Items */}
            <div className="flex-1 px-3 py-4 flex flex-col gap-1.5 overflow-y-auto">
                {role === 'admin' ? (
                    <>
                        <NavLink 
                            to="/admin" 
                            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[13px] transition-all no-underline ${
                                isActive 
                                    ? 'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]' 
                                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                            }`}
                        >
                            <i className="fas fa-user-shield w-4 text-center"></i> <span>Admin Dashboard</span>
                        </NavLink>
                        <NavLink 
                            to="/history" 
                            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[13px] transition-all no-underline ${
                                isActive 
                                    ? 'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]' 
                                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                            }`}
                        >
                            <i className="fas fa-history w-4 text-center"></i> <span>All Reports</span>
                        </NavLink>
                    </>
                ) : role === 'viewer' ? (
                    <>
                        <NavLink 
                            to="/viewer" 
                            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[13px] transition-all no-underline ${
                                isActive 
                                    ? 'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]' 
                                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                            }`}
                        >
                            <i className="fas fa-search-plus w-4 text-center"></i> <span>Review Queue</span>
                        </NavLink>
                        <NavLink 
                            to="/history" 
                            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[13px] transition-all no-underline ${
                                isActive 
                                    ? 'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]' 
                                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                            }`}
                        >
                            <i className="fas fa-history w-4 text-center"></i> <span>Archived Reports</span>
                        </NavLink>
                    </>
                ) : (
                    <>
                        <NavLink 
                            to="/home" 
                            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[13px] transition-all no-underline ${
                                isActive 
                                    ? 'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]' 
                                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                            }`}
                        >
                            <i className="fas fa-th-large w-4 text-center"></i> <span>Dashboard</span>
                        </NavLink>
                        <NavLink 
                            to="/new-test" 
                            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[13px] transition-all no-underline ${
                                isActive 
                                    ? 'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]' 
                                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                            }`}
                        >
                            <i className="fas fa-plus w-4 text-center"></i> <span>New Test</span>
                        </NavLink>
                        <NavLink 
                            to="/test-plan" 
                            onClick={(e) => handleBlockedNav(e, '/test-plan')}
                            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[13px] transition-all no-underline ${
                                isActive 
                                    ? 'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]' 
                                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                            }`}
                        >
                            <i className="fas fa-clipboard-list w-4 text-center"></i> 
                            <span>{hasActiveSession && location.pathname !== '/test-plan' ? 'Resume Planner' : 'Test Planner'}</span>
                        </NavLink>
                        <NavLink 
                            to="/tests" 
                            onClick={(e) => handleBlockedNav(e, '/tests')}
                            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[13px] transition-all no-underline ${
                                isActive 
                                    ? 'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]' 
                                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                            }`}
                        >
                            <i className="fas fa-flask w-4 text-center"></i> 
                            <span>{hasActiveSession && location.pathname !== '/tests' ? 'Resume Execution' : 'Test Execution'}</span>
                        </NavLink>
                        <NavLink 
                            to="/history" 
                            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[13px] transition-all no-underline ${
                                isActive 
                                    ? 'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]' 
                                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                            }`}
                        >
                            <i className="fas fa-history w-4 text-center"></i> <span>History</span>
                        </NavLink>
                    </>
                )}
            </div>

            {/* Sidebar User Footer */}
            <div className="p-3 border-t border-[#E2E8F0] mt-auto">
                <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-[13px] p-3 shadow-[inset_1px_1px_3px_#CBD5E1]">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-8 h-8 rounded-[11px] bg-[#2563EB] grid place-items-center text-white font-bold text-xs shadow-sm">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                            <div className="text-[#0F172A] text-xs font-bold truncate">{username}</div>
                            <div className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider">
                                {role === 'admin' ? 'Administrator' : role === 'viewer' ? 'Reviewer' : 'Tester'}
                            </div>
                        </div>
                    </div>
                    <button 
                        className="flex items-center justify-center gap-1.5 text-[#991B1B] bg-[#FEE2E2] hover:bg-[#FECACA] text-xs font-bold py-1.5 rounded-[11px] transition-colors w-full cursor-pointer border border-[#FECACA]" 
                        onClick={() => { logout(); navigate('/login'); }}
                    >
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
        </aside>
    );
}

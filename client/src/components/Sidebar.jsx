import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
    const { user, logout, showToast } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleToggle = () => setMobileOpen(prev => !prev);
        const handleClose = () => setMobileOpen(false);
        window.addEventListener('toggle-sidebar', handleToggle);
        window.addEventListener('close-sidebar', handleClose);
        return () => {
            window.removeEventListener('toggle-sidebar', handleToggle);
            window.removeEventListener('close-sidebar', handleClose);
        };
    }, []);

    const role = user?.role || 'tester';
    const username = user?.name || user?.username || (role === 'admin' ? 'Administrator' : role === 'viewer' ? 'Quality Reviewer' : 'Verification Officer');
    const hasActiveSession = !!localStorage.getItem('InstrumentData');

    const handleBlockedNav = (e, path) => {
        if (!hasActiveSession && (path === '/test-plan' || path === '/tests')) {
            e.preventDefault();
            showToast('No active test session found. Please configure an instrument to proceed.');
        } else {
            setMobileOpen(false);
        }
    };

    const navClick = () => setMobileOpen(false);

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {mobileOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[990] md:hidden transition-opacity"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside className={`w-[260px] bg-[#FFFFFF] flex flex-col fixed top-0 left-0 bottom-0 z-[1000] border-r border-[#E2E8F0] shadow-[4px_0_15px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-in-out ${
                mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}>
                {/* Sidebar Brand Header */}
                <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#2563EB] rounded-[12px] grid place-items-center text-white text-base shadow-[0_2px_8px_rgba(37,99,235,0.25)]">
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
                    {/* Mobile Close Button */}
                    <button 
                        onClick={() => setMobileOpen(false)}
                        className="md:hidden text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-lg hover:bg-[#F8FAFC] cursor-pointer"
                        aria-label="Close Sidebar"
                    >
                        <i className="fas fa-times text-base"></i>
                    </button>
                </div>
                
                {/* Sidebar Navigation Items */}
                <div className="flex-1 px-3 py-4 flex flex-col gap-1.5 overflow-y-auto">
                    {role === 'admin' ? (
                        <>
                            <NavLink 
                                to="/admin" 
                                onClick={navClick}
                                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[12px] transition-all no-underline ${
                                    isActive 
                                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] shadow-xs' 
                                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                                }`}
                            >
                                <i className="fas fa-user-shield w-4 text-center"></i> <span>Admin Dashboard</span>
                            </NavLink>
                            <NavLink 
                                to="/history" 
                                onClick={navClick}
                                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[12px] transition-all no-underline ${
                                    isActive 
                                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] shadow-xs' 
                                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                                }`}
                            >
                                <i className="fas fa-history w-4 text-center"></i> <span>All Reports</span>
                            </NavLink>
                        </>
                    ) : role === 'viewer' ? (
                        <>
                            <NavLink 
                                to="/viewer" 
                                onClick={navClick}
                                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[12px] transition-all no-underline ${
                                    isActive 
                                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] shadow-xs' 
                                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                                }`}
                            >
                                <i className="fas fa-search-plus w-4 text-center"></i> <span>Review Queue</span>
                            </NavLink>
                            <NavLink 
                                to="/history" 
                                onClick={navClick}
                                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[12px] transition-all no-underline ${
                                    isActive 
                                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] shadow-xs' 
                                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                                }`}
                            >
                                <i className="fas fa-history w-4 text-center"></i> <span>Archived Reports</span>
                            </NavLink>
                        </>
                    ) : (
                        <>
                            <NavLink 
                                to="/home" 
                                onClick={navClick}
                                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[12px] transition-all no-underline ${
                                    isActive 
                                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] shadow-xs' 
                                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                                }`}
                            >
                                <i className="fas fa-th-large w-4 text-center"></i> <span>Dashboard</span>
                            </NavLink>
                            <NavLink 
                                to="/new-test" 
                                onClick={navClick}
                                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[12px] transition-all no-underline ${
                                    isActive 
                                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] shadow-xs' 
                                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                                }`}
                            >
                                <i className="fas fa-plus w-4 text-center"></i> <span>New Test</span>
                            </NavLink>
                            <NavLink 
                                to="/test-plan" 
                                onClick={(e) => handleBlockedNav(e, '/test-plan')}
                                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[12px] transition-all no-underline ${
                                    isActive 
                                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] shadow-xs' 
                                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                                }`}
                            >
                                <i className="fas fa-clipboard-list w-4 text-center"></i> 
                                <span>{hasActiveSession && location.pathname !== '/test-plan' ? 'Resume Planner' : 'Test Planner'}</span>
                            </NavLink>
                            <NavLink 
                                to="/tests" 
                                onClick={(e) => handleBlockedNav(e, '/tests')}
                                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[12px] transition-all no-underline ${
                                    isActive 
                                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] shadow-xs' 
                                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                                }`}
                            >
                                <i className="fas fa-flask w-4 text-center"></i> 
                                <span>{hasActiveSession && location.pathname !== '/tests' ? 'Resume Execution' : 'Test Execution'}</span>
                            </NavLink>
                            <NavLink 
                                to="/history" 
                                onClick={navClick}
                                className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[12px] transition-all no-underline ${
                                    isActive 
                                        ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] shadow-xs' 
                                        : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                                }`}
                            >
                                <i className="fas fa-history w-4 text-center"></i> <span>History</span>
                            </NavLink>
                        </>
                    )}
                </div>

                {/* Sidebar User Footer */}
                <div className="p-3 border-t border-[#E2E8F0] mt-auto">
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-3">
                        <div className="flex items-center gap-2.5 mb-2.5">
                            <div className="w-8 h-8 rounded-[10px] bg-[#2563EB] grid place-items-center text-white font-bold text-xs shadow-sm">
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
                            className="flex items-center justify-center gap-1.5 text-[#991B1B] bg-[#FEE2E2] hover:bg-[#FECACA] text-xs font-bold py-1.5 rounded-[10px] transition-colors w-full cursor-pointer border border-[#FECACA]" 
                            onClick={() => { setMobileOpen(false); logout(); navigate('/login'); }}
                        >
                            <i className="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}


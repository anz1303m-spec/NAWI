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
        <aside className="w-[260px] bg-[#F4F0E8] flex flex-col fixed top-0 left-0 bottom-0 z-[100] border-r border-[#DED7C8] shadow-[2px_0_10px_#DBD3C3]">
            {/* Sidebar Brand Header */}
            <div className="px-5 py-5 border-b border-[#DED7C8] flex items-center gap-3">
                <div className="w-9 h-9 bg-[#1C1A17] rounded-[13px] grid place-items-center text-[#F4F0E8] text-base shadow-[2px_2px_5px_#DBD3C3,-2px_-2px_5px_#FFFFFF]">
                    <i className="fas fa-balance-scale-right"></i>
                </div>
                <div className="flex flex-col">
                    <span className="text-[#1C1A17] font-bold text-base font-['Outfit'] tracking-tight leading-tight">
                        NAWI VERIFY
                    </span>
                    <span className="text-[#7A7469] text-[10px] font-bold uppercase tracking-wider">
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
                                    ? 'bg-[#EAE4D6] text-[#1C1A17] border border-[#DED7C8] shadow-[inset_2px_2px_4px_#DBD3C3,inset_-2px_-2px_4px_#FFFFFF]' 
                                    : 'text-[#5C5852] hover:bg-[#EAE4D6]/60 hover:text-[#1C1A17]'
                            }`}
                        >
                            <i className="fas fa-user-shield w-4 text-center"></i> <span>Admin Dashboard</span>
                        </NavLink>
                        <NavLink 
                            to="/history" 
                            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[13px] transition-all no-underline ${
                                isActive 
                                    ? 'bg-[#EAE4D6] text-[#1C1A17] border border-[#DED7C8] shadow-[inset_2px_2px_4px_#DBD3C3,inset_-2px_-2px_4px_#FFFFFF]' 
                                    : 'text-[#5C5852] hover:bg-[#EAE4D6]/60 hover:text-[#1C1A17]'
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
                                    ? 'bg-[#EAE4D6] text-[#1C1A17] border border-[#DED7C8] shadow-[inset_2px_2px_4px_#DBD3C3,inset_-2px_-2px_4px_#FFFFFF]' 
                                    : 'text-[#5C5852] hover:bg-[#EAE4D6]/60 hover:text-[#1C1A17]'
                            }`}
                        >
                            <i className="fas fa-search-plus w-4 text-center"></i> <span>Review Queue</span>
                        </NavLink>
                        <NavLink 
                            to="/history" 
                            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[13px] transition-all no-underline ${
                                isActive 
                                    ? 'bg-[#EAE4D6] text-[#1C1A17] border border-[#DED7C8] shadow-[inset_2px_2px_4px_#DBD3C3,inset_-2px_-2px_4px_#FFFFFF]' 
                                    : 'text-[#5C5852] hover:bg-[#EAE4D6]/60 hover:text-[#1C1A17]'
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
                                    ? 'bg-[#EAE4D6] text-[#1C1A17] border border-[#DED7C8] shadow-[inset_2px_2px_4px_#DBD3C3,inset_-2px_-2px_4px_#FFFFFF]' 
                                    : 'text-[#5C5852] hover:bg-[#EAE4D6]/60 hover:text-[#1C1A17]'
                            }`}
                        >
                            <i className="fas fa-th-large w-4 text-center"></i> <span>Dashboard</span>
                        </NavLink>
                        <NavLink 
                            to="/new-test" 
                            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[13px] transition-all no-underline ${
                                isActive 
                                    ? 'bg-[#EAE4D6] text-[#1C1A17] border border-[#DED7C8] shadow-[inset_2px_2px_4px_#DBD3C3,inset_-2px_-2px_4px_#FFFFFF]' 
                                    : 'text-[#5C5852] hover:bg-[#EAE4D6]/60 hover:text-[#1C1A17]'
                            }`}
                        >
                            <i className="fas fa-plus w-4 text-center"></i> <span>New Test</span>
                        </NavLink>
                        <NavLink 
                            to="/test-plan" 
                            onClick={(e) => handleBlockedNav(e, '/test-plan')}
                            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[13px] transition-all no-underline ${
                                isActive 
                                    ? 'bg-[#EAE4D6] text-[#1C1A17] border border-[#DED7C8] shadow-[inset_2px_2px_4px_#DBD3C3,inset_-2px_-2px_4px_#FFFFFF]' 
                                    : 'text-[#5C5852] hover:bg-[#EAE4D6]/60 hover:text-[#1C1A17]'
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
                                    ? 'bg-[#EAE4D6] text-[#1C1A17] border border-[#DED7C8] shadow-[inset_2px_2px_4px_#DBD3C3,inset_-2px_-2px_4px_#FFFFFF]' 
                                    : 'text-[#5C5852] hover:bg-[#EAE4D6]/60 hover:text-[#1C1A17]'
                            }`}
                        >
                            <i className="fas fa-flask w-4 text-center"></i> 
                            <span>{hasActiveSession && location.pathname !== '/tests' ? 'Resume Execution' : 'Test Execution'}</span>
                        </NavLink>
                        <NavLink 
                            to="/history" 
                            className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-[13px] transition-all no-underline ${
                                isActive 
                                    ? 'bg-[#EAE4D6] text-[#1C1A17] border border-[#DED7C8] shadow-[inset_2px_2px_4px_#DBD3C3,inset_-2px_-2px_4px_#FFFFFF]' 
                                    : 'text-[#5C5852] hover:bg-[#EAE4D6]/60 hover:text-[#1C1A17]'
                            }`}
                        >
                            <i className="fas fa-history w-4 text-center"></i> <span>History</span>
                        </NavLink>
                    </>
                )}
            </div>

            {/* Sidebar User Footer */}
            <div className="p-3 border-t border-[#DED7C8] mt-auto">
                <div className="bg-[#EAE4D6] border border-[#DED7C8] rounded-[13px] p-3 shadow-[inset_1px_1px_3px_#DBD3C3]">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-8 h-8 rounded-[11px] bg-[#1C1A17] grid place-items-center text-[#F4F0E8] font-bold text-xs shadow-[2px_2px_5px_#DBD3C3]">
                            {username.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                            <div className="text-[#1C1A17] text-xs font-bold truncate">{username}</div>
                            <div className="text-[#7A7469] text-[10px] font-bold uppercase tracking-wider">
                                {role === 'admin' ? 'Administrator' : role === 'viewer' ? 'Reviewer' : 'Tester'}
                            </div>
                        </div>
                    </div>
                    <button 
                        className="flex items-center justify-center gap-1.5 text-[#8B2522] bg-[#F5DDDC] hover:bg-[#EBC3C2] text-xs font-bold py-1.5 rounded-[11px] transition-colors w-full cursor-pointer border border-[#EBC3C2]" 
                        onClick={() => { logout(); navigate('/login'); }}
                    >
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
        </aside>
    );
}

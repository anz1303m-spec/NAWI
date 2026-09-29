import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { cachedFetch } from '../utils/apiCache';

export default function HomePage() {
    const { user, authFetch } = useAuth();
    const navigate = useNavigate();

    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({ total: 0, passed: 0, failed: 0 });
    const [recentTests, setRecentTests] = useState([]);
    const [pendingInfo, setPendingInfo] = useState(null);

    useEffect(() => {
        cachedFetch(authFetch, '/api/history')
            .then(data => {
                if (Array.isArray(data)) {
                    setReports(data);
                    let passed = 0;
                    let failed = 0;
                    const recent = [];

                    data.forEach((r, idx) => {
                        let isPass = r.status === 'PASS';
                        if (isPass) passed++;
                        else failed++;

                        if (idx < 5) {
                            recent.push({
                                id: r._id ? r._id.substring(0, 8).toUpperCase() : 'N/A',
                                fullId: r._id,
                                name: r.instrument_id || "Unknown Instrument",
                                status: isPass ? "PASS" : "FAIL"
                            });
                        }
                    });

                    setStats({ total: data.length, passed, failed });
                    setRecentTests(recent);
                }
            })
            .catch(err => console.error("Error fetching reports:", err));

        try {
            const instStr = localStorage.getItem("InstrumentData");
            if (instStr) {
                const inst = JSON.parse(instStr);
                const name = `${inst.manufacturer || ""} ${inst.model || ""}`.trim() || inst.capacity || "Instrument Test";
                
                const rawPlan = localStorage.getItem("confirmedTestPlan") || localStorage.getItem("testPlan") || "[]";
                const plan = JSON.parse(rawPlan);
                const required = plan.filter(t => t.status === "REQUIRED");

                const resultKeys = { 1: "form0_results", 2: "form1_results", 3: "form2_results", 4: "form3_results", 5: "form_zero_results", 6: "form_tare_results", 8: "form_tilt_results" };
                let doneCount = 0;
                required.forEach(t => {
                    if (localStorage.getItem(resultKeys[t.id])) doneCount++;
                });

                const remaining = Math.max(0, required.length - doneCount);
                if (remaining > 0 || required.length === 0) {
                    setPendingInfo({
                        name,
                        remainingText: required.length === 0 ? "Test plan pending confirmation" : `${remaining} test(s) remaining`
                    });
                }
            }
        } catch (e) {}
    }, [authFetch]);

    const username = user?.name || user?.username || 'Verification Officer';

    return (
        <div className="flex min-h-screen w-full bg-[#F8FAFC] font-['Plus_Jakarta_Sans'] text-[#0F172A]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 ml-[260px]">
                <Header title="Verification Officer Workspace" />
                <div className="p-7 md:p-8 flex-1">
                    {/* Welcome Banner */}
                    <div className="mb-6">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest block mb-1">
                            Legal Metrology Inspection Workspace
                        </span>
                        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-1 font-['Outfit'] uppercase tracking-tight">
                            Officer Overview: {username}
                        </h1>
                        <p className="text-[#64748B] text-xs">
                            Active verification schedule, test plan progress, and calibration records
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-7">
                        <div className="bg-white p-5 rounded-[14px] border border-[#E2E8F0] shadow-sm">
                            <h2 className="text-3xl font-extrabold text-[#0F172A] mb-0.5 font-['IBM_Plex_Mono']">{stats.total}</h2>
                            <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider m-0">Total Evaluations</p>
                        </div>
                        <div className="bg-white p-5 rounded-[14px] border border-[#E2E8F0] shadow-sm">
                            <h2 className="text-3xl font-extrabold text-[#166534] mb-0.5 font-['IBM_Plex_Mono']">{user?.role === 'tester' ? stats.total : stats.passed}</h2>
                            <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider m-0">{user?.role === 'tester' ? 'Submitted' : 'Conforming'}</p>
                        </div>
                        <div className="bg-white p-5 rounded-[14px] border border-[#E2E8F0] shadow-sm">
                            <h2 className="text-3xl font-extrabold text-[#2563EB] mb-0.5 font-['IBM_Plex_Mono']">{pendingInfo ? 1 : 0}</h2>
                            <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider m-0">Active Sessions</p>
                        </div>
                        <div className="bg-white p-5 rounded-[14px] border border-[#E2E8F0] shadow-sm">
                            <h2 className="text-3xl font-extrabold text-[#991B1B] mb-0.5 font-['IBM_Plex_Mono']">{user?.role === 'tester' ? (reports.filter(r => ['REJECTED_BY_VIEWER', 'REJECTED_BY_ADMIN', 'SENT_BACK_TO_TESTER'].includes(r.workflow_status)).length) : stats.failed}</h2>
                            <p className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider m-0">{user?.role === 'tester' ? 'Action Required' : 'Non-Conforming'}</p>
                        </div>
                    </div>

                    {/* Pending Session Banner */}
                    {pendingInfo && (
                        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[14px] p-5 mb-7 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                            <div>
                                <h4 className="text-[#1E40AF] font-bold text-xs uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <i className="fas fa-clock text-[#2563EB]"></i> Active Inspection In Progress
                                </h4>
                                <p className="text-[#1E3A8A] text-xs m-0">
                                    <strong>{pendingInfo.name}</strong> (Status: {pendingInfo.remainingText})
                                </p>
                            </div>
                            <button 
                                className="btn px-4 py-2.5 text-xs font-bold" 
                                onClick={() => navigate('/tests')}
                            >
                                Resume Test Execution <i className="fas fa-arrow-right"></i>
                            </button>
                        </div>
                    )}

                    {/* Content Panels Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Recent Tests Panel */}
                        <div className="bg-white p-6 rounded-[14px] border border-[#E2E8F0] shadow-sm">
                            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
                                <h3 className="text-sm font-bold text-[#0F172A] m-0 font-['Outfit'] uppercase tracking-wider">
                                    Recent Inspections
                                </h3>
                                <Link to="/history" className="text-[11px] font-bold text-[#2563EB] hover:underline no-underline">
                                    View All &rarr;
                                </Link>
                            </div>
                            {recentTests.length > 0 ? (
                                <ul className="divide-y divide-[#F1F5F9] list-none p-0 m-0">
                                    {recentTests.map((t, i) => (
                                        <li 
                                            key={i} 
                                            onClick={() => navigate(`/report/${t.fullId}`)} 
                                            className="flex items-center justify-between py-2.5 hover:bg-[#F8FAFC] px-2 rounded-[10px] transition-colors cursor-pointer"
                                        >
                                            <div>
                                                <strong className="text-[#0F172A] text-xs">{t.name}</strong>
                                                <span className="text-[#94A3B8] text-[11px] font-mono ml-2">({t.id})</span>
                                            </div>
                                            <span className={`status-badge ${
                                                user?.role === 'tester'
                                                    ? 'status-neutral'
                                                    : t.status === 'PASS' 
                                                        ? 'status-pass' 
                                                        : 'status-fail'
                                            }`}>
                                                {user?.role === 'tester' ? 'SUBMITTED' : t.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-[#94A3B8] text-center py-6 text-xs m-0">No tests registered yet.</p>
                            )}
                        </div>

                        {/* Quick Actions Panel */}
                        <div className="bg-white p-6 rounded-[14px] border border-[#E2E8F0] shadow-sm">
                            <h3 className="text-sm font-bold text-[#0F172A] pb-3 border-b border-[#E2E8F0] mb-4 font-['Outfit'] uppercase tracking-wider">
                                Metrological Procedures
                            </h3>
                            <div className="flex flex-col gap-3">
                                <Link 
                                    to="/new-test" 
                                    className="btn px-4 py-3 text-xs tracking-wider uppercase font-bold justify-start"
                                >
                                    <i className="fas fa-plus"></i> Configure New Instrument Inspection
                                </Link>
                                <Link 
                                    to="/test-plan" 
                                    className="bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] px-4 py-3 rounded-[12px] font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-3 no-underline border border-[#E2E8F0] shadow-sm"
                                >
                                    <i className="fas fa-tasks text-[#64748B]"></i> Dynamic Test Planner & Load Generator
                                </Link>
                                <Link 
                                    to="/history" 
                                    className="bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] px-4 py-3 rounded-[12px] font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-3 no-underline border border-[#E2E8F0] shadow-sm"
                                >
                                    <i className="fas fa-folder-open text-[#64748B]"></i> Inspection Archive & Retest Queue
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { SkeletonTable } from '../components/SkeletonLoader';
import { cachedFetch } from '../utils/apiCache';

export default function HistoryPage() {
    const navigate = useNavigate();
    const { authFetch, user } = useAuth();

    const [reports, setReports] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'rejected'
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterClass, setFilterClass] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cachedFetch(authFetch, '/api/history')
            .then(data => {
                if (Array.isArray(data)) {
                    setReports(data);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [authFetch]);

    const rejectedReports = useMemo(() => {
        return reports.filter(r => 
            ['REJECTED_BY_VIEWER', 'REJECTED_BY_ADMIN', 'SENT_BACK_TO_TESTER'].includes(r.workflow_status)
        );
    }, [reports]);

    const filteredReports = useMemo(() => {
        const reportsToDisplay = activeTab === 'rejected' ? rejectedReports : reports;
        return reportsToDisplay.filter(r => {
            const idStr = r._id ? r._id.substring(0, 8).toUpperCase() : '';
            const instStr = (r.instrument_id || '').toUpperCase();
            const snStr = (r.serial_no || '').toUpperCase();
            const fullSearch = `${idStr} ${instStr} ${snStr}`;

            if (searchTerm && !fullSearch.includes(searchTerm.toUpperCase())) return false;
            if (filterStatus && r.status !== filterStatus) return false;
            if (filterClass && !r.accuracy_class.includes(filterClass)) return false;
            if (filterDate) {
                const dateStr = new Date(r.createdAt).toISOString().split('T')[0];
                if (dateStr !== filterDate) return false;
            }

            return true;
        });
    }, [reports, activeTab, rejectedReports, searchTerm, filterStatus, filterClass, filterDate]);

    const handleReTest = (report, e) => {
        e.stopPropagation();
        if (report.instrument_data) {
            localStorage.setItem("InstrumentData", JSON.stringify(report.instrument_data));
            if (report.instrument_data.capacity) localStorage.setItem("Capacity", report.instrument_data.capacity);
            if (report.instrument_data.e_value) localStorage.setItem("eValue", report.instrument_data.e_value);
            if (report.instrument_data.Class_value) localStorage.setItem("ClassValue", report.instrument_data.Class_value);
        }
        navigate('/new-test');
    };

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title="Metrological Inspection Records" />
                <div className="app-content">
                    <div className="flex justify-between items-center flex-wrap gap-3 mb-5">
                        <div>
                            <span className="text-[10px] font-bold text-[#7A7469] uppercase tracking-widest block mb-0.5">
                                Verification Audit Log
                            </span>
                            <h2 className="text-xl md:text-2xl font-bold text-[#1C1A17] font-['Outfit'] uppercase tracking-tight m-0">
                                Inspection & Calibration History
                            </h2>
                            <p className="text-xs text-[#5C5852] mt-0.5 mb-0">
                                Search and review historical NAWI test certificates and multi-tier approval states.
                            </p>
                        </div>

                        {/* Retest Queue Alert Pill */}
                        {rejectedReports.length > 0 && (
                            <div className="bg-[#F5DDDC] border border-[#EBC3C2] px-3.5 py-1.5 rounded-[13px] text-[#8B2522] font-bold text-xs flex items-center gap-2">
                                <i className="fas fa-exclamation-triangle"></i>
                                <span>{rejectedReports.length} Inspection(s) Require Re-Testing</span>
                            </div>
                        )}
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex gap-2 mb-5 border-b border-[#DED7C8] pb-2">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-2 rounded-[13px] border text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'all'
                                    ? 'bg-[#1C1A17] text-[#F4F0E8] border-[#1C1A17] shadow-[2px_2px_5px_#DBD3C3]'
                                    : 'bg-[#F4F0E8] text-[#5C5852] border-[#DED7C8] hover:bg-[#EAE4D6]'
                            }`}
                        >
                            <i className="fas fa-list mr-1.5"></i> All Inspections ({reports.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('rejected')}
                            className={`px-4 py-2 rounded-[13px] border text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'rejected'
                                    ? 'bg-[#8B2522] text-[#F4F0E8] border-[#8B2522] shadow-[2px_2px_5px_#DBD3C3]'
                                    : 'bg-[#F4F0E8] text-[#5C5852] border-[#DED7C8] hover:bg-[#EAE4D6]'
                            }`}
                        >
                            <i className="fas fa-history mr-1.5"></i> Action Required ({rejectedReports.length})
                        </button>
                    </div>

                    {/* Search & Filter Bar: Concave Recessed Well */}
                    <div className="p-4 bg-[#EAE4D6] rounded-[13px] border border-[#DED7C8] shadow-[inset_1px_1px_3px_#DBD3C3] mb-6">
                        <div className="flex gap-3 flex-wrap items-center">
                            <div className="flex-1 min-w-[220px] relative">
                                <i className="fas fa-search absolute left-3 top-3 text-[#7A7469] text-xs"></i>
                                <input
                                    type="text"
                                    className="w-full pl-8 pr-3 py-2 bg-[#F4F0E8] border border-[#DED7C8] rounded-[11px] text-xs text-[#1C1A17] outline-none"
                                    placeholder="Filter by Test ID, Serial Number, or Manufacturer..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="w-32">
                                <select className="w-full px-2.5 py-2 bg-[#F4F0E8] border border-[#DED7C8] rounded-[11px] text-xs text-[#1C1A17] outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                    <option value="">Status: All</option>
                                    <option value="PASS">PASS</option>
                                    <option value="FAIL">FAIL</option>
                                </select>
                            </div>

                            <div className="w-32">
                                <select className="w-full px-2.5 py-2 bg-[#F4F0E8] border border-[#DED7C8] rounded-[11px] text-xs text-[#1C1A17] outline-none" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                                    <option value="">Class: All</option>
                                    <option value="I">Class I</option>
                                    <option value="II">Class II</option>
                                    <option value="III">Class III</option>
                                    <option value="IIII">Class IIII</option>
                                </select>
                            </div>

                            <div className="w-36">
                                <input type="date" className="w-full px-2.5 py-2 bg-[#F4F0E8] border border-[#DED7C8] rounded-[11px] text-xs text-[#1C1A17] outline-none" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="tactile-raised p-0 overflow-hidden">
                        {loading ? (
                            <div className="p-4">
                                <SkeletonTable rows={6} cols={6} />
                            </div>
                        ) : filteredReports.length > 0 ? (
                            <table className="w-full text-xs m-0 border-0 rounded-none">
                                <thead>
                                    <tr>
                                        <th>Test ID</th>
                                        <th>Instrument</th>
                                        <th>Serial No.</th>
                                        <th>Date</th>
                                        <th>Workflow Stage</th>
                                        <th>Conformity</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map(r => {
                                        const dateObj = new Date(r.createdAt);
                                        const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                        const isRejected = ['REJECTED_BY_VIEWER', 'REJECTED_BY_ADMIN', 'SENT_BACK_TO_TESTER'].includes(r.workflow_status);

                                        return (
                                            <tr
                                                key={r._id}
                                                onClick={() => navigate(`/report/${r._id}`)}
                                                className={`cursor-pointer transition-colors ${isRejected ? 'bg-[#F5DDDC]/40 hover:bg-[#F5DDDC]/70' : 'hover:bg-[#EAE4D6]/50'}`}
                                            >
                                                <td><strong className="text-[#1C1A17] font-mono">TP-{r._id.substring(0, 8).toUpperCase()}</strong></td>
                                                <td>
                                                    <div className="font-bold text-[#1C1A17]">{r.instrument_id || "Unknown"}</div>
                                                    <span className="text-[10px] text-[#7A7469]">Class {r.accuracy_class}</span>
                                                </td>
                                                <td className="font-mono text-xs">{r.serial_no}</td>
                                                <td className="text-[#5C5852]">{dateStr}</td>
                                                <td>
                                                    <span className="bg-[#EAE4D6] border border-[#DED7C8] px-2.5 py-0.5 rounded-[11px] text-[10px] font-bold text-[#1C1A17] uppercase tracking-wider">
                                                        {r.workflow_status || 'SUBMITTED'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${r.status === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td onClick={e => e.stopPropagation()}>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            className="btn-secondary px-2.5 py-1 text-[11px] font-bold"
                                                            onClick={() => navigate(`/report/${r._id}`)}
                                                        >
                                                            Summary
                                                        </button>
                                                        {isRejected && (
                                                            <button 
                                                                className="btn px-2.5 py-1 text-[11px] font-bold"
                                                                onClick={(e) => handleReTest(r, e)}
                                                            >
                                                                Re-Test
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div className="text-center py-10 text-[#7A7469] text-xs">
                                No inspections match the specified filter criteria.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

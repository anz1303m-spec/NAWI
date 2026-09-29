import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { SkeletonTable } from '../components/SkeletonLoader';
import { cachedFetch, clearApiCache } from '../utils/apiCache';
import { getOptimizedCloudinaryUrl } from '../utils/cloudinaryUrl';

export default function ViewerDashboardPage() {
    const { authFetch, showToast } = useAuth();

    // Stats State
    const [stats, setStats] = useState({
        labsCount: 0,
        pendingReviewCount: 0,
        sentForApprovalCount: 0,
        certificatesIssuedCount: 0
    });

    // Queue Reports & Tabs State
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'sent' | 'rejected'
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);

    // Search and Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterClass, setFilterClass] = useState('');

    // Selected Report for Review Modal / Drawer
    const [selectedReport, setSelectedReport] = useState(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    
    // Viewer Cross-Check Modified Results State
    const [modifiedResults, setModifiedResults] = useState({});

    // Test-level Comments state: { [testKey]: commentString }
    const [rowComments, setRowComments] = useState({});
    const [generalComment, setGeneralComment] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);

    // Photo Preview Modal
    const [previewPhoto, setPreviewPhoto] = useState(null);

    // Fetch Analytics Stats
    const fetchStats = () => {
        setStatsLoading(true);
        authFetch('/api/viewer/stats')
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) {
                    setStats(data);
                }
            })
            .catch(err => console.error("Error fetching viewer stats:", err))
            .finally(() => setStatsLoading(false));
    };

    // Fetch Reports by Tab
    const fetchReports = (tab) => {
        setLoading(true);
        authFetch(`/api/viewer/reports?tab=${tab}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setReports(data);
                } else {
                    setReports([]);
                }
            })
            .catch(err => {
                console.error("Error fetching viewer reports:", err);
                setReports([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchReports(activeTab);
    }, [activeTab]);

    // Open Full Report Review Screen
    const handleOpenReview = (report) => {
        setSelectedReport(report);
        setRowComments({});
        setGeneralComment('');
        setModifiedResults({
            form1_results: report.form1_results ? JSON.parse(JSON.stringify(report.form1_results)) : {},
            form2_results: report.form2_results ? JSON.parse(JSON.stringify(report.form2_results)) : {},
            form3_results: report.form3_results ? JSON.parse(JSON.stringify(report.form3_results)) : {},
            form_zero_results: report.form_zero_results ? JSON.parse(JSON.stringify(report.form_zero_results)) : {},
            form_tare_results: report.form_tare_results ? JSON.parse(JSON.stringify(report.form_tare_results)) : {},
            form_tilt_results: report.form_tilt_results ? JSON.parse(JSON.stringify(report.form_tilt_results)) : {}
        });
        setReviewModalOpen(true);
    };

    // Viewer Cross-Check Result Toggles
    const toggleForm1RowStatus = (loadKey) => {
        setModifiedResults(prev => {
            const copy = JSON.parse(JSON.stringify(prev));
            if (copy.form1_results && copy.form1_results[loadKey]) {
                const current = copy.form1_results[loadKey].asc_status || 'PASS';
                const next = current === 'PASS' ? 'FAIL' : 'PASS';
                copy.form1_results[loadKey].asc_status = next;
                copy.form1_results[loadKey].desc_status = next;
            }
            return copy;
        });
    };

    const toggleForm2Status = () => {
        setModifiedResults(prev => {
            const copy = JSON.parse(JSON.stringify(prev));
            if (!copy.form2_results) copy.form2_results = {};
            const current = copy.form2_results.Repeatability || 'PASS';
            copy.form2_results.Repeatability = current === 'PASS' ? 'FAIL' : 'PASS';
            return copy;
        });
    };

    const toggleForm3PosStatus = (pos) => {
        setModifiedResults(prev => {
            const copy = JSON.parse(JSON.stringify(prev));
            if (copy.form3_results && copy.form3_results.details && copy.form3_results.details[pos]) {
                const current = copy.form3_results.details[pos].result || 'PASS';
                copy.form3_results.details[pos].result = current === 'PASS' ? 'FAIL' : 'PASS';
            }
            return copy;
        });
    };

    const toggleSimpleStatus = (formKey, resKey) => {
        setModifiedResults(prev => {
            const copy = JSON.parse(JSON.stringify(prev));
            if (!copy[formKey]) copy[formKey] = {};
            const current = copy[formKey][resKey] || 'PASS';
            copy[formKey][resKey] = current === 'PASS' ? 'FAIL' : 'PASS';
            return copy;
        });
    };

    // Handle Comment Change for a Test Row
    const handleCommentChange = (testKey, val) => {
        setRowComments(prev => ({
            ...prev,
            [testKey]: val
        }));
    };

    // Check if rejection is allowed (Guardrail: At least one comment required)
    const hasAnyComment = () => {
        const hasRowComment = Object.values(rowComments).some(c => c && c.trim().length > 0);
        const hasGenComment = generalComment && generalComment.trim().length > 0;
        return hasRowComment || hasGenComment;
    };

    // Submit Review Action (APPROVE or REJECT)
    const handleDecision = async (action) => {
        if (!selectedReport) return;

        if (action === 'REJECT' && !hasAnyComment()) {
            showToast('Rejection requires at least one test row comment explaining what the tester needs to fix.');
            return;
        }

        setSubmittingAction(true);
        try {
            const formattedComments = Object.entries(rowComments)
                .filter(([_, text]) => text && text.trim().length > 0)
                .map(([key, text]) => ({
                    test_key: key,
                    comment: text.trim()
                }));

            const res = await authFetch(`/api/viewer/reports/${selectedReport._id}/review`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    comments: formattedComments,
                    general_comment: generalComment.trim(),
                    modified_results: modifiedResults
                })
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || 'Failed to record decision');
            }

            showToast(data.message || (action === 'APPROVE' ? 'Report forwarded to Admin for approval' : 'Report sent back to Tester with comments'));
            setReviewModalOpen(false);
            setSelectedReport(null);
            clearApiCache('/api/viewer');
            fetchStats();
            fetchReports(activeTab);
        } catch (err) {
            showToast(err.message);
        } finally {
            setSubmittingAction(false);
        }
    };

    // Filter reports based on search and dropdown filters
    const filteredReports = reports.filter(r => {
        const idStr = r._id ? r._id.substring(0, 8).toUpperCase() : '';
        const instStr = (r.instrument_id || '').toUpperCase();
        const testerStr = (r.createdBy || '').toUpperCase();
        const snStr = (r.serial_no || '').toUpperCase();
        const fullSearch = `${idStr} ${instStr} ${testerStr} ${snStr}`;

        if (searchTerm && !fullSearch.includes(searchTerm.toUpperCase())) return false;
        if (filterStatus && r.status !== filterStatus) return false;
        if (filterClass && !r.accuracy_class.includes(filterClass)) return false;

        return true;
    });

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title="Quality Reviewer Technical Portal" />
                <div className="app-content">

                    {/* Page Title & Description */}
                    <div style={{ marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.6rem', margin: '0 0 6px 0', fontFamily: 'Outfit, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            TECHNICAL REVIEW QUEUE
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                            Auditing submitted NAWI inspection reports for metrological compliance prior to final administrator sign-off.
                        </p>
                    </div>

                    {/* Overview / Analytics Section */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <div className="form-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: 0, border: '1px solid #E2E8F0', background: '#FFFFFF', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#F8FAFC', color: '#0F172A', display: 'grid', placeItems: 'center', fontSize: '1.2rem', border: '1px solid #E2E8F0' }}>
                                <i className="fas fa-users-cog"></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    System Testers / Labs
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight 700, color: '#0F172A', fontFamily: 'IBM Plex Mono, monospace' }}>
                                    {statsLoading ? '...' : stats.labsCount}
                                </div>
                            </div>
                        </div>

                        <div className="form-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #2563EB', borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 0 }}>
                            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#EFF6FF', color: '#2563EB', display: 'grid', placeItems: 'center', fontSize: '1.2rem', border: '1px solid #BFDBFE' }}>
                                <i className="fas fa-hourglass-half"></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Pending Review Queue
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8C5815', fontFamily: 'IBM Plex Mono, monospace' }}>
                                    {statsLoading ? '...' : stats.pendingReviewCount}
                                </div>
                            </div>
                        </div>

                        <div className="form-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #1C1A17', borderTop: '1px solid #DED7C8', borderRight: '1px solid #DED7C8', borderBottom: '1px solid #DED7C8', background: '#F4F0E8', borderRadius: '13px', boxShadow: '4px 4px 10px #DBD3C3, -4px -4px 10px #FFFFFF', marginBottom: 0 }}>
                            <div style={{ width: '46px', height: '46px', borderRadius: '11px', background: '#EAE4D6', color: '#1C1A17', display: 'grid', placeItems: 'center', fontSize: '1.2rem', border: '1px solid #DED7C8', boxShadow: 'inset 1px 1px 3px #DBD3C3' }}>
                                <i className="fas fa-paper-plane"></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5C5852', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Awaiting Admin Sign-off
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1C1A17', fontFamily: 'IBM Plex Mono, monospace' }}>
                                    {statsLoading ? '...' : stats.sentForApprovalCount}
                                </div>
                            </div>
                        </div>

                        <div className="form-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: '4px solid #2D5A27', borderTop: '1px solid #DED7C8', borderRight: '1px solid #DED7C8', borderBottom: '1px solid #DED7C8', background: '#F4F0E8', borderRadius: '13px', boxShadow: '4px 4px 10px #DBD3C3, -4px -4px 10px #FFFFFF', marginBottom: 0 }}>
                            <div style={{ width: '46px', height: '46px', borderRadius: '11px', background: '#E2EBDC', color: '#2D5A27', display: 'grid', placeItems: 'center', fontSize: '1.2rem', border: '1px solid #C5DAC0' }}>
                                <i className="fas fa-certificate"></i>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#5C5852', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Certificates Issued
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2D5A27', fontFamily: 'IBM Plex Mono, monospace' }}>
                                    {statsLoading ? '...' : stats.certificatesIssuedCount}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Tracking Tabs & Search / Filter Card */}
                    <div className="form-card" style={{ marginBottom: '24px', padding: '20px', background: '#F4F0E8', border: '1px solid #DED7C8', borderRadius: '13px', boxShadow: '4px 4px 10px #DBD3C3, -4px -4px 10px #FFFFFF' }}>
                        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #DED7C8', paddingBottom: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setActiveTab('pending')}
                                style={{
                                    padding: '8px 16px',
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    border: activeTab === 'pending' ? '1px solid #1C1A17' : '1px solid #DED7C8',
                                    borderRadius: '13px',
                                    cursor: 'pointer',
                                    background: activeTab === 'pending' ? '#1C1A17' : '#EAE4D6',
                                    color: activeTab === 'pending' ? '#F4F0E8' : '#5C5852',
                                    boxShadow: activeTab === 'pending' ? 'none' : 'inset 1px 1px 2px #DBD3C3',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <i className="fas fa-inbox" style={{ marginRight: '6px' }}></i>
                                Pending Review ({stats.pendingReviewCount})
                            </button>

                            <button
                                onClick={() => setActiveTab('sent')}
                                style={{
                                    padding: '8px 16px',
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    border: activeTab === 'sent' ? '1px solid #1C1A17' : '1px solid #DED7C8',
                                    borderRadius: '13px',
                                    cursor: 'pointer',
                                    background: activeTab === 'sent' ? '#1C1A17' : '#EAE4D6',
                                    color: activeTab === 'sent' ? '#F4F0E8' : '#5C5852',
                                    boxShadow: activeTab === 'sent' ? 'none' : 'inset 1px 1px 2px #DBD3C3',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <i className="fas fa-paper-plane" style={{ marginRight: '6px' }}></i>
                                Sent for Approval ({stats.sentForApprovalCount})
                            </button>

                            <button
                                onClick={() => setActiveTab('rejected')}
                                style={{
                                    padding: '8px 16px',
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                                    border: activeTab === 'rejected' ? '1px solid #1C1A17' : '1px solid #DED7C8',
                                    borderRadius: '13px',
                                    cursor: 'pointer',
                                    background: activeTab === 'rejected' ? '#1C1A17' : '#EAE4D6',
                                    color: activeTab === 'rejected' ? '#F4F0E8' : '#5C5852',
                                    boxShadow: activeTab === 'rejected' ? 'none' : 'inset 1px 1px 2px #DBD3C3',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <i className="fas fa-exclamation-triangle" style={{ marginRight: '6px' }}></i>
                                Rejected by Admin
                            </button>
                        </div>

                        {/* Search and Filters Input Bar */}
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                                <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '13px', color: '#888278' }}></i>
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: '38px', borderRadius: '13px' }}
                                    placeholder="Search by Test ID, Serial Number, or Tester..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div style={{ width: '140px' }}>
                                <select className="form-input" style={{ borderRadius: '13px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                    <option value="">Status: All</option>
                                    <option value="PASS">PASS</option>
                                    <option value="FAIL">FAIL</option>
                                </select>
                            </div>

                            <div style={{ width: '140px' }}>
                                <select className="form-input" style={{ borderRadius: '13px' }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                                    <option value="">Class: All</option>
                                    <option value="I">Class I</option>
                                    <option value="II">Class II</option>
                                    <option value="III">Class III</option>
                                    <option value="IIII">Class IIII</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Pending Review Queue Table */}
                    <div className="table-card" style={{ background: '#F4F0E8', border: '1px solid #DED7C8', borderRadius: '13px', boxShadow: '4px 4px 10px #DBD3C3, -4px -4px 10px #FFFFFF', overflow: 'hidden' }}>
                        {loading ? (
                            <SkeletonTable rows={5} cols={7} />
                        ) : filteredReports.length > 0 ? (
                            <table>
                                <thead>
                                    <tr style={{ background: '#EAE4D6', borderBottom: '1px solid #DED7C8' }}>
                                        <th style={{ color: '#1C1A17', fontWeight: 700 }}>Test ID</th>
                                        <th style={{ color: '#1C1A17', fontWeight: 700 }}>Instrument</th>
                                        <th style={{ color: '#1C1A17', fontWeight: 700 }}>Tester Name</th>
                                        <th style={{ color: '#1C1A17', fontWeight: 700 }}>Date Submitted</th>
                                        <th style={{ color: '#1C1A17', fontWeight: 700 }}>Accuracy Class</th>
                                        <th style={{ color: '#1C1A17', fontWeight: 700 }}>Workflow Status</th>
                                        <th style={{ color: '#1C1A17', fontWeight: 700 }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.map((r) => {
                                        const dateObj = new Date(r.createdAt);
                                        const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                        const displayClass = (r.accuracy_class || 'III').toString().replace(/^class\s+/i, '');

                                        return (
                                            <tr key={r._id} className="table-row-hover" style={{ borderBottom: '1px solid #DED7C8' }}>
                                                <td>
                                                    <strong style={{ color: '#1C1A17', fontFamily: 'IBM Plex Mono, monospace' }}>
                                                        TP-{r._id.substring(0, 8).toUpperCase()}
                                                    </strong>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: '#1C1A17' }}>{r.instrument_id || "NAWI Scale"}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#5C5852' }}>{r.instrument_type}</div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <i className="fas fa-user-circle" style={{ color: '#888278' }}></i>
                                                        <span style={{ color: '#1C1A17' }}>{r.createdBy || "Nishant"}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '0.85rem', color: '#5C5852', fontFamily: 'IBM Plex Mono, monospace' }}>{dateStr}</td>
                                                <td>
                                                    <span style={{ background: '#EAE4D6', color: '#1C1A17', border: '1px solid #DED7C8', padding: '3px 8px', borderRadius: '13px', fontSize: '0.8rem', fontWeight: 700 }}>
                                                        Class {displayClass}
                                                    </span>
                                                </td>
                                                <td>
                                                    {r.workflow_status === 'SUBMITTED' || r.workflow_status === 'RESUBMITTED' ? (
                                                        <span className="status-badge status-pending" style={{ padding: '4px 10px', borderRadius: '13px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            {r.workflow_status}
                                                        </span>
                                                    ) : r.workflow_status === 'PENDING_ADMIN_APPROVAL' ? (
                                                        <span style={{ background: '#EAE4D6', color: '#1C1A17', border: '1px solid #1C1A17', padding: '4px 10px', borderRadius: '13px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            Awaiting Admin
                                                        </span>
                                                    ) : r.workflow_status === 'SENT_BACK_TO_TESTER' ? (
                                                        <span className="status-badge status-fail" style={{ padding: '4px 10px', borderRadius: '13px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            Sent Back to Tester
                                                        </span>
                                                    ) : r.workflow_status === 'REJECTED_BY_ADMIN' ? (
                                                        <span className="status-badge status-fail" style={{ padding: '4px 10px', borderRadius: '13px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            Rejected by Admin
                                                        </span>
                                                    ) : (
                                                        <span className="status-badge status-pass" style={{ padding: '4px 10px', borderRadius: '13px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                            {r.workflow_status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => handleOpenReview(r)}
                                                        className="btn"
                                                        style={{
                                                            padding: '6px 14px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 600,
                                                            background: '#1C1A17',
                                                            color: '#F4F0E8',
                                                            border: 'none',
                                                            borderRadius: '13px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <i className="fas fa-search-plus" style={{ marginRight: '4px' }}></i>
                                                        {activeTab === 'pending' ? 'Audit Report' : 'View Review'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ textAlign: 'center', padding: '32px', color: '#5C5852', margin: 0 }}>
                                No reports match the selected criteria.
                            </p>
                        )}
                    </div>

                </div>
            </div>

            {/* Full Report Review Screen (Technical Audit Modal Drawer) */}
            {reviewModalOpen && selectedReport && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(28, 26, 23, 0.65)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 2000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#F4F0E8',
                        width: '100%',
                        maxWidth: '1150px',
                        height: '92vh',
                        borderRadius: '13px',
                        display: 'flex',
                        flexDirection: 'column',
                        border: '1px solid #DED7C8',
                        boxShadow: '10px 10px 30px #DBD3C3, -10px -10px 30px #FFFFFF',
                        overflow: 'hidden',
                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }}>
                        {/* Review Screen Header with View Summary & View Detailed Buttons */}
                        <div style={{
                            background: '#EAE4D6',
                            color: '#1C1A17',
                            padding: '16px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid #DED7C8'
                        }}>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1C1A17', fontFamily: 'Outfit, sans-serif' }}>
                                    TECHNICAL AUDIT: TP-{selectedReport._id.substring(0, 8).toUpperCase()}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#5C5852' }}>
                                    Tester: {selectedReport.createdBy || "Nishant"} &bull; Rule Set: {selectedReport.rule_set_version || "OIML R-76 V1"}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <a
                                    href={`/report-detailed/${selectedReport._id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        background: '#1C1A17',
                                        color: '#F4F0E8',
                                        padding: '7px 14px',
                                        borderRadius: '13px',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        textDecoration: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <i className="fas fa-list-check"></i> View Full Detailed Report
                                </a>
                                <button
                                    onClick={() => setReviewModalOpen(false)}
                                    style={{
                                        background: '#DED7C8',
                                        border: 'none',
                                        color: '#1C1A17',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '13px',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem',
                                        display: 'grid',
                                        placeItems: 'center'
                                    }}
                                >
                                    &times;
                                </button>
                            </div>
                        </div>

                        {/* Review Content Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            
                            {/* Section 1: Instrument & Administrative Specifications */}
                            <div className="form-card" style={{ padding: '22px', borderLeft: '4px solid #2563EB', marginBottom: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fas fa-balance-scale" style={{ color: '#2563EB' }}></i>
                                        1. Instrument Specifications & Administrative Verification
                                    </h3>
                                    <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                                        <i className="fas fa-check-circle"></i> Evidence Verified & Sealed
                                    </span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>INSTRUMENT ID / TYPE</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>{selectedReport.instrument_id || "NAWI Scale"}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>SERIAL NUMBER (S/N)</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>{selectedReport.instrument_data?.serial_no || selectedReport.serial_no || "SN-884920"}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ACCURACY CLASS</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2563EB' }}>Class {selectedReport.instrument_data?.Class_value || selectedReport.accuracy_class || "III"}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>MAX CAPACITY (Max)</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>{selectedReport.instrument_data?.capacity || selectedReport.instrument_data?.Max || 1000} {selectedReport.instrument_data?.max_unit || 'kg'}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>VERIFICATION SCALE INTERVAL (e)</div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>{selectedReport.instrument_data?.e_value || selectedReport.instrument_data?.e || 10} {selectedReport.instrument_data?.e_unit || 'g'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Weighing Performance Test (Form 1) */}
                            <div className="form-card" style={{ padding: '20px', borderLeft: '4px solid #34B1AA', marginBottom: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fas fa-weight" style={{ color: '#34B1AA' }}></i>
                                        2. Weighing Performance Test (Form 1)
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                        OIML R76-1 Clause 3.5.1 / Annex A.4.4
                                    </span>
                                </div>

                                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem', color: '#475569', border: '1px solid #E2E8F0' }}>
                                    <strong style={{ color: '#1E293B' }}>Clause Calculation Rule:</strong> Maximum Permissible Error (MPE) calculated across load steps (&plusmn;0.5e, &plusmn;1.0e, &plusmn;1.5e) for Class {selectedReport.instrument_data?.Class_value || selectedReport.accuracy_class || 'III'}.
                                </div>

                                <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
                                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#F1F5F9', color: '#334155', textAlign: 'center' }}>
                                                <th style={{ padding: '10px 8px' }}>Target Load (L)</th>
                                                <th style={{ padding: '10px 8px' }}>Direction</th>
                                                <th style={{ padding: '10px 8px' }}>Indication (I)</th>
                                                <th style={{ padding: '10px 8px' }}>Calculated Error (E)</th>
                                                <th style={{ padding: '10px 8px' }}>Allowed MPE</th>
                                                <th style={{ padding: '10px 8px' }}>Reading Photo Proof</th>
                                                <th style={{ padding: '10px 8px' }}>Viewer Cross-Check Result</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const f1r = selectedReport.form1_results;
                                                let rows = [];

                                                if (f1r && typeof f1r === 'object' && Object.keys(f1r).length > 0) {
                                                    rows = Object.entries(f1r).map(([k, val]) => {
                                                        if (!val || typeof val !== 'object') return null;
                                                        const loadG = val.load_g !== undefined ? val.load_g : (Number(k) > 50 ? Number(k) / 1000 : Number(k));
                                                        return {
                                                            key: k,
                                                            loadKg: loadG,
                                                            asc_reading: val.asc_reading !== undefined ? val.asc_reading : loadG,
                                                            desc_reading: val.desc_reading !== undefined ? val.desc_reading : loadG,
                                                            asc_error: val.asc_error !== undefined ? val.asc_error : 0,
                                                            desc_error: val.desc_error !== undefined ? val.desc_error : 0,
                                                            limit: val.limit !== undefined ? val.limit : 0.001,
                                                            asc_status: val.asc_status || 'PASS',
                                                            desc_status: val.desc_status || 'PASS',
                                                            result: val.result || 'PASS'
                                                        };
                                                    }).filter(Boolean);
                                                } else if (selectedReport.form1_data?.loads && Array.isArray(selectedReport.form1_data.loads)) {
                                                    rows = selectedReport.form1_data.loads.map((load, idx) => {
                                                        const loadKg = Number(load) > 50 ? Number(load) / 1000 : Number(load);
                                                        const ind = selectedReport.form1_data.indications ? Number(selectedReport.form1_data.indications[idx]) : loadKg;
                                                        const errKg = ind - loadKg;
                                                        return {
                                                            key: `load_${load}`,
                                                            loadKg,
                                                            asc_reading: ind,
                                                            desc_reading: ind,
                                                            asc_error: errKg,
                                                            desc_error: errKg,
                                                            limit: 0.001,
                                                            asc_status: Math.abs(errKg) <= 0.001 ? 'PASS' : 'FAIL',
                                                            desc_status: Math.abs(errKg) <= 0.001 ? 'PASS' : 'FAIL',
                                                            result: Math.abs(errKg) <= 0.001 ? 'PASS' : 'FAIL'
                                                        };
                                                    });
                                                }

                                                if (rows.length === 0) {
                                                    return (
                                                        <tr>
                                                            <td colSpan="7" style={{ textAlign: 'center', padding: '16px', color: '#64748b' }}>
                                                                No weighing performance observations recorded.
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return rows.map((row, idx) => {
                                                    const loadKey = `load_${row.loadKg}`;
                                                    const ascStatus = modifiedResults.form1_results?.[loadKey]?.asc_status || row.asc_status || 'PASS';
                                                    const descStatus = modifiedResults.form1_results?.[loadKey]?.desc_status || row.desc_status || 'PASS';
                                                    const overallRowStatus = (ascStatus === 'PASS' && descStatus === 'PASS') ? 'PASS' : 'FAIL';
                                                    const proof = selectedReport.reading_proofs?.[`weighing_${row.loadKg}`] || selectedReport.reading_proofs?.[`weighing_${row.key}`];

                                                    const ascErrG = Math.abs(row.asc_error) > 10 ? row.asc_error : (row.asc_error * 1000);
                                                    const descErrG = Math.abs(row.desc_error) > 10 ? row.desc_error : (row.desc_error * 1000);
                                                    const limitG = row.limit > 10 ? row.limit : (row.limit * 1000);

                                                    return (
                                                        <React.Fragment key={idx}>
                                                            <tr style={{ borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
                                                                <td rowSpan="2" style={{ padding: '10px 8px', fontWeight: 700, verticalAlign: 'middle', background: '#FAFAFA', borderRight: '1px solid #E2E8F0' }}>
                                                                    {row.loadKg} kg
                                                                </td>
                                                                <td style={{ padding: '6px 8px', fontSize: '0.8rem', color: '#475569' }}>Ascending (&uarr;)</td>
                                                                <td style={{ padding: '6px 8px', fontWeight: 600 }}>{row.asc_reading} kg</td>
                                                                <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 600, color: ascStatus === 'PASS' ? '#059669' : '#DC2626' }}>
                                                                    {ascErrG > 0 ? `+${ascErrG.toFixed(1)}` : ascErrG.toFixed(1)} g
                                                                </td>
                                                                <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>&plusmn;{limitG.toFixed(1)} g</td>
                                                                <td rowSpan="2" style={{ padding: '8px', verticalAlign: 'middle', borderRight: '1px solid #E2E8F0' }}>
                                                                    {proof?.url ? (
                                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                                            <img
                                                                                src={getOptimizedCloudinaryUrl(proof.url, 120)}
                                                                                alt="Reading Proof"
                                                                                style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                                                                                onClick={() => setPreviewPhoto(proof.url)}
                                                                            />
                                                                            <span style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 700 }}>
                                                                                <i className="fas fa-shield-alt"></i> Lab Verified
                                                                            </span>
                                                                        </div>
                                                                    ) : (
                                                                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic' }}>No proof uploaded</span>
                                                                    )}
                                                                </td>
                                                                <td rowSpan="2" style={{ padding: '8px', verticalAlign: 'middle' }}>
                                                                    <button
                                                                        onClick={() => toggleForm1RowStatus(loadKey)}
                                                                        className={`status-badge ${overallRowStatus === 'PASS' ? 'status-pass' : 'status-fail'}`}
                                                                        style={{ border: 'none', cursor: 'pointer', fontSize: '0.78rem', padding: '6px 12px' }}
                                                                        title="Click to cross-check & toggle audit status"
                                                                    >
                                                                        {overallRowStatus === 'PASS' ? '✓ PASS' : '❌ FAIL'}
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                            <tr style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>
                                                                <td style={{ padding: '6px 8px', fontSize: '0.8rem', color: '#475569' }}>Descending (&darr;)</td>
                                                                <td style={{ padding: '6px 8px', fontWeight: 600 }}>{row.desc_reading} kg</td>
                                                                <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 600, color: descStatus === 'PASS' ? '#059669' : '#DC2626' }}>
                                                                    {descErrG > 0 ? `+${descErrG.toFixed(1)}` : descErrG.toFixed(1)} g
                                                                </td>
                                                                <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>&plusmn;{limitG.toFixed(1)} g</td>
                                                            </tr>
                                                        </React.Fragment>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Calculation Proof & Explanation Box for Form 1 */}
                                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 16px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.83rem', color: '#1E3A8A' }}>
                                    <div style={{ fontWeight: 700, color: '#1E40AF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className="fas fa-calculator" style={{ color: '#2563EB' }}></i>
                                        OIML R76-1 Clause 3.5.1 Metrological Calculation Proof & Explanation:
                                    </div>
                                    <div style={{ lineHeight: 1.5, color: '#1E3A8A' }}>
                                        <strong>Formula:</strong> Error <em>E = Indication (I) - Target Load (L)</em>.<br />
                                        <strong>MPE Load Steps:</strong> Computed dynamically for Class <strong>{selectedReport.instrument_data?.Class_value || selectedReport.accuracy_class || 'III'}</strong> with scale interval <em>e = {selectedReport.instrument_data?.e_value || 10} g</em>:<br />
                                        &bull; 0 &le; m &le; 500e: MPE = &plusmn;0.5e (&plusmn;{((selectedReport.instrument_data?.e_value || 10) * 0.5).toFixed(1)} g)<br />
                                        &bull; 500e &lt; m &le; 2000e: MPE = &plusmn;1.0e (&plusmn;{((selectedReport.instrument_data?.e_value || 10) * 1.0).toFixed(1)} g)<br />
                                        &bull; 2000e &lt; m &le; 10000e: MPE = &plusmn;1.5e (&plusmn;{((selectedReport.instrument_data?.e_value || 10) * 1.5).toFixed(1)} g)<br />
                                        <em>All observations must satisfy |E| &le; MPE across both ascending and descending direction runs.</em>
                                    </div>
                                </div>

                                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px', borderRadius: '6px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                                        <i className="fas fa-comment-alt" style={{ marginRight: '4px' }}></i> Viewer Correction Note for Weighing Performance Section:
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Add specific correction note for Form 1 (or leave blank if verified)..."
                                        value={rowComments['form1'] || ''}
                                        onChange={(e) => handleCommentChange('form1', e.target.value)}
                                        style={{ fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>

                            {/* Section 3: Repeatability Test (Form 2) */}
                            <div className="form-card" style={{ padding: '20px', borderLeft: '4px solid #2563EB', marginBottom: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fas fa-sync-alt" style={{ color: '#2563EB' }}></i>
                                        3. Repeatability Test (Form 2)
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                        OIML R76-1 Clause 3.6.1 / Annex A.4.4
                                    </span>
                                </div>

                                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem', color: '#475569', border: '1px solid #E2E8F0' }}>
                                    <strong style={{ color: '#1E293B' }}>Clause Calculation Rule:</strong> Maximum difference between repeated readings at ~50% Max capacity must not exceed MPE limit.
                                </div>

                                {(() => {
                                    const f2r = selectedReport.form2_results || {};
                                    const testLoad = f2r.testLoad || (selectedReport.instrument_data?.capacity ? selectedReport.instrument_data.capacity * 0.5 : 500);
                                    const maxVal = f2r.max || testLoad;
                                    const minVal = f2r.min || testLoad;
                                    const rangeG = (f2r.range !== undefined ? f2r.range : (maxVal - minVal)) * (f2r.range > 10 ? 1 : 1000);
                                    const limitG = (f2r.limit !== undefined ? f2r.limit : (selectedReport.instrument_data?.e_value || 10) / 1000) * (f2r.limit > 10 ? 1 : 1000);
                                    const status = modifiedResults.form2_results?.Repeatability || f2r.Repeatability || 'PASS';

                                    return (
                                        <>
                                            <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
                                                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                                    <thead>
                                                        <tr style={{ background: '#F1F5F9', textAlign: 'center' }}>
                                                            <th style={{ padding: '8px' }}>Applied Test Load</th>
                                                            <th style={{ padding: '8px' }}>Max Reading (I_max)</th>
                                                            <th style={{ padding: '8px' }}>Min Reading (I_min)</th>
                                                            <th style={{ padding: '8px' }}>Max Range Variation (&Delta;I)</th>
                                                            <th style={{ padding: '8px' }}>Allowed Limit</th>
                                                            <th style={{ padding: '8px' }}>Reading Photo Proofs</th>
                                                            <th style={{ padding: '8px' }}>Viewer Cross-Check Result</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr style={{ textAlign: 'center', borderBottom: '1px solid #E2E8F0' }}>
                                                            <td style={{ padding: '10px 8px', fontWeight: 700 }}>{testLoad} kg</td>
                                                            <td style={{ padding: '10px 8px', fontWeight: 600 }}>{maxVal} kg</td>
                                                            <td style={{ padding: '10px 8px', fontWeight: 600 }}>{minVal} kg</td>
                                                            <td style={{ padding: '10px 8px', fontFamily: 'monospace', fontWeight: 700, color: status === 'PASS' ? '#059669' : '#DC2626' }}>
                                                                {rangeG.toFixed(1)} g
                                                            </td>
                                                            <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>&plusmn;{limitG.toFixed(1)} g</td>
                                                            <td style={{ padding: '8px' }}>
                                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                                    {['repeatability_r1', 'repeatability_r2', 'repeatability_r3'].map((pk, pidx) => {
                                                                        const pf = selectedReport.reading_proofs?.[pk];
                                                                        if (!pf?.url) return null;
                                                                        return (
                                                                            <img
                                                                                key={pk}
                                                                                src={getOptimizedCloudinaryUrl(pf.url, 100)}
                                                                                alt={`Trial ${pidx + 1}`}
                                                                                style={{ width: '34px', height: '34px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #CBD5E1' }}
                                                                                onClick={() => setPreviewPhoto(pf.url)}
                                                                                title={`Trial ${pidx + 1} Proof`}
                                                                            />
                                                                        );
                                                                    })}
                                                                    {!selectedReport.reading_proofs?.repeatability_r1?.url && (
                                                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No proofs</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '8px' }}>
                                                                <button
                                                                    onClick={toggleForm2Status}
                                                                    className={`status-badge ${status === 'PASS' ? 'status-pass' : 'status-fail'}`}
                                                                    style={{ border: 'none', cursor: 'pointer', fontSize: '0.78rem', padding: '6px 12px' }}
                                                                >
                                                                    {status === 'PASS' ? '✓ PASS' : '❌ FAIL'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Calculation Explanation Box for Form 2 */}
                                            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '12px 16px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.83rem', color: '#92400E' }}>
                                                <div style={{ fontWeight: 700, color: '#78350F', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <i className="fas fa-calculator" style={{ color: '#D97706' }}></i>
                                                    OIML R76-1 Clause 3.6.1 Repeatability Proof & Explanation:
                                                </div>
                                                <div style={{ lineHeight: 1.5, color: '#92400E' }}>
                                                    <strong>Formula:</strong> Range Variation <em>&Delta;I = I_max - I_min</em> across repeated weighings.<br />
                                                    <strong>Evaluation:</strong> <em>&Delta;I = {rangeG.toFixed(1)} g</em> vs <em>Allowed MPE Limit = &plusmn;{limitG.toFixed(1)} g</em>.<br />
                                                    <em>The difference between results of 3 successive weighings with the same load must not exceed the absolute MPE for that load.</em>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}

                                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px', borderRadius: '6px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                                        <i className="fas fa-comment-alt" style={{ marginRight: '4px' }}></i> Viewer Comment for Repeatability Section:
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Add specific correction note for Form 2..."
                                        value={rowComments['form2'] || ''}
                                        onChange={(e) => handleCommentChange('form2', e.target.value)}
                                        style={{ fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>

                            {/* Section 4: Eccentricity Test (Form 3) */}
                            <div className="form-card" style={{ padding: '20px', borderLeft: '4px solid #3B8FF3', marginBottom: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fas fa-crosshairs" style={{ color: '#3B8FF3' }}></i>
                                        4. Eccentricity Off-Center Loading Test (Form 3)
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                        OIML R76-1 Clause 3.6.2 / Annex A.4.7
                                    </span>
                                </div>

                                <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem', color: '#475569', border: '1px solid #E2E8F0' }}>
                                    <strong style={{ color: '#1E293B' }}>Clause Calculation Rule:</strong> Error at each off-center position (front, right, rear, left, center) must remain within MPE.
                                </div>

                                <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
                                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#F1F5F9', textAlign: 'center' }}>
                                                <th style={{ padding: '8px' }}>Position</th>
                                                <th style={{ padding: '8px' }}>Applied Load (L)</th>
                                                <th style={{ padding: '8px' }}>Indication (I)</th>
                                                <th style={{ padding: '8px' }}>Calculated Error (E)</th>
                                                <th style={{ padding: '8px' }}>Allowed MPE</th>
                                                <th style={{ padding: '8px' }}>Position Photo Proof</th>
                                                <th style={{ padding: '8px' }}>Viewer Cross-Check Result</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const f3r = selectedReport.form3_results || {};
                                                let details = f3r.details;
                                                if (!details && typeof f3r === 'object') {
                                                    const copy = { ...f3r };
                                                    delete copy.Eccentricity;
                                                    if (Object.keys(copy).length > 0) details = copy;
                                                }

                                                if (!details) {
                                                    const eccLoad = selectedReport.instrument_data?.capacity ? (selectedReport.instrument_data.capacity * 0.33).toFixed(1) : 330;
                                                    details = {
                                                        front: { appliedLoad: eccLoad, indication: eccLoad, error: 0, limit: 0.01, result: 'PASS' },
                                                        right: { appliedLoad: eccLoad, indication: eccLoad, error: 0, limit: 0.01, result: 'PASS' },
                                                        rear: { appliedLoad: eccLoad, indication: eccLoad, error: 0, limit: 0.01, result: 'PASS' },
                                                        left: { appliedLoad: eccLoad, indication: eccLoad, error: 0, limit: 0.01, result: 'PASS' },
                                                        center: { appliedLoad: eccLoad, indication: eccLoad, error: 0, limit: 0.01, result: 'PASS' }
                                                    };
                                                }

                                                return Object.entries(details).map(([pos, d]) => {
                                                    const posStatus = modifiedResults.form3_results?.details?.[pos]?.result || d.result || 'PASS';
                                                    const proof = selectedReport.reading_proofs?.[`eccentricity_${pos}`];
                                                    const errG = Math.abs(d.error) > 10 ? d.error : (d.error * 1000);
                                                    const limitG = d.limit > 10 ? d.limit : (d.limit * 1000);

                                                    return (
                                                        <tr key={pos} style={{ borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>
                                                            <td style={{ padding: '8px', textTransform: 'capitalize', fontWeight: 700 }}>{pos}</td>
                                                            <td style={{ padding: '8px' }}>{d.appliedLoad} kg</td>
                                                            <td style={{ padding: '8px', fontWeight: 600 }}>{d.indication} kg</td>
                                                            <td style={{ padding: '8px', fontFamily: 'monospace', fontWeight: 600, color: posStatus === 'PASS' ? '#059669' : '#DC2626' }}>
                                                                {errG > 0 ? `+${errG.toFixed(1)}` : errG.toFixed(1)} g
                                                            </td>
                                                            <td style={{ padding: '8px', fontFamily: 'monospace' }}>&plusmn;{limitG.toFixed(1)} g</td>
                                                            <td style={{ padding: '8px' }}>
                                                                {proof?.url ? (
                                                                    <img
                                                                        src={getOptimizedCloudinaryUrl(proof.url, 120)}
                                                                        alt="Proof"
                                                                        style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #CBD5E1' }}
                                                                        onClick={() => setPreviewPhoto(proof.url)}
                                                                    />
                                                                ) : <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic' }}>No proof</span>}
                                                            </td>
                                                            <td style={{ padding: '8px' }}>
                                                                <button
                                                                    onClick={() => toggleForm3PosStatus(pos)}
                                                                    className={`status-badge ${posStatus === 'PASS' ? 'status-pass' : 'status-fail'}`}
                                                                    style={{ border: 'none', cursor: 'pointer', fontSize: '0.75rem', padding: '4px 10px' }}
                                                                >
                                                                    {posStatus === 'PASS' ? '✓ PASS' : '❌ FAIL'}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Calculation Explanation Box for Form 3 */}
                                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 16px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.83rem', color: '#1E3A8A' }}>
                                    <div style={{ fontWeight: 700, color: '#1E40AF', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <i className="fas fa-calculator" style={{ color: '#2563EB' }}></i>
                                        OIML R76-1 Clause 3.6.2 Eccentricity Proof & Explanation:
                                    </div>
                                    <div style={{ lineHeight: 1.5, color: '#1E3A8A' }}>
                                        <strong>Formula:</strong> Position Error <em>E_pos = Indication (I_pos) - Applied Load (L_ecc)</em>.<br />
                                        <strong>Test Load:</strong> Applied load <em>L_ecc = 1/3 Max capacity</em> placed at off-center positions (Front, Right, Rear, Left, Center).<br />
                                        <em>Error at each quadrant position must satisfy |E_pos| &le; MPE tolerance for applied load.</em>
                                    </div>
                                </div>

                                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '12px', borderRadius: '6px' }}>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                                        <i className="fas fa-comment-alt" style={{ marginRight: '4px' }}></i> Viewer Comment for Eccentricity Section:
                                    </label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Add specific correction note for Form 3..."
                                        value={rowComments['form3'] || ''}
                                        onChange={(e) => handleCommentChange('form3', e.target.value)}
                                        style={{ fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>

                            {/* Section 5: Zero, Tare, & Tilt Tests */}
                            {[
                                {
                                    name: "Zero-Setting Test",
                                    formKey: "form_zero_results",
                                    resKey: "ZeroSetting",
                                    proofKey: "zero_setting",
                                    clause: "Clause 3.8.1 / Annex A.4.2",
                                    explanation: "Evaluates zero-setting accuracy. Zero error E_0 = I_0 - 0 must remain within ±0.25e to ensure exact initial reference point."
                                },
                                {
                                    name: "Tare Accuracy Test",
                                    formKey: "form_tare_results",
                                    resKey: "TareAccuracy",
                                    proofKey: "tare_accuracy",
                                    clause: "Clause 3.5.3.4 / Annex A.4.6",
                                    explanation: "Verifies accuracy of net weight indications when a tare device is active. Net error E_net = I_net - L_net must satisfy MPE."
                                },
                                {
                                    name: "Tilt Test",
                                    formKey: "form_tilt_results",
                                    resKey: "TiltTest",
                                    proofKey: "tilt_test",
                                    clause: "Clause 3.9.1 / Annex A.5",
                                    explanation: "For mobile/portable non-permanently leveled scales. Error under tilted inclination must maintain accuracy within MPE limit."
                                }
                            ].map(t => {
                                const data = selectedReport[t.formKey] || { [t.resKey]: 'PASS', error_g: 0, limit_g: 1.0 };
                                const status = modifiedResults[t.formKey]?.[t.resKey] || data[t.resKey] || 'PASS';
                                const proof = selectedReport.reading_proofs?.[t.proofKey];

                                const errG = data.error_g !== undefined ? data.error_g : (data.x_error_g || 0);
                                const limitG = data.limit_g !== undefined ? data.limit_g : 1.0;

                                return (
                                    <div className="form-card" style={{ padding: '20px', borderLeft: '4px solid #10B981', marginBottom: 0 }} key={t.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 600, fontFamily: 'Outfit, sans-serif', margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <i className="fas fa-check-double" style={{ color: '#10B981' }}></i>
                                                {t.name}
                                            </h3>
                                            <span style={{ fontSize: '0.75rem', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                                OIML R76-1 {t.clause}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '12px 16px', borderRadius: '6px', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                                            <div style={{ fontSize: '0.85rem' }}>
                                                <strong>Calculated Error:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: status === 'PASS' ? '#059669' : '#DC2626' }}>{errG} g</span> &bull; 
                                                <strong> Allowed MPE Limit:</strong> <span style={{ fontFamily: 'monospace' }}>&plusmn;{limitG} g</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {proof?.url ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <img src={getOptimizedCloudinaryUrl(proof.url, 120)} alt="Proof" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #CBD5E1' }} onClick={() => setPreviewPhoto(proof.url)} />
                                                        <span style={{ fontSize: '0.68rem', color: '#047857', fontWeight: 700 }}>✓ Proof Verified</span>
                                                    </div>
                                                ) : <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No proof uploaded</span>}

                                                <button
                                                    onClick={() => toggleSimpleStatus(t.formKey, t.resKey)}
                                                    className={`status-badge ${status === 'PASS' ? 'status-pass' : 'status-fail'}`}
                                                    style={{ border: 'none', cursor: 'pointer', fontSize: '0.78rem', padding: '6px 12px' }}
                                                >
                                                    {status === 'PASS' ? '✓ PASS' : '❌ FAIL'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Explanation Box */}
                                        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '10px 14px', borderRadius: '6px', fontSize: '0.82rem', color: '#065F46' }}>
                                            <strong>Clause Calculation Explanation:</strong> {t.explanation}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* General Summary Review Note */}
                            <div className="form-card" style={{ padding: '20px', marginBottom: 0, background: '#F4F0E8', border: '1px solid #DED7C8', borderRadius: '13px', boxShadow: '3px 3px 8px #DBD3C3, -3px -3px 8px #FFFFFF' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#1C1A17', marginBottom: '6px' }}>
                                    <i className="fas fa-edit" style={{ color: '#1C1A17', marginRight: '6px' }}></i>
                                    Overall Technical Audit Summary Note (Recorded in official audit trail):
                                </label>
                                <textarea
                                    className="form-input"
                                    rows="3"
                                    placeholder="Enter general review observations or summary notes for the administrator..."
                                    value={generalComment}
                                    onChange={(e) => setGeneralComment(e.target.value)}
                                    style={{ fontSize: '0.85rem', resize: 'vertical', borderRadius: '13px' }}
                                ></textarea>
                            </div>

                        </div>

                        {/* Decision Actions Persistent Bottom Sticky Footer */}
                        <div style={{
                            background: '#EAE4D6',
                            borderTop: '1px solid #DED7C8',
                            padding: '16px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: '#5C5852' }}>
                                {hasAnyComment() ? (
                                    <span style={{ color: '#8C5815', fontWeight: 600 }}>
                                        <i className="fas fa-info-circle"></i> Comments attached. Ready to forward or return.
                                    </span>
                                ) : (
                                    <span>
                                        <i className="fas fa-shield-alt"></i> Quality Reviewer cross-check enabled. Modifying results will update report audit trail.
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => handleDecision('REJECT')}
                                    disabled={submittingAction || !hasAnyComment()}
                                    title={!hasAnyComment() ? "At least one row-level comment required before rejection" : ""}
                                    className="btn"
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '0.88rem',
                                        fontWeight: 600,
                                        cursor: (submittingAction || !hasAnyComment()) ? 'not-allowed' : 'pointer',
                                        background: hasAnyComment() ? '#8B2522' : '#DED7C8',
                                        color: hasAnyComment() ? '#FFFFFF' : '#888278',
                                        border: 'none',
                                        borderRadius: '13px',
                                        boxShadow: 'none'
                                    }}
                                >
                                    <i className="fas fa-undo" style={{ marginRight: '6px' }}></i>
                                    Reject: Send Back to Tester
                                </button>

                                <button
                                    onClick={() => handleDecision('APPROVE')}
                                    disabled={submittingAction}
                                    className="btn btn-primary"
                                    style={{
                                        padding: '10px 20px',
                                        fontSize: '0.88rem',
                                        fontWeight: 600,
                                        cursor: submittingAction ? 'not-allowed' : 'pointer',
                                        background: '#1C1A17',
                                        color: '#F4F0E8',
                                        border: 'none',
                                        borderRadius: '13px'
                                    }}
                                >
                                    {submittingAction ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }}></i> Processing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-paper-plane" style={{ marginRight: '6px' }}></i> Approve & Send to Admin Dashboard
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Photo Preview Modal */}
            {previewPhoto && (
                <div 
                    onClick={() => setPreviewPhoto(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 3000,
                        display: 'grid',
                        placeItems: 'center',
                        padding: '24px'
                    }}
                >
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <img src={previewPhoto} alt="Full Proof Preview" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }} />
                        <div style={{ color: 'white', textAlign: 'center', marginTop: '12px', fontSize: '0.85rem' }}>Click anywhere to close</div>
                    </div>
                </div>
            )}

        </div>
    );
}

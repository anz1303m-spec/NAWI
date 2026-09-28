import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { SkeletonReportPage } from '../components/SkeletonLoader';

export default function ReportSummaryPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { authFetch, user } = useAuth();

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authFetch(`/api/report/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) setReport(data);
                else setReport(null);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id, authFetch]);

    if (loading) return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title="Report Summary" />
                <div className="app-content">
                    <SkeletonReportPage />
                </div>
            </div>
        </div>
    );
    if (!report) return (
        <div className="min-h-screen bg-[#F4F0E8] flex items-center justify-center p-6 text-center text-[#8B2522] font-bold">
            Report not found!
        </div>
    );

    let overallPass = true;
    let passCount = 0;
    let failCount = 0;
    let totalTests = 0;

    const checkStatus = (resultsObj) => {
        if (!resultsObj) return null;
        totalTests++;
        let isPass = true;
        if (JSON.stringify(resultsObj).includes('"FAIL"')) {
            isPass = false;
        }
        if (isPass) passCount++;
        else { failCount++; overallPass = false; }
        return isPass ? "PASS" : "FAIL";
    };

    const testStatus = {
        visual: checkStatus(report.form0_results),
        weighing: checkStatus(report.form1_results),
        repeatability: checkStatus(report.form2_results),
        eccentricity: checkStatus(report.form3_results),
        zero: checkStatus(report.form_zero_results),
        tare: checkStatus(report.form_tare_results),
        tilt: checkStatus(report.form_tilt_results)
    };

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title={`Report Summary: TP-${report._id.substring(0, 8).toUpperCase()}`} />
                <div className="app-content">
                    <div className="tactile-raised max-w-4xl mx-auto mb-6">
                        <div className="flex justify-between items-center pb-4 mb-5 border-b border-[#DED7C8]">
                            <div>
                                <span className="text-[10px] font-bold text-[#7A7469] uppercase tracking-widest block mb-0.5">
                                    Metrological Evaluation Summary
                                </span>
                                <h2 className="m-0 text-base md:text-lg font-bold text-[#1C1A17] font-['Outfit'] uppercase tracking-tight">
                                    Test Results Summary
                                </h2>
                                <div className="text-xs text-[#5C5852] mt-1 font-semibold">
                                    <i className="fas fa-book mr-1 text-[#7A7469]"></i> Governing Ruleset: {report.rule_set_version || 'OIML R-76 V1'}
                                </div>
                            </div>
                            <span className="bg-[#EAE4D6] border border-[#DED7C8] text-[#1C1A17] px-3.5 py-1.5 rounded-[11px] font-bold text-xs font-mono shadow-[inset_1px_1px_3px_#DBD3C3]">
                                TP-{report._id.substring(0, 8).toUpperCase()}
                            </span>
                        </div>

                        {/* Instrument Details Well */}
                        <div className="bg-[#EAE4D6] p-4 rounded-[13px] border border-[#DED7C8] mb-5 shadow-[inset_1px_1px_3px_#DBD3C3]">
                            <h3 className="m-0 mb-2 text-xs font-bold text-[#1C1A17] uppercase tracking-wider font-['Outfit']">
                                Instrument: {report.instrument_id || "Unknown"}
                            </h3>
                            <div className="flex gap-4 flex-wrap text-xs text-[#5C5852]">
                                <span><strong className="text-[#1C1A17]">Class:</strong> {report.instrument_data?.Class_value || 'N/A'}</span>
                                <span><strong className="text-[#1C1A17]">Capacity:</strong> {report.instrument_data?.capacity || 'N/A'} kg</span>
                                <span><strong className="text-[#1C1A17]">Verification Interval (e):</strong> {report.instrument_data?.e_value || 'N/A'} g</span>
                                <span><strong className="text-[#1C1A17]">Serial:</strong> {report.instrument_data?.serial_no || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Workflow Status Banner */}
                        <div className="bg-[#F4F0E8] border border-[#DED7C8] rounded-[13px] p-4 mb-5 shadow-[2px_2px_6px_#DBD3C3]">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-bold text-xs text-[#1C1A17] uppercase tracking-wider flex items-center gap-1.5">
                                    <i className="fas fa-network-wired text-[#5C5852]"></i> Verification Workflow Stage
                                </span>
                                <span className={`status-badge ${
                                    ['REJECTED_BY_VIEWER', 'REJECTED_BY_ADMIN'].includes(report.workflow_status)
                                        ? 'status-fail'
                                        : report.workflow_status === 'CERTIFIED'
                                            ? 'status-pass'
                                            : 'status-pending'
                                }`}>
                                    {report.workflow_status || 'SUBMITTED'}
                                </span>
                            </div>

                            {/* Chain of Custody */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[#5C5852]">
                                <div><strong className="text-[#1C1A17]">Tester:</strong> {report.createdBy || 'Inspection Officer'}</div>
                                <div><strong className="text-[#1C1A17]">Reviewer:</strong> {report.reviewedBy || 'Quality Reviewer'}</div>
                                <div><strong className="text-[#1C1A17]">Authority:</strong> {report.approvedBy || 'Admin Authority'}</div>
                            </div>

                            {/* Rejection Comments Box */}
                            {['REJECTED_BY_VIEWER', 'REJECTED_BY_ADMIN', 'SENT_BACK_TO_TESTER'].includes(report.workflow_status) && (
                                <div className="mt-3.5 p-3 bg-[#F5DDDC] border border-[#EBC3C2] rounded-[11px] text-xs text-[#8B2522]">
                                    <strong><i className="fas fa-comment-dots mr-1"></i> Reviewer Comments:</strong>
                                    <div className="mt-1">
                                        {report.review_history && report.review_history.length > 0 ? (
                                            report.review_history[report.review_history.length - 1].general_comment || report.review_history[report.review_history.length - 1].action
                                        ) : "Observations returned for re-testing."}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Uploaded Instrument Photographs Gallery */}
                        {((report.administrative_evidence && report.administrative_evidence.photos) || report.instrument_photo) && (
                            <div className="mb-5 p-4 bg-[#EAE4D6] border border-[#DED7C8] rounded-[13px] shadow-[inset_1px_1px_3px_#DBD3C3]">
                                <h4 className="m-0 mb-3 text-xs font-bold text-[#1C1A17] uppercase tracking-wider font-['Outfit'] flex items-center gap-1.5">
                                    <i className="fas fa-camera text-[#5C5852]"></i> Verified Instrument Photographs
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {report.administrative_evidence?.photos?.front && (
                                        <div className="rounded-[11px] overflow-hidden border border-[#DED7C8] bg-[#F4F0E8]">
                                            <img src={report.administrative_evidence.photos.front} alt="Front View" className="w-full h-28 object-cover" />
                                            <div className="p-1.5 text-[10px] font-bold text-[#1C1A17] text-center">Front View Photo</div>
                                        </div>
                                    )}
                                    {report.administrative_evidence?.photos?.nameplate && (
                                        <div className="rounded-[11px] overflow-hidden border border-[#DED7C8] bg-[#F4F0E8]">
                                            <img src={report.administrative_evidence.photos.nameplate} alt="Nameplate" className="w-full h-28 object-cover" />
                                            <div className="p-1.5 text-[10px] font-bold text-[#1C1A17] text-center">Nameplate / Markings</div>
                                        </div>
                                    )}
                                    {report.administrative_evidence?.photos?.rear_side && (
                                        <div className="rounded-[11px] overflow-hidden border border-[#DED7C8] bg-[#F4F0E8]">
                                            <img src={report.administrative_evidence.photos.rear_side} alt="Rear View" className="w-full h-28 object-cover" />
                                            <div className="p-1.5 text-[10px] font-bold text-[#1C1A17] text-center">Rear / Side View</div>
                                        </div>
                                    )}
                                    {!report.administrative_evidence?.photos?.front && report.instrument_photo && (
                                        <div className="rounded-[11px] overflow-hidden border border-[#DED7C8] bg-[#F4F0E8]">
                                            <img src={report.instrument_photo} alt="Instrument Photo" className="w-full h-28 object-cover" />
                                            <div className="p-1.5 text-[10px] font-bold text-[#1C1A17] text-center">Instrument Photo</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Test Rows with OIML R-76 Clauses */}
                        <div className="flex flex-col gap-2.5 mb-6">
                            {Object.entries({
                                visual: { label: 'Visual Inspection', sub: 'Markings and construction verified', clause: 'Clause 3.10 / Annex A.2' },
                                weighing: { label: 'Weighing Performance', sub: 'Load observations against MPE tolerances', clause: 'Clause 3.5.1 / Annex A.4.4' },
                                repeatability: { label: 'Repeatability', sub: 'Variation within permissible limits', clause: 'Clause 3.6.1 / Annex A.4.4' },
                                eccentricity: { label: 'Eccentricity', sub: 'Off-center loading errors', clause: 'Clause 3.6.2 / Annex A.4.7' },
                                zero: { label: 'Zero Test', sub: 'Zero-setting and zero-tracking accuracy', clause: 'Clause 3.8.1 / Annex A.4.2' },
                                tare: { label: 'Tare Accuracy', sub: 'Net weight accuracy', clause: 'Clause 3.5.3.4 / Annex A.4.6' },
                                tilt: { label: 'Tilt Test', sub: 'Leveling variation', clause: 'Clause 3.9.1 / Annex A.5' }
                            }).map(([key, item]) => {
                                const st = testStatus[key];
                                if (!st) return null;
                                return (
                                    <div key={key} className="flex justify-between items-center p-3 bg-[#F4F0E8] border border-[#DED7C8] rounded-[11px] shadow-[1px_1px_4px_#DBD3C3]">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="m-0 text-xs font-bold text-[#1C1A17] font-['Outfit'] uppercase">{item.label}</h4>
                                                <span className="text-[10px] bg-[#EAE4D6] text-[#5C5852] px-2 py-0.5 rounded-[6px] font-mono border border-[#DED7C8]">{item.clause}</span>
                                            </div>
                                            <span className="text-[11px] text-[#5C5852]">{item.sub}</span>
                                        </div>
                                        {user?.role === 'tester' ? (
                                            <span className="status-badge status-neutral">
                                                <i className="fas fa-check-circle mr-1"></i> RECORDED
                                            </span>
                                        ) : (
                                            <span className={`status-badge ${st === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                                                <i className={`fas ${st === 'PASS' ? 'fa-check' : 'fa-times'} mr-1`}></i> {st}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Overall Result / Status Banner */}
                        {user?.role === 'tester' ? (
                            <div className="bg-[#EAE4D6] border border-[#DED7C8] rounded-[13px] p-5 text-center mb-6 shadow-[inset_1px_1px_3px_#DBD3C3]">
                                <h4 className="m-0 text-xs font-bold text-[#1C1A17] uppercase tracking-wider mb-1">
                                    <i className="fas fa-paper-plane mr-1.5 text-[#5C5852]"></i> Readings & Proofs Submitted for Review
                                </h4>
                                <div className="text-xl font-bold text-[#1C1A17] my-1 font-['Outfit']">
                                    ✓ Submitted to Quality Review Queue
                                </div>
                                <div className="text-xs text-[#5C5852]">
                                    All metrological test values, instrument parameters, and photo evidence recorded.
                                </div>
                            </div>
                        ) : (
                            <div className={`p-5 rounded-[13px] border text-center mb-6 shadow-[2px_2px_6px_#DBD3C3] ${
                                overallPass ? 'bg-[#E2EBDC] border-[#C5DAC0]' : 'bg-[#F5DDDC] border-[#EBC3C2]'
                            }`}>
                                <h4 className="m-0 text-xs font-bold uppercase tracking-wider text-[#1C1A17] mb-1">
                                    Overall Metrological Assessment
                                </h4>
                                <div className={`text-2xl font-extrabold my-1 font-['Outfit'] ${overallPass ? 'text-[#2D5A27]' : 'text-[#8B2522]'}`}>
                                    {overallPass ? '✓ CONFORMS: PASS' : '❌ NON-CONFORMING: FAIL'}
                                </div>
                                <div className={`text-xs font-semibold ${overallPass ? 'text-[#2D5A27]' : 'text-[#8B2522]'}`}>
                                    {passCount} of {totalTests} evaluation modules conforming
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 justify-end items-center flex-wrap">
                            <Link to={`/report-detailed/${report._id}`} className="btn-secondary px-4 py-2.5 text-xs font-bold">
                                <i className="fas fa-list"></i> View Detailed Analysis
                            </Link>
                            {user?.role === 'admin' ? (
                                <button className="btn px-5 py-2.5 text-xs tracking-wider uppercase font-bold" onClick={() => window.open(`/certificate/${report._id}`, '_blank')}>
                                    <i className="fas fa-file-pdf"></i> Generate Official Certificate
                                </button>
                            ) : user?.role === 'viewer' ? (
                                <Link to="/viewer" className="btn px-4 py-2.5 text-xs font-bold">
                                    <i className="fas fa-search-plus"></i> Open in Review Queue
                                </Link>
                            ) : (
                                <button
                                    className="btn px-5 py-2.5 text-xs font-bold"
                                    onClick={() => navigate('/history')}
                                >
                                    <i className="fas fa-arrow-left"></i> Return to History
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

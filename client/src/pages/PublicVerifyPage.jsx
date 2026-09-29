import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { SkeletonReportPage } from '../components/SkeletonLoader';

export default function PublicVerifyPage() {
    const { reportId } = useParams();
    const navigate = useNavigate();

    const [searchInput, setSearchInput] = useState(reportId || '');
    const [activeId, setActiveId] = useState(reportId || '');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (reportId) {
            setSearchInput(reportId);
            setActiveId(reportId);
        } else {
            setActiveId('');
            setData(null);
            setLoading(false);
        }
    }, [reportId]);

    useEffect(() => {
        if (!activeId) return;

        setLoading(true);
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/verify/${encodeURIComponent(activeId)}`)
            .then(res => res.json())
            .then(resData => {
                setData(resData);
            })
            .catch(err => {
                console.error("Verification fetch error:", err);
                setData({ status: "NOT_FOUND", message: "Certificate not found. Please check the ID or QR code and try again." });
            })
            .finally(() => setLoading(false));
    }, [activeId]);

    const handleSearch = (e) => {
        e.preventDefault();
        const trimmed = searchInput.trim();
        if (!trimmed) return;
        setActiveId(trimmed);
        navigate(`/verify/${trimmed}`, { replace: true });
    };

    const handleCopyHash = () => {
        if (data && data.sha256Hash) {
            navigator.clipboard.writeText(data.sha256Hash);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F0E8] flex flex-col text-[#1C1A17]">
            <Navbar />

            <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 font-['Plus_Jakarta_Sans']">
                {/* Header / Brand */}
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-[#1C1A17] text-[#F4F0E8] rounded-[13px] grid place-items-center text-xl mx-auto mb-3 shadow-[3px_3px_8px_#DBD3C3,-3px_-3px_8px_#FFFFFF]">
                        <i className="fas fa-balance-scale-right"></i>
                    </div>
                    <h1 className="text-xl md:text-2xl text-[#1C1A17] m-0 font-['Outfit'] font-bold uppercase tracking-tight">
                        Public Metrology Verification
                    </h1>
                    <p className="text-xs text-[#5C5852] mt-1 mb-0">
                        Cryptographic Seal & OIML R 76-1 Conformity Register
                    </p>
                </div>

                {/* Main Content Card: Tactile Convex Surface */}
                <div className="bg-[#F4F0E8] rounded-[14px] border border-[#DED7C8] shadow-[6px_6px_18px_#DBD3C3,-6px_-6px_18px_#FFFFFF] max-w-xl w-full p-6 md:p-8">
                    {/* Interactive Certificate ID Search Bar */}
                    <form onSubmit={handleSearch} className="mb-6">
                        <label className="block text-[11px] font-bold text-[#1C1A17] uppercase tracking-wider mb-2">
                            Enter Certificate or Report ID
                        </label>
                        <div className="flex gap-2.5">
                            <input
                                type="text"
                                placeholder="e.g. TP-1024 or full report ID..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="flex-1 px-3.5 py-2.5 bg-[#EAE4D6] border border-[#DED7C8] rounded-[13px] text-xs font-mono text-[#1C1A17] shadow-[inset_2px_2px_4px_#DBD3C3,inset_-2px_-2px_4px_#FFFFFF] focus:border-[#1C1A17] outline-none"
                            />
                            <button
                                type="submit"
                                className="btn px-5 py-2.5 text-xs font-bold whitespace-nowrap"
                            >
                                <i className="fas fa-shield-alt"></i> Verify
                            </button>
                        </div>
                    </form>

                    {/* Conditional Verification States */}
                    {loading ? (
                        <div className="py-4">
                            <p className="text-center text-xs text-[#5C5852] mb-4">
                                <i className="fas fa-circle-notch fa-spin mr-2 text-[#1C1A17]"></i>
                                Validating cryptographic SHA-256 seal against metrology ledger...
                            </p>
                            <SkeletonReportPage />
                        </div>
                    ) : !activeId ? (
                        /* IDLE INITIAL SEARCH STATE */
                        <div className="text-center py-7 px-4 bg-[#EAE4D6] rounded-[13px] border border-[#DED7C8] shadow-[inset_1px_1px_3px_#DBD3C3]">
                            <div className="text-3xl text-[#1C1A17] mb-2">
                                <i className="fas fa-qrcode"></i>
                            </div>
                            <h3 className="text-sm text-[#1C1A17] font-bold mb-1 font-['Outfit'] uppercase">
                                Public Verification Portal
                            </h3>
                            <p className="text-xs text-[#5C5852] leading-relaxed max-w-md mx-auto m-0">
                                Enter an official certificate ID above or scan the QR code printed on the physical certificate to query its mathematical seal and test observations.
                            </p>
                        </div>
                    ) : data?.status === 'PENDING_APPROVAL' ? (
                        /* PENDING VERIFICATION APPROVAL STATE */
                        <div className="space-y-4">
                            <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-[14px] p-4 text-center shadow-sm">
                                <span className="inline-block text-lg mb-1 text-[#92400E]"><i className="fas fa-hourglass-half"></i></span>
                                <h2 className="text-sm font-bold text-[#92400E] m-0 uppercase tracking-wide font-['Outfit']">
                                    Verification Pending Official Approval
                                </h2>
                                <p className="text-[11px] text-[#B45309] font-semibold mt-1 mb-0">
                                    Readings and observations submitted. Awaiting quality reviewer and verifier sign-off before official certificate release.
                                </p>
                            </div>

                            {/* Workflow Stage Details */}
                            <div className="bg-white p-4 rounded-[14px] border border-[#E2E8F0] shadow-sm text-xs space-y-2">
                                <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0]">
                                    <span className="font-bold text-[#0F172A]">REPORT / CERTIFICATE ID</span>
                                    <span className="font-mono text-[#2563EB] font-bold">{data.reportId}</span>
                                </div>
                                <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0]">
                                    <span className="font-bold text-[#0F172A]">CURRENT WORKFLOW STAGE</span>
                                    <span className="status-badge status-pending">{data.workflowStatus || 'UNDER REVIEW'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-[#0F172A]">SUBMITTED BY</span>
                                    <span className="text-[#64748B] font-semibold">{data.reviewChain?.[0]?.name || 'Verification Officer'}</span>
                                </div>
                            </div>

                            {/* Instrument Details Well */}
                            <div className="bg-[#F8FAFC] p-4 rounded-[14px] border border-[#E2E8F0] shadow-sm text-xs">
                                <h4 className="m-0 mb-2 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                                    <i className="fas fa-balance-scale mr-1.5 text-[#2563EB]"></i> Instrument Specifications
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-[#0F172A]">
                                    <div><span className="text-[#64748B]">Make:</span> {data.instrument?.manufacturer || 'N/A'}</div>
                                    <div><span className="text-[#64748B]">Model:</span> {data.instrument?.model || 'N/A'}</div>
                                    <div><span className="text-[#64748B]">Serial:</span> {data.instrument?.serialNumber || 'N/A'}</div>
                                    <div><span className="text-[#64748B]">Class:</span> {data.instrument?.accuracyClass || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    ) : data?.status === 'VERIFIED' ? (
                        /* VERIFIED STATE */
                        <div className="space-y-4">
                            {/* Status Banner */}
                            <div className="bg-[#DCFCE7] border border-[#BBF7D0] rounded-[14px] p-4 text-center shadow-sm">
                                <span className="inline-block text-lg mb-1 text-[#166534]">✓</span>
                                <h2 className="text-sm font-bold text-[#166534] m-0 uppercase tracking-wide font-['Outfit']">
                                    Official Certificate Confirmed
                                </h2>
                                <p className="text-[11px] text-[#15803D] font-semibold mt-0.5 mb-0">
                                    Authentic and cryptographically untampered record
                                </p>
                            </div>

                            {/* Superseded Warning if applicable */}
                            {data.isSuperseded && (
                                <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-[14px] p-3 text-xs text-[#92400E] font-semibold flex items-center gap-2">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <span>Notice: This certificate has been superseded by a subsequent revision.</span>
                                </div>
                            )}

                            {/* Report Header */}
                            <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0]">
                                <div>
                                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Certificate ID</span>
                                    <span className="text-sm font-bold text-[#0F172A] font-mono">{data.reportId}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Evaluation Result</span>
                                    <span className={`status-badge ${data.overallResult === 'PASS' ? 'status-pass' : 'status-fail'}`}>
                                        {data.overallResult}
                                    </span>
                                </div>
                            </div>

                            {/* Instrument Details Well */}
                            <div className="bg-[#F8FAFC] p-3.5 rounded-[14px] border border-[#E2E8F0] shadow-sm text-xs">
                                <h4 className="m-0 mb-2 text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                                    <i className="fas fa-balance-scale mr-1.5 text-[#2563EB]"></i> Instrument Specifications
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-[#0F172A]">
                                    <div><span className="text-[#64748B]">Make:</span> {data.instrument.manufacturer}</div>
                                    <div><span className="text-[#64748B]">Model:</span> {data.instrument.model}</div>
                                    <div><span className="text-[#64748B]">Serial:</span> {data.instrument.serialNumber}</div>
                                    <div><span className="text-[#64748B]">Class:</span> {data.instrument.accuracyClass}</div>
                                </div>
                            </div>

                            {/* Facility & Date */}
                            <div className="text-xs text-[#64748B] space-y-1">
                                <div><strong className="text-[#0F172A]">Laboratory:</strong> {data.lab.name || "National Metrology Laboratory"} ({data.lab.location || "HQ"})</div>
                                <div><strong className="text-[#0F172A]">Date of Test:</strong> {new Date(data.testDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                <div><strong className="text-[#0F172A]">Governing Standard:</strong> {data.ruleSetVersion}</div>
                            </div>

                            {/* Review Accountability Chain */}
                            <div className="bg-[#F8FAFC] p-3 rounded-[14px] border border-[#E2E8F0] shadow-sm">
                                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                                    Authorized Signoff Chain
                                </span>
                                <div className="flex gap-2 flex-wrap text-xs">
                                    {data.reviewChain?.map((person, idx) => (
                                        <div key={idx} className="bg-white px-2.5 py-1 rounded-[10px] border border-[#E2E8F0] text-[#0F172A]">
                                            <span className="font-bold">{person.name}</span> <span className="text-[#64748B]">({person.role})</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SHA-256 Hash Seal Box */}
                            <div className="bg-[#F8FAFC] p-3 rounded-[14px] border border-[#E2E8F0] shadow-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F172A]">
                                        <i className="fas fa-key mr-1 text-[#2563EB]"></i> SHA-256 Cryptographic Seal
                                    </span>
                                    <button
                                        onClick={handleCopyHash}
                                        className="bg-transparent border-0 text-[#2563EB] text-[10px] font-bold cursor-pointer hover:underline"
                                    >
                                        {copied ? '✓ Copied' : 'Copy Hash'}
                                    </button>
                                </div>
                                <div className="font-mono text-[11px] break-all text-[#0F172A] bg-white p-2 rounded-[10px] border border-[#E2E8F0]">
                                    {data.sha256Hash}
                                </div>
                            </div>

                            {/* Download Certificate PDF CTA */}
                            <button
                                className="btn w-full py-3 text-xs tracking-wider uppercase font-bold justify-center"
                                onClick={() => window.open(`/certificate/${data.rawId}`, '_blank')}
                            >
                                <i className="fas fa-file-pdf"></i> View Printable Certificate PDF
                            </button>
                        </div>
                    ) : data?.status === 'TAMPERED' ? (
                        /* TAMPERED STATE */
                        <div className="text-center py-4">
                            <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-[14px] p-5 mb-4 shadow-sm">
                                <div className="text-2xl text-[#991B1B] mb-1">⚠️</div>
                                <h2 className="text-sm font-bold text-[#991B1B] mb-1 uppercase tracking-wide font-['Outfit']">
                                    Cryptographic Verification Failed
                                </h2>
                                <p className="m-0 text-xs text-[#991B1B] font-semibold">
                                    This document payload does not match its issued SHA-256 seal.
                                </p>
                            </div>
                            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
                                The record for ID "<strong>{activeId}</strong>" contains discrepancies from the original signed calibration event. Please contact the legal metrology authority directly.
                            </p>
                        </div>
                    ) : (
                        /* NOT FOUND STATE */
                        <div className="text-center py-6">
                            <div className="text-2xl text-[#7A7469] mb-2">
                                <i className="fas fa-search"></i>
                            </div>
                            <h2 className="text-sm font-bold text-[#1C1A17] mb-1 uppercase tracking-wide font-['Outfit']">
                                Record Not Found
                            </h2>
                            <p className="text-xs text-[#5C5852] leading-relaxed mb-4">
                                No verified certificate matching "<strong>{activeId}</strong>" exists in the registry. Please check the identifier and retry.
                            </p>
                            <button
                                onClick={() => { setActiveId(''); setSearchInput(''); setData(null); navigate('/verify', { replace: true }); }}
                                className="btn-secondary px-4 py-2 text-xs font-bold"
                            >
                                Clear Query
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Reference */}
                <div className="mt-6 text-center text-[11px] text-[#7A7469]">
                    OIML R 76-1:2006 (E) Public Verification Infrastructure
                </div>
            </div>
        </div>
    );
}

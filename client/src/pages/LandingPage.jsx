import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0F172A]">
            <Navbar />

            {/* 1. HERO SECTION */}
            <header className="px-6 py-16 md:py-20 max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] px-3.5 py-1.5 rounded-[13px] text-xs font-bold uppercase tracking-wider mb-6 shadow-[inset_1px_1px_3px_#CBD5E1]">
                    <i className="fas fa-shield-alt text-[#475569]"></i> OIML R 76-1 Standard Metrology Verification
                </div>

                <h1 className="text-3xl md:text-5xl font-['Outfit'] font-bold text-[#0F172A] leading-tight mb-5 tracking-tight uppercase">
                    Every verification certificate, fully explained and cryptographically validated.
                </h1>

                <p className="text-sm md:text-base text-[#475569] max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
                    Compliance evaluation system for Non-Automatic Weighing Instruments: implementing procedural checkpoints, dynamic maximum permissible error (MPE) calculations, and immutable audit logs in accordance with international metrological standards.
                </p>

                <div className="flex flex-wrap gap-4 justify-center items-center">
                    <Link 
                        to={user ? (user.role === 'admin' ? '/admin' : user.role === 'viewer' ? '/viewer' : '/home') : '/login'} 
                        className="btn px-7 py-3 text-sm font-bold"
                    >
                        {user ? 'Open Workspace Portal' : 'Access Verification System'} <i className="fas fa-arrow-right"></i>
                    </Link>
                    <a 
                        href="#how-it-works" 
                        className="btn-secondary px-6 py-3 text-sm font-bold"
                    >
                        Review Evaluation Workflow
                    </a>
                </div>
            </header>

            {/* 2. HOW IT WORKS SECTION */}
            <section id="how-it-works" className="py-16 px-6 border-y border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="text-[11px] font-bold text-[#64748B] tracking-widest uppercase block mb-1">
                            Standard Operating Procedure
                        </span>
                        <h2 className="text-2xl font-['Outfit'] font-bold text-[#0F172A] uppercase tracking-tight">
                            Four-Stage Verification Lifecycle
                        </h2>
                        <p className="text-sm text-[#475569] max-w-xl mx-auto mt-2">
                            End-to-end metrological governance ensuring independence between inspection, technical review, administrative sealing, and public query.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Stage 1 */}
                        <div className="bg-white border border-[#E2E8F0] rounded-[13px] p-6 shadow-sm flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <div className="w-10 h-10 bg-[#0F172A] text-white rounded-[13px] grid place-items-center text-base">
                                    <i className="fas fa-edit"></i>
                                </div>
                                <span className="font-['IBM_Plex_Mono'] text-lg font-bold text-[#64748B]">01</span>
                            </div>
                            <h3 className="text-base font-bold text-[#0F172A] mb-2 font-['Outfit']">
                                1. Test Execution
                            </h3>
                            <p className="text-xs text-[#475569] leading-relaxed mb-4 flex-1">
                                Certified inspector records raw load observations, tare offsets, repeatability spreads, and eccentricity measurements alongside timestamped visual evidence.
                            </p>
                            <div className="bg-[#F1F5F9] border border-[#E2E8F0] p-3 rounded-[13px] text-[11px] font-semibold text-[#0F172A]">
                                Formal compliance logging per OIML R 76-1:2006.
                            </div>
                        </div>

                        {/* Stage 2 */}
                        <div className="bg-white border border-[#E2E8F0] rounded-[13px] p-6 shadow-sm flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <div className="w-10 h-10 bg-[#0F172A] text-white rounded-[13px] grid place-items-center text-base">
                                    <i className="fas fa-user-check"></i>
                                </div>
                                <span className="font-['IBM_Plex_Mono'] text-lg font-bold text-[#64748B]">02</span>
                            </div>
                            <h3 className="text-base font-bold text-[#0F172A] mb-2 font-['Outfit']">
                                2. Quality Cross-Check
                            </h3>
                            <p className="text-xs text-[#475569] leading-relaxed mb-4 flex-1">
                                Independent quality reviewer examines all calculated errors against MPE bounds with authority to request re-testing or substantiate observations.
                            </p>
                            <div className="bg-[#F1F5F9] border border-[#E2E8F0] p-3 rounded-[13px] text-[11px] font-semibold text-[#0F172A]">
                                Mandatory secondary oversight prior to certification.
                            </div>
                        </div>

                        {/* Stage 3 */}
                        <div className="bg-white border border-[#E2E8F0] rounded-[13px] p-6 shadow-sm flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <div className="w-10 h-10 bg-[#0F172A] text-white rounded-[13px] grid place-items-center text-base">
                                    <i className="fas fa-stamp"></i>
                                </div>
                                <span className="font-['IBM_Plex_Mono'] text-lg font-bold text-[#64748B]">03</span>
                            </div>
                            <h3 className="text-base font-bold text-[#0F172A] mb-2 font-['Outfit']">
                                3. Administrative Seal
                            </h3>
                            <p className="text-xs text-[#475569] leading-relaxed mb-4 flex-1">
                                Designated legal metrology official confirms completeness of the audit trail, authorizes publication, and generates the SHA-256 seal.
                            </p>
                            <div className="bg-[#F1F5F9] border border-[#E2E8F0] p-3 rounded-[13px] text-[11px] font-semibold text-[#0F172A]">
                                Cryptographic sealing prevents post-issue alteration.
                            </div>
                        </div>

                        {/* Stage 4 */}
                        <div className="bg-white border border-[#E2E8F0] rounded-[13px] p-6 shadow-sm flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <div className="w-10 h-10 bg-[#0F172A] text-white rounded-[13px] grid place-items-center text-base">
                                    <i className="fas fa-qrcode"></i>
                                </div>
                                <span className="font-['IBM_Plex_Mono'] text-lg font-bold text-[#64748B]">04</span>
                            </div>
                            <h3 className="text-base font-bold text-[#0F172A] mb-2 font-['Outfit']">
                                4. Public Verification
                            </h3>
                            <p className="text-xs text-[#475569] leading-relaxed mb-4 flex-1">
                                Consumers, auditors, and regulatory inspectors scan the printed certificate QR code or enter the report ID to verify integrity instantly online.
                            </p>
                            <div className="bg-[#F1F5F9] border border-[#E2E8F0] p-3 rounded-[13px] text-[11px] font-semibold text-[#0F172A]">
                                Open verification accessible to all stakeholders.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. COMPARISON SECTION */}
            <section className="py-16 px-6 max-w-5xl mx-auto w-full">
                <div className="text-center mb-12">
                    <span className="text-[11px] font-bold text-[#64748B] tracking-widest uppercase block mb-1">
                        System Architecture
                    </span>
                    <h2 className="text-2xl font-['Outfit'] font-bold text-[#0F172A] uppercase tracking-tight">
                        Methodological Comparison
                    </h2>
                    <p className="text-sm text-[#475569] max-w-lg mx-auto mt-2">
                        Comparing ad-hoc documentation tools with this metrological compliance architecture.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Conventional Tooling */}
                    <div className="bg-white border border-[#E2E8F0] rounded-[13px] p-7 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E2E8F0]">
                            <div className="w-7 h-7 rounded-[11px] bg-[#F1F5F9] border border-[#E2E8F0] grid place-items-center text-[#991B1B] text-xs font-bold">
                                <i className="fas fa-times"></i>
                            </div>
                            <h3 className="m-0 text-sm font-bold text-[#64748B] uppercase tracking-wider font-['Outfit']">
                                Conventional Unverified Tools
                            </h3>
                        </div>

                        <ul className="list-none p-0 m-0 space-y-4">
                            {[
                                "Presents binary PASS/FAIL conclusions without explicit tolerance margin citations",
                                "Single-user submission generating unverified documents without secondary review",
                                "Absence of revision history when test values or observations are updated",
                                "Hardcoded tolerance thresholds that ignore versioned standard revisions",
                                "Unsealed PDF output susceptible to post-inspection modification"
                            ].map((text, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-xs text-[#475569] leading-relaxed">
                                    <i className="fas fa-minus text-[#94A3B8] mt-0.5"></i>
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* NAWI Compliant Platform */}
                    <div className="bg-white border-2 border-[#2563EB] rounded-[13px] p-7 shadow-sm">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E2E8F0]">
                            <div className="w-7 h-7 rounded-[11px] bg-[#2563EB] grid place-items-center text-white text-xs font-bold">
                                <i className="fas fa-check"></i>
                            </div>
                            <h3 className="m-0 text-sm font-bold text-[#0F172A] uppercase tracking-wider font-['Outfit']">
                                NAWI Compliance Architecture
                            </h3>
                        </div>

                        <ul className="list-none p-0 m-0 space-y-4">
                            {[
                                "Every evaluation cites the corresponding OIML R 76-1 clause with calculated error margins",
                                "Multi-tier maker, checker, and approver review chain required for official certificate release",
                                "Comprehensive audit log capturing initial entries, reviewer comments, and revision timestamps",
                                "Version-aware rules engine maintaining validity under governing standards at time of test",
                                "Cryptographic SHA-256 seal embedded on certificate for public mathematical verification"
                            ].map((text, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-xs text-[#0F172A] font-semibold leading-relaxed">
                                    <i className="fas fa-check text-[#166534] mt-0.5"></i>
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* 4. STANDARDS REFERENCE SECTION */}
            <section className="py-14 px-6 border-t border-[#E2E8F0] bg-[#F1F5F9]">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-[11px] font-bold text-[#64748B] tracking-widest uppercase block mb-1">
                        Regulatory Framework
                    </span>
                    <h2 className="text-xl font-['Outfit'] font-bold text-[#0F172A] uppercase tracking-tight mb-3">
                        Engineered in Accordance with International Standards
                    </h2>
                    <p className="text-xs text-[#475569] max-w-2xl mx-auto leading-relaxed mb-6">
                        System tolerances, verification scale interval criteria, eccentricity rules, and report structures follow international recommendations for non-automatic weighing equipment.
                    </p>

                    <div className="flex justify-center gap-3 flex-wrap mb-6">
                        <span className="bg-white border border-[#E2E8F0] px-3.5 py-1.5 rounded-[13px] text-xs font-bold text-[#0F172A]">
                            OIML R 76-1:2006 (E)
                        </span>
                        <span className="bg-white border border-[#E2E8F0] px-3.5 py-1.5 rounded-[13px] text-xs font-bold text-[#0F172A]">
                            OIML R 76-2:2007 (E)
                        </span>
                        <span className="bg-white border border-[#E2E8F0] px-3.5 py-1.5 rounded-[13px] text-xs font-bold text-[#0F172A]">
                            Legal Metrology Act 2009
                        </span>
                    </div>

                    <p className="text-[11px] text-[#64748B] font-medium m-0">
                        Operational Scope: Laboratory evaluation and model verification for Class I, II, III, and IIII instruments.
                    </p>
                </div>
            </section>

            {/* 5. FOOTER */}
            <footer className="mt-auto bg-[#0F172A] text-[#94A3B8] px-6 py-8 text-center text-xs border-t border-[#0F172A]">
                <div className="flex justify-center gap-6 mb-4">
                    <Link to="/login" className="text-white hover:underline no-underline font-semibold">Inspector Portal</Link>
                    <Link to="/verify" className="text-[#94A3B8] hover:text-white no-underline">Certificate Verification</Link>
                    <a href="#how-it-works" className="text-[#94A3B8] hover:text-white no-underline">Evaluation Process</a>
                </div>
                <p className="text-[11px] text-[#64748B] m-0">
                    NAWI Metrology Verification System: Designed for legal metrology laboratories and verification officers.
                </p>
            </footer>
        </div>
    );
}

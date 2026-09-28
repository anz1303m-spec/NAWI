import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { SkeletonReportPage } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';

export default function CertificatePage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/report/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data && !data.error) setReport(data);
                else setReport(null);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="max-w-4xl mx-auto my-10 p-6 bg-[#F4F0E8]">
            <SkeletonReportPage />
        </div>
    );

    if (!report) return (
        <div className="min-h-screen bg-[#F4F0E8] flex items-center justify-center p-6 text-center text-[#8B2522] font-bold">
            Verification Certificate Not Found
        </div>
    );

    const isCertified = ['APPROVED', 'CERTIFIED', 'ISSUED'].includes(report.workflow_status) || report.report_status === 'ISSUED';

    if (!isCertified && user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-[#F4F0E8] p-6 flex justify-center items-center font-['Plus_Jakarta_Sans'] text-[#1C1A17]">
                <div className="bg-[#F4F0E8] border border-[#DED7C8] rounded-[14px] p-8 max-w-lg w-full text-center shadow-[6px_6px_18px_#DBD3C3,-6px_-6px_18px_#FFFFFF]">
                    <div className="w-14 h-14 bg-[#EAE4D6] border border-[#DED7C8] text-[#8C5815] rounded-[13px] grid place-items-center text-2xl mx-auto mb-4 shadow-[inset_1px_1px_3px_#DBD3C3]">
                        <i className="fas fa-hourglass-half"></i>
                    </div>
                    <h2 className="text-lg font-bold text-[#1C1A17] mb-2 font-['Outfit'] uppercase">
                        Certificate Pending Final Administrative Approval
                    </h2>
                    <p className="text-xs text-[#5C5852] leading-relaxed mb-5">
                        Verification record (<strong>TP-{id.substring(0, 8).toUpperCase()}</strong>) is undergoing official quality review. Once approved and sealed by the Administrator Authority, the official certificate will be released.
                    </p>
                    <div className="bg-[#EAE4D6] border border-[#DED7C8] p-3 rounded-[13px] text-xs font-semibold text-[#1C1A17] mb-6 shadow-[inset_1px_1px_3px_#DBD3C3]">
                        Current Workflow Stage: <strong className="text-[#1C1A17]">{report.workflow_status || 'SUBMITTED'}</strong>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <Link to={`/report/${id}`} className="btn px-4 py-2.5 text-xs font-bold">
                            <i className="fas fa-arrow-left"></i> Summary Report
                        </Link>
                        <Link to={`/verify/${id}`} className="btn-secondary px-4 py-2.5 text-xs font-bold">
                            <i className="fas fa-qrcode"></i> Public Portal
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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

    const inst = report.instrument_data || {};
    const lab = report.lab_details || {};
    const dateStr = new Date(report.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const reportIdStr = `TP-${report._id.substring(0, 8).toUpperCase()}`;
    const certUrl = `${window.location.origin}/verify/${report._id}`;

    return (
        <div className="min-h-screen bg-[#F4F0E8] p-6 flex flex-col items-center">
            {/* Screen Print Button */}
            <button
                onClick={() => window.print()}
                className="btn fixed top-5 right-5 z-[1000] px-5 py-3 text-xs tracking-wider uppercase font-bold shadow-[4px_4px_10px_#DBD3C3,-4px_-4px_10px_#FFFFFF]"
            >
                <i className="fas fa-print"></i> Print Verification Certificate
            </button>

            {/* A4 Sheet Container */}
            <div className="w-[210mm] min-h-[297mm] bg-[#FAF8F5] shadow-[6px_6px_24px_#DBD3C3] relative box-border text-[#1C1A17] p-[20mm_16mm_16mm] border border-[#DED7C8]">
                {/* Frame border */}
                <div className="absolute inset-[8mm] border-2 border-[#1C1A17] pointer-events-none">
                    <div className="absolute inset-[4px] border border-[#DED7C8]"></div>
                </div>

                {/* Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[32deg] font-['Outfit'] text-[72px] font-bold text-[#1C1A17]/[0.03] tracking-[6px] whitespace-nowrap pointer-events-none">
                    VERIFIED OIML R-76
                </div>

                {/* Header */}
                <div className="flex justify-between items-center border-b-2 border-[#1C1A17] pb-3.5 mb-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-[13px] bg-[#1C1A17] grid place-items-center text-[#F4F0E8] text-xl shadow-[2px_2px_6px_#DBD3C3]">
                            <i className="fas fa-balance-scale-right"></i>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase tracking-widest text-[#7A7469] font-bold">
                                National Legal Metrology Authority
                            </div>
                            <h1 className="text-xl font-bold text-[#1C1A17] font-['Outfit'] uppercase tracking-tight m-0">
                                Verification Certificate
                            </h1>
                            <div className="text-[11px] text-[#5C5852] font-semibold">OIML R-76-1:2006 (E) Compliance Assessment</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 bg-[#EAE4D6] p-2 rounded-[13px] border border-[#DED7C8] shadow-[inset_1px_1px_3px_#DBD3C3]">
                        <QRCodeSVG value={certUrl} size={52} />
                        <div className="text-[9px] leading-tight">
                            <div className="font-bold text-[#1C1A17] text-[11px] font-mono">{reportIdStr}</div>
                            <div className="text-[#5C5852]">Date: {dateStr}</div>
                            <div className="text-[#2D5A27] font-bold mt-0.5">✓ Certified Record</div>
                        </div>
                    </div>
                </div>

                {/* Status Banner */}
                <div className="bg-[#EAE4D6] px-4 py-2.5 border-l-4 border-[#1C1A17] rounded-r-[13px] flex justify-between items-center mb-4">
                    <span className="text-[10px] uppercase tracking-widest text-[#7A7469] font-bold">
                        Conformity Decision
                    </span>
                    <span className={`px-3 py-1 rounded-[11px] text-xs font-bold tracking-wider ${
                        overallPass ? 'bg-[#E2EBDC] text-[#2D5A27] border border-[#C5DAC0]' : 'bg-[#F5DDDC] text-[#8B2522] border border-[#EBC3C2]'
                    }`}>
                        {overallPass ? 'CONFORMS: PASS' : 'NON-CONFORMING: FAIL'}
                    </span>
                </div>

                {/* Instrument Specs Grid */}
                <div className="grid grid-cols-2 gap-3.5 text-[11px] mb-4">
                    <div className="bg-[#FAF8F5] p-3 border border-[#DED7C8] rounded-[13px]">
                        <h4 className="m-0 mb-2 border-b border-[#DED7C8] pb-1 text-[#1C1A17] text-xs font-bold uppercase tracking-wider font-['Outfit']">
                            Instrument Identification
                        </h4>
                        <div><strong>Manufacturer:</strong> {inst.manufacturer || 'N/A'}</div>
                        <div><strong>Model:</strong> {inst.model || 'N/A'}</div>
                        <div><strong>Serial No:</strong> {inst.serial_no || 'N/A'}</div>
                        <div><strong>Accuracy Class:</strong> {inst.Class_value || 'N/A'}</div>
                    </div>
                    <div className="bg-[#FAF8F5] p-3 border border-[#DED7C8] rounded-[13px]">
                        <h4 className="m-0 mb-2 border-b border-[#DED7C8] pb-1 text-[#1C1A17] text-xs font-bold uppercase tracking-wider font-['Outfit']">
                            Technical Parameters
                        </h4>
                        <div><strong>Max Capacity (Max):</strong> {inst.capacity || 'N/A'} kg</div>
                        <div><strong>Scale Interval (e):</strong> {inst.e_value || 'N/A'} g</div>
                        <div><strong>Facility:</strong> {lab.name || 'Metrology Lab'} ({lab.location || 'HQ'})</div>
                        <div><strong>Ambient:</strong> {lab.temperature || 20}°C, {lab.humidity || 50}% RH, {lab.voltage || 220}V</div>
                    </div>
                </div>

                {/* Test Results Summary Table */}
                <h4 className="mt-3 mb-2 text-xs font-bold text-[#1C1A17] uppercase tracking-wider font-['Outfit']">
                    Summary of Metrological Evaluations
                </h4>
                <table className="w-full text-[10.5px] border-collapse mb-4 border border-[#DED7C8] rounded-[13px] overflow-hidden">
                    <thead>
                        <tr className="bg-[#EAE4D6] text-[#1C1A17] border-b border-[#DED7C8]">
                            <th className="p-2 text-left font-bold text-[10px] uppercase">Evaluation Module</th>
                            <th className="p-2 text-left font-bold text-[10px] uppercase">Standard Limit / MPE</th>
                            <th className="p-2 text-center font-bold text-[10px] uppercase">Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        {report.form0_results && (
                            <tr className="border-b border-[#DED7C8]">
                                <td className="p-2">1. Visual & Construction Inspection</td>
                                <td className="p-2">Markings, sealing, display legible and intact</td>
                                <td className="p-2 text-center text-[#2D5A27] font-bold">PASS</td>
                            </tr>
                        )}
                        {report.form1_results && (
                            <tr className="border-b border-[#DED7C8]">
                                <td className="p-2">2. Weighing Performance (Asc & Desc)</td>
                                <td className="p-2">OIML R-76 Table 1 MPE Tier Boundaries</td>
                                <td className={`p-2 text-center font-bold ${testStatus.weighing === 'PASS' ? 'text-[#2D5A27]' : 'text-[#8B2522]'}`}>{testStatus.weighing}</td>
                            </tr>
                        )}
                        {report.form2_results && (
                            <tr className="border-b border-[#DED7C8]">
                                <td className="p-2">3. Repeatability Test</td>
                                <td className="p-2">Max diff ≤ 1.0 e at ½ Max Load</td>
                                <td className={`p-2 text-center font-bold ${testStatus.repeatability === 'PASS' ? 'text-[#2D5A27]' : 'text-[#8B2522]'}`}>{testStatus.repeatability}</td>
                            </tr>
                        )}
                        {report.form3_results && (
                            <tr className="border-b border-[#DED7C8]">
                                <td className="p-2">4. Eccentricity Off-Center Test</td>
                                <td className="p-2">5 loading positions ≤ MPE</td>
                                <td className={`p-2 text-center font-bold ${testStatus.eccentricity === 'PASS' ? 'text-[#2D5A27]' : 'text-[#8B2522]'}`}>{testStatus.eccentricity}</td>
                            </tr>
                        )}
                        {report.form_zero_results && (
                            <tr className="border-b border-[#DED7C8]">
                                <td className="p-2">5. Zero-Setting Accuracy</td>
                                <td className="p-2">Limit: ±0.25 e</td>
                                <td className={`p-2 text-center font-bold ${testStatus.zero === 'PASS' ? 'text-[#2D5A27]' : 'text-[#8B2522]'}`}>{testStatus.zero}</td>
                            </tr>
                        )}
                        {report.form_tare_results && (
                            <tr className="border-b border-[#DED7C8]">
                                <td className="p-2">6. Tare Accuracy Test</td>
                                <td className="p-2">Tolerance: 1.0 × MPE</td>
                                <td className={`p-2 text-center font-bold ${testStatus.tare === 'PASS' ? 'text-[#2D5A27]' : 'text-[#8B2522]'}`}>{testStatus.tare}</td>
                            </tr>
                        )}
                        {report.form_tilt_results && (
                            <tr className="border-b border-[#DED7C8]">
                                <td className="p-2">8. Tilt Test</td>
                                <td className="p-2">Limit: 1.0 e</td>
                                <td className={`p-2 text-center font-bold ${testStatus.tilt === 'PASS' ? 'text-[#2D5A27]' : 'text-[#8B2522]'}`}>{testStatus.tilt}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Signatures */}
                <div className="mt-8 flex justify-between pt-5 border-t border-[#DED7C8] text-[11px]">
                    <div>
                        <div className="h-8 border-b border-[#1C1A17] w-44 mb-1"></div>
                        <div><strong>Verification Officer / Tester</strong></div>
                        <div className="text-[#7A7469]">Name: {report.createdBy || 'Authorized Tester'}</div>
                    </div>
                    <div>
                        <div className="h-8 border-b border-[#1C1A17] w-44 mb-1"></div>
                        <div><strong>Approving Authority / Seal</strong></div>
                        <div className="text-[#7A7469]">Legal Metrology Department</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

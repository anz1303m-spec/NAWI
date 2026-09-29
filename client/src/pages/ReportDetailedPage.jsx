import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { SkeletonReportPage } from '../components/SkeletonLoader';
import { getOptimizedCloudinaryUrl } from '../utils/cloudinaryUrl';

import { exportReportToDoc, exportReportToJson } from '../utils/exportUtils';

export default function ReportDetailedPage() {
    const { id } = useParams();
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
                <Header title="Detailed Metrological Analysis" />
                <div className="app-content">
                    <SkeletonReportPage />
                </div>
            </div>
        </div>
    );
    if (!report) return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center text-[#991B1B] font-bold">
            Report not found!
        </div>
    );

    const f1r = report.form1_results || {};
    const f2r = report.form2_results || {};
    const f3r = report.form3_results || {};
    const fZr = report.form_zero_results || {};
    const fTar = report.form_tare_results || {};
    const fTilr = report.form_tilt_results || {};

    let evReg = report.evidence_register || [];
    if (evReg.length === 0 && report.instrument_photo) {
        evReg = [{ id: "EV-001", type: "Photo", description: "Instrument Front View", related_test: "General / Administrative", file_data: report.instrument_photo }];
    }

    const renderProofThumbnail = (proofKey, label) => {
        const proof = report.reading_proofs?.[proofKey];
        if (!proof || !proof.url) return <span className="text-[#7A7469] text-[11px] italic">No proof uploaded</span>;

        return (
            <div className="flex items-center gap-2.5 bg-[#EAE4D6] p-2 rounded-[11px] border border-[#DED7C8] min-w-[180px] shadow-[inset_1px_1px_3px_#DBD3C3]">
                <img 
                    src={getOptimizedCloudinaryUrl(proof.url, 200)} 
                    alt={label || proofKey} 
                    className="w-11 h-11 object-cover rounded-[8px] border border-[#DED7C8] cursor-pointer"
                    onClick={() => window.open(proof.url, '_blank')}
                    title="View full evidence image"
                />
                <div className="text-[11px] text-[#1C1A17] leading-tight">
                    <div className="text-[#2D5A27] font-bold text-[10px] mb-0.5">
                        <i className="fas fa-check-circle mr-1"></i> VERIFIED
                    </div>
                    <div className="font-mono text-[10px] text-[#5C5852]">
                        <i className="fas fa-clock mr-1"></i> {proof.timestamp ? new Date(proof.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Timestamped'}
                    </div>
                    <div className="text-[10px] text-[#7A7469] mt-0.5">
                        <i className="fas fa-map-marker-alt mr-1 text-[#5C5852]"></i>
                        {proof.locationText || (proof.latitude ? `${proof.latitude.toFixed(2)}, ${proof.longitude.toFixed(2)}` : 'GPS Tagged')}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title={`Detailed Analysis: TP-${report._id.substring(0, 8).toUpperCase()}`} />
                <div className="app-content">
                    <div className="flex justify-between items-center flex-wrap gap-3 mb-6">
                        <div>
                            <span className="text-[10px] font-bold text-[#7A7469] uppercase tracking-widest block mb-0.5">
                                Granular Tolerance Calculations
                            </span>
                            <h2 className="text-xl md:text-2xl font-bold text-[#1C1A17] font-['Outfit'] uppercase tracking-tight m-0">
                                Observations & Metrological Proofs
                            </h2>
                            <p className="text-xs text-[#5C5852] mt-0.5 mb-0">
                                Detailed readings, error calculations, and photo evidence submitted for review.
                            </p>
                        </div>
                        <div className="flex gap-2.5 items-center flex-wrap">
                            <button className="btn-secondary px-3.5 py-2 text-xs font-bold" onClick={() => exportReportToDoc(report)} title="Export Editable Word Document">
                                <i className="fas fa-file-word text-[#2563EB]"></i> Export Word (.doc)
                            </button>
                            <button className="btn-secondary px-3.5 py-2 text-xs font-bold" onClick={() => exportReportToJson(report)} title="Export Raw JSON Data">
                                <i className="fas fa-file-code text-[#0D9488]"></i> Export JSON
                            </button>
                            {user?.role === 'admin' && (
                                <button className="btn px-4 py-2 text-xs font-bold" onClick={() => window.open(`/certificate/${report._id}`, '_blank')}>
                                    <i className="fas fa-file-pdf"></i> Printable Certificate
                                </button>
                            )}
                            {user?.role === 'viewer' ? (
                                <Link to="/viewer" className="btn-secondary px-4 py-2 text-xs font-bold">
                                    <i className="fas fa-arrow-left"></i> Review Queue
                                </Link>
                            ) : (
                                <Link to={`/report/${report._id}`} className="btn-secondary px-4 py-2 text-xs font-bold">
                                    <i className="fas fa-arrow-left"></i> Report Summary
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Weighing Performance */}
                    {Object.keys(f1r).length > 0 && (
                        <div className="tactile-raised mb-6">
                            <h3 className="m-0 pb-3 border-b border-[#DED7C8] text-xs font-bold text-[#1C1A17] uppercase tracking-wider font-['Outfit']">
                                <i className="fas fa-weight mr-1.5 text-[#5C5852]"></i> Weighing Performance & Reading Proofs (OIML R 76-1 Clause 3.5.1)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs mt-3">
                                    <thead>
                                        <tr>
                                            <th>Load (kg)</th>
                                            <th>Direction</th>
                                            <th>Observed (kg)</th>
                                            <th>Error (g)</th>
                                            <th>MPE Limit (g)</th>
                                            <th>Reading Photo Proof</th>
                                            <th>{user?.role === 'tester' ? 'Status' : 'Compliance'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.values(f1r).map((row, idx) => {
                                            if (row.load_g === undefined) return null;
                                            const ascFail = row.asc_status === 'FAIL';
                                            const descFail = row.desc_status === 'FAIL';
                                            return (
                                                <React.Fragment key={idx}>
                                                    <tr className={user?.role !== 'tester' && ascFail ? 'bg-[#F5DDDC]/40' : ''}>
                                                        <td rowSpan="2" className="font-bold border-b border-[#DED7C8] align-middle">{row.load_g}</td>
                                                        <td>Ascending</td>
                                                        <td>{row.asc_reading}</td>
                                                        <td className={`font-mono ${user?.role !== 'tester' && ascFail ? 'text-[#8B2522] font-bold' : ''}`}>{(row.asc_error * 1000).toFixed(1)} g</td>
                                                        <td className="font-mono">±{(row.limit * 1000).toFixed(1)} g</td>
                                                        <td rowSpan="2" className="border-b border-[#DED7C8] align-middle">
                                                            {renderProofThumbnail(`weighing_${row.load_g}`, `Load ${row.load_g}g Proof`)}
                                                        </td>
                                                        <td>
                                                            {user?.role === 'tester' ? (
                                                                <span className="status-badge status-neutral">
                                                                    <i className="fas fa-check-circle mr-1"></i> RECORDED
                                                                </span>
                                                            ) : (
                                                                <span className={`status-badge ${ascFail ? 'status-fail' : 'status-pass'}`}>{row.asc_status}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    <tr className={`border-b border-[#DED7C8] ${user?.role !== 'tester' && descFail ? 'bg-[#F5DDDC]/40' : ''}`}>
                                                        <td>Descending</td>
                                                        <td>{row.desc_reading}</td>
                                                        <td className={`font-mono ${user?.role !== 'tester' && descFail ? 'text-[#8B2522] font-bold' : ''}`}>{(row.desc_error * 1000).toFixed(1)} g</td>
                                                        <td className="font-mono">±{(row.limit * 1000).toFixed(1)} g</td>
                                                        <td>
                                                            {user?.role === 'tester' ? (
                                                                <span className="status-badge status-neutral">
                                                                    <i className="fas fa-check-circle mr-1"></i> RECORDED
                                                                </span>
                                                            ) : (
                                                                <span className={`status-badge ${descFail ? 'status-fail' : 'status-pass'}`}>{row.desc_status}</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3 p-3 bg-[#EAE4D6] border border-[#DED7C8] rounded-[11px] text-xs text-[#1C1A17] shadow-[inset_1px_1px_3px_#DBD3C3]">
                                <strong><i className="fas fa-calculator mr-1"></i> Metrological Proof:</strong> Error <em>E = Indication (I) - Target Load (L)</em>. Evaluated across load steps (&plusmn;0.5e, &plusmn;1.0e, &plusmn;1.5e) for Class <strong>{report.instrument_data?.Class_value || report.accuracy_class || 'III'}</strong> with verification interval <em>e = {report.instrument_data?.e_value || 10} g</em>.
                            </div>
                        </div>
                    )}

                    {/* Repeatability */}
                    {f2r.Repeatability && (
                        <div className="tactile-raised mb-6">
                            <h3 className="m-0 pb-3 border-b border-[#DED7C8] text-xs font-bold text-[#1C1A17] uppercase tracking-wider font-['Outfit']">
                                <i className="fas fa-sync-alt mr-1.5 text-[#5C5852]"></i> Repeatability Test & Proofs (OIML R 76-1 Clause 3.6.1)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs mt-3">
                                    <thead>
                                        <tr>
                                            <th>Test Load (kg)</th>
                                            <th>Max Reading (kg)</th>
                                            <th>Min Reading (kg)</th>
                                            <th>Spread (g)</th>
                                            <th>MPE Limit (g)</th>
                                            <th>Reading Photo Proofs</th>
                                            <th>{user?.role === 'tester' ? 'Status' : 'Compliance'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>{f2r.testLoad}</td>
                                            <td>{f2r.max}</td>
                                            <td>{f2r.min}</td>
                                            <td className="font-mono">{((f2r.range || 0) * 1000).toFixed(1)} g</td>
                                            <td className="font-mono">±{((f2r.limit || 0) * 1000).toFixed(1)} g</td>
                                            <td>
                                                <div className="flex flex-wrap gap-2">
                                                    {renderProofThumbnail('repeatability_r1', 'Reading 1')}
                                                    {renderProofThumbnail('repeatability_r2', 'Reading 2')}
                                                    {renderProofThumbnail('repeatability_r3', 'Reading 3')}
                                                </div>
                                            </td>
                                            <td>
                                                {user?.role === 'tester' ? (
                                                    <span className="status-badge status-neutral">
                                                        <i className="fas fa-check-circle mr-1"></i> RECORDED
                                                    </span>
                                                ) : (
                                                    <span className={`status-badge ${f2r.Repeatability === 'PASS' ? 'status-pass' : 'status-fail'}`}>{f2r.Repeatability}</span>
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3 p-3 bg-[#EAE4D6] border border-[#DED7C8] rounded-[11px] text-xs text-[#1C1A17] shadow-[inset_1px_1px_3px_#DBD3C3]">
                                <strong><i className="fas fa-calculator mr-1"></i> Metrological Proof:</strong> Spread <em>&Delta;I = I_max - I_min = {((f2r.range || 0) * 1000).toFixed(1)} g</em> must not exceed absolute MPE limit <em>&plusmn;{((f2r.limit || 0) * 1000).toFixed(1)} g</em>.
                            </div>
                        </div>
                    )}

                    {/* Eccentricity */}
                    {f3r.details && (
                        <div className="tactile-raised mb-6">
                            <h3 className="m-0 pb-3 border-b border-[#DED7C8] text-xs font-bold text-[#1C1A17] uppercase tracking-wider font-['Outfit']">
                                <i className="fas fa-crosshairs mr-1.5 text-[#5C5852]"></i> Eccentricity Off-Center Test (OIML R 76-1 Clause 3.6.2)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs mt-3">
                                    <thead>
                                        <tr>
                                            <th>Position</th>
                                            <th>Applied (kg)</th>
                                            <th>Indication (kg)</th>
                                            <th>Error (g)</th>
                                            <th>MPE Limit (g)</th>
                                            <th>Position Proof</th>
                                            <th>{user?.role === 'tester' ? 'Status' : 'Compliance'}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(f3r.details).map(([pos, d]) => (
                                            <tr key={pos}>
                                                <td className="capitalize font-bold">{pos}</td>
                                                <td>{d.appliedLoad}</td>
                                                <td>{d.indication}</td>
                                                <td className="font-mono">{(d.error * 1000).toFixed(1)} g</td>
                                                <td className="font-mono">±{(d.limit * 1000).toFixed(1)} g</td>
                                                <td>
                                                    {renderProofThumbnail(`eccentricity_${pos}`, `${pos} Position Proof`)}
                                                </td>
                                                <td>
                                                    {user?.role === 'tester' ? (
                                                        <span className="status-badge status-neutral">
                                                            <i className="fas fa-check-circle mr-1"></i> RECORDED
                                                        </span>
                                                    ) : (
                                                        <span className={`status-badge ${d.result === 'PASS' ? 'status-pass' : 'status-fail'}`}>{d.result}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3 p-3 bg-[#EAE4D6] border border-[#DED7C8] rounded-[11px] text-xs text-[#1C1A17] shadow-[inset_1px_1px_3px_#DBD3C3]">
                                <strong><i className="fas fa-calculator mr-1"></i> Metrological Proof:</strong> Error at each quadrant <em>E_pos = I_pos - L_ecc</em> with 1/3 Max capacity load applied off-center.
                            </div>
                        </div>
                    )}

                    {/* Zero, Tare, Tilt */}
                    {[
                        { name: "Zero-Setting Test", data: fZr, resKey: "ZeroSetting", proofKey: "zero_setting", clause: "Clause 3.8.1", rule: "E_0 = I_0 - 0 <= ±0.25e" },
                        { name: "Tare Accuracy Test", data: fTar, resKey: "TareAccuracy", proofKey: "tare_accuracy", clause: "Clause 3.5.3.4", rule: "E_net = I_net - L_net <= MPE" },
                        { name: "Tilt Test", data: fTilr, resKey: "TiltTest", proofKey: "tilt_test", clause: "Clause 3.9.1", rule: "E_tilt <= MPE under max inclination" }
                    ].map(t => {
                        if (!t.data || !t.data[t.resKey]) return null;
                        return (
                            <div className="tactile-raised mb-6" key={t.name}>
                                <h3 className="m-0 pb-3 border-b border-[#DED7C8] text-xs font-bold text-[#1C1A17] uppercase tracking-wider font-['Outfit']">
                                    {t.name} & Proof (OIML R 76-1 {t.clause})
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs mt-3">
                                        <thead>
                                            <tr>
                                                <th>Parameter</th>
                                                <th>Observed Error</th>
                                                <th>Permissible Limit</th>
                                                <th>Observation Proof</th>
                                                <th>{user?.role === 'tester' ? 'Status' : 'Compliance'}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Measured Variation</td>
                                                <td className="font-mono">{t.data.error_g !== undefined ? `${t.data.error_g} g` : `${t.data.x_error_g || 0} g`}</td>
                                                <td className="font-mono">±{t.data.limit_g !== undefined ? `${t.data.limit_g} g` : '1.0 e'}</td>
                                                <td>
                                                    {renderProofThumbnail(t.proofKey, t.name)}
                                                </td>
                                                <td>
                                                    {user?.role === 'tester' ? (
                                                        <span className="status-badge status-neutral">
                                                            <i className="fas fa-check-circle mr-1"></i> RECORDED
                                                        </span>
                                                    ) : (
                                                        <span className={`status-badge ${t.data[t.resKey] === 'PASS' ? 'status-pass' : 'status-fail'}`}>{t.data[t.resKey]}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-3 p-3 bg-[#EAE4D6] border border-[#DED7C8] rounded-[11px] text-xs text-[#1C1A17] shadow-[inset_1px_1px_3px_#DBD3C3]">
                                    <strong>Clause Calculation Rule:</strong> {t.rule}
                                </div>
                            </div>
                        );
                    })}

                    {/* Evidence Register */}
                    <div className="tactile-raised">
                        <h3 className="m-0 pb-3 border-b border-[#DED7C8] text-xs font-bold text-[#1C1A17] uppercase tracking-wider font-['Outfit']">
                            <i className="fas fa-folder-open mr-1.5 text-[#5C5852]"></i> Administrative Evidence Register (OIML R 76-2)
                        </h3>
                        {evReg.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs mt-3">
                                    <thead>
                                        <tr>
                                            <th>Evidence ID</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                            <th>Related Module</th>
                                            <th>Attachment / Preview</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {evReg.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="font-bold font-mono">{item.id}</td>
                                                <td><span className="bg-[#EAE4D6] border border-[#DED7C8] px-2 py-0.5 rounded-[6px] text-[10px] font-bold uppercase">{item.type}</span></td>
                                                <td>{item.description}</td>
                                                <td>{item.related_test}</td>
                                                <td>
                                                    {item.file_data && item.file_data.startsWith("data:image") ? (
                                                        <img src={item.file_data} alt="Evidence preview" className="max-h-12 max-w-20 rounded-[6px] border border-[#DED7C8] cursor-pointer" onClick={() => window.open(item.file_data, '_blank')} />
                                                    ) : item.filename ? (
                                                        <span className="text-[#1C1A17] text-xs font-bold"><i className="fas fa-paperclip mr-1 text-[#5C5852]"></i> {item.filename}</span>
                                                    ) : (
                                                        <span className="text-[#7A7469] text-xs">Document Attached</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-[#7A7469] py-4 text-xs m-0">No evidence items registered.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

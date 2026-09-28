import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { getMPE } from '../utils/r76engine';
import ReadingPhotoUploader from '../components/ReadingPhotoUploader';
import { clearApiCache } from '../utils/apiCache';

export default function TestExecutionPage() {
    const navigate = useNavigate();
    const { authFetch } = useAuth();

    const [testsToRun, setTestsToRun] = useState([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [saving, setSaving] = useState(false);

    // Instrument parameters
    const maxKg = Number(localStorage.getItem("Capacity")) || 1000;
    const eG = Number(localStorage.getItem("eValue")) || 10;
    const cls = localStorage.getItem("ClassValue") || "class III";

    // Test form states
    const [form0, setForm0] = useState({
        marking: true, construction: true, display: true, keyboard: true, sealing: true, levelling: true
    });

    const [weighingReadings, setWeighingReadings] = useState({});
    const [repeatabilityReadings, setRepeatabilityReadings] = useState({});
    const [eccentricityReadings, setEccentricityReadings] = useState({
        front: '', right: '', rear: '', left: '', center: ''
    });
    const [zeroReading, setZeroReading] = useState({ indication: '' });
    const [tareReading, setTareReading] = useState({ tare_load: '', net_indication: '' });
    const [tiltReading, setTiltReading] = useState({ ref: '', tilt_x: '', tilt_y: '' });

    // Reading Photo Proofs Map & Evidence Register
    const [readingProofs, setReadingProofs] = useState({});
    const [evidenceList, setEvidenceList] = useState([]);

    const handleProofUploaded = (key, proofObj) => {
        setReadingProofs(prev => ({
            ...prev,
            [key]: proofObj
        }));
    };

    useEffect(() => {
        const rawPlan = localStorage.getItem("confirmedTestPlan") || localStorage.getItem("testPlan");
        if (!rawPlan) {
            navigate('/test-plan');
            return;
        }

        const fullPlan = JSON.parse(rawPlan);
        const req = fullPlan.filter(t => t.status === "REQUIRED");
        if (req.length === 0) {
            navigate('/test-plan');
            return;
        }
        setTestsToRun(req);

        // Initialize weighing test points with empty input values
        const test2 = req.find(t => t.id === 2);
        if (test2 && test2.testPoints) {
            const initial = {};
            test2.testPoints.filter(p => p > 0).forEach(p => {
                initial[p] = {
                    asc: '',
                    desc: ''
                };
            });
            setWeighingReadings(initial);
        }

        // Initialize repeatability with empty input values
        const test3 = req.find(t => t.id === 3);
        if (test3) {
            const initRep = {};
            for (let i = 1; i <= test3.readings; i++) {
                initRep[`Value_${i}`] = '';
            }
            setRepeatabilityReadings(initRep);
        }

        // Initialize eccentricity load with empty input values
        const test4 = req.find(t => t.id === 4);
        if (test4) {
            setEccentricityReadings({
                front: '', right: '', rear: '', left: '', center: ''
            });
        }
    }, [navigate]);

    if (testsToRun.length === 0) return null;

    const currentTest = testsToRun[currentIdx];
    const isLastTest = currentIdx === testsToRun.length - 1;

    const calculateWeighingResults = () => {
        const results = {};
        for (let loadG in weighingReadings) {
            const row = weighingReadings[loadG];
            const loadKg = Number(loadG) / 1000;
            const ascKg = Number(row.asc);
            const descKg = Number(row.desc);

            const mpe_e = getMPE(loadKg * 1000, cls, eG);
            const mpeKg = (mpe_e * eG) / 1000;

            const errorAsc = !isNaN(ascKg) ? ascKg - loadKg : 0;
            const errorDesc = !isNaN(descKg) ? descKg - loadKg : 0;

            const passAsc = Math.abs(errorAsc) <= mpeKg;
            const passDesc = Math.abs(errorDesc) <= mpeKg;

            results[loadG] = {
                loadKg,
                ascKg,
                descKg,
                mpeKg,
                mpe_e,
                errorAsc,
                errorDesc,
                status: passAsc && passDesc ? "PASS" : "FAIL"
            };
        }
        return results;
    };

    const calculateRepeatabilityResults = () => {
        const values = Object.values(repeatabilityReadings).map(Number).filter(v => !isNaN(v) && v > 0);
        if (values.length === 0) return { status: "PASS", spreadKg: 0 };
        const min = Math.min(...values);
        const max = Math.max(...values);
        const spreadKg = max - min;
        const limitKg = eG / 1000; // 1.0 e
        return {
            status: spreadKg <= limitKg ? "PASS" : "FAIL",
            min,
            max,
            spreadKg,
            limitKg
        };
    };

    const calculateEccentricityResults = () => {
        const test4 = testsToRun.find(t => t.id === 4);
        const loadG = test4?.load || (maxKg * 1000) / 3;
        const loadKg = loadG / 1000;
        const mpe_e = getMPE(loadG, cls, eG);
        const mpeKg = (mpe_e * eG) / 1000;

        let pass = true;
        const details = {};

        for (let pos of ['front', 'right', 'rear', 'left', 'center']) {
            const val = Number(eccentricityReadings[pos]);
            const err = !isNaN(val) ? val - loadKg : 0;
            const ok = Math.abs(err) <= mpeKg;
            if (!ok) pass = false;
            details[pos] = { val, err, ok };
        }

        return {
            status: pass ? "PASS" : "FAIL",
            loadKg,
            mpeKg,
            details
        };
    };

    const calculateZeroResults = () => {
        const val = Number(zeroReading.indication) || 0;
        const limitKg = (0.25 * eG) / 1000;
        return {
            status: Math.abs(val) <= limitKg ? "PASS" : "FAIL",
            val,
            limitKg
        };
    };

    const calculateTareResults = () => {
        const net = Number(tareReading.net_indication) || 0;
        const tareLoad = Number(tareReading.tare_load) || 0;
        const mpe_e = getMPE(tareLoad * 1000, cls, eG);
        const mpeKg = (mpe_e * eG) / 1000;
        const err = net - tareLoad;
        return {
            status: Math.abs(err) <= mpeKg ? "PASS" : "FAIL",
            err,
            mpeKg
        };
    };

    const calculateTiltResults = () => {
        const ref = Number(tiltReading.ref) || 0;
        const tx = Number(tiltReading.tilt_x) || 0;
        const ty = Number(tiltReading.tilt_y) || 0;
        const limitKg = (1.0 * eG) / 1000;
        const errX = Math.abs(tx - ref);
        const errY = Math.abs(ty - ref);
        return {
            status: errX <= limitKg && errY <= limitKg ? "PASS" : "FAIL",
            errX,
            errY,
            limitKg
        };
    };

    const validateCurrentTestStep = () => {
        const testId = currentTest.id;
        if (testId === 2) {
            for (let load in weighingReadings) {
                if (weighingReadings[load].asc === '' || weighingReadings[load].desc === '') {
                    alert("Please fill in both ascending and descending readings for all load points before proceeding.");
                    return false;
                }
            }
        } else if (testId === 3) {
            for (let k in repeatabilityReadings) {
                if (repeatabilityReadings[k] === undefined || repeatabilityReadings[k] === '') {
                    alert("Please fill in all repeatability test readings before proceeding.");
                    return false;
                }
            }
        } else if (testId === 4) {
            const positions = ['front', 'right', 'rear', 'left', 'center'];
            for (let pos of positions) {
                if (eccentricityReadings[pos] === undefined || eccentricityReadings[pos] === '') {
                    alert("Please fill in eccentricity readings for all positions (front, right, rear, left, center) before proceeding.");
                    return false;
                }
            }
        } else if (testId === 5) {
            if (zeroReading.indication === undefined || zeroReading.indication === '') {
                alert("Please fill in the Zero Indication Reading before proceeding.");
                return false;
            }
        } else if (testId === 6) {
            if (!tareReading.tare_load || !tareReading.net_indication) {
                alert("Please fill in Tare Load Applied and Net Indication After Tare before proceeding.");
                return false;
            }
        } else if (testId === 8) {
            if (!tiltReading.ref || !tiltReading.tilt_x || !tiltReading.tilt_y) {
                alert("Please fill in all Tilt Test observation readings (Level Reference, X-Axis, Y-Axis) before proceeding.");
                return false;
            }
        }
        return true;
    };

    const handleSaveReport = async () => {
        if (!validateCurrentTestStep()) return;

        setSaving(true);
        try {
            const instData = JSON.parse(localStorage.getItem("InstrumentData") || "{}");
            const labDetails = JSON.parse(localStorage.getItem("LabDetails") || "{}");
            const adminEvidence = JSON.parse(localStorage.getItem("AdministrativeEvidence") || "{}");
            const photo = localStorage.getItem("InstrumentPhoto") || "";
            const ruleVer = localStorage.getItem("RuleSetVersion") || "OIML R-76 V1";
            const fullPlan = JSON.parse(localStorage.getItem("confirmedTestPlan") || localStorage.getItem("testPlan") || "[]");

            const f0Res = { visual: true };
            const f1Res = calculateWeighingResults();
            const f2Res = calculateRepeatabilityResults();
            const f3Res = calculateEccentricityResults();
            const fZeroRes = calculateZeroResults();
            const fTareRes = calculateTareResults();
            const fTiltRes = calculateTiltResults();

            const body = {
                instrument: instData,
                testPlan: fullPlan,
                form0,
                form0_results: f0Res,
                form1: weighingReadings,
                form1_results: f1Res,
                form2: repeatabilityReadings,
                form2_results: f2Res,
                form3: eccentricityReadings,
                form3_results: f3Res,
                form_zero: zeroReading,
                form_zero_results: fZeroRes,
                form_tare: tareReading,
                form_tare_results: fTareRes,
                form_tilt: tiltReading,
                form_tilt_results: fTiltRes,
                reading_proofs: readingProofs,
                lab_details: labDetails,
                instrument_photo: photo,
                administrative_evidence: adminEvidence,
                evidence_register: evidenceList,
                rule_set_version: ruleVer
            };

            const res = await authFetch('/api/save-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save failed");

            clearApiCache();
            localStorage.removeItem("InstrumentData");
            localStorage.removeItem("confirmedTestPlan");

            navigate(`/report/${data.id}`);
        } catch (err) {
            alert("Failed to save report: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title={`Guided Test Execution: ${currentTest.name}`} />
                <div className="app-content">
                    {/* Progress Bar: Tactile Recessed Well */}
                    <div className="tactile-raised mb-6 p-4">
                        <div className="flex justify-between items-center mb-2 text-xs font-bold text-[#1C1A17]">
                            <span className="uppercase tracking-wider">Step {currentIdx + 1} of {testsToRun.length}: {currentTest.name}</span>
                            <span className="font-mono text-[#5C5852]">{Math.round(((currentIdx + 1) / testsToRun.length) * 100)}% Completed</span>
                        </div>
                        <div className="h-2.5 bg-[#EAE4D6] rounded-[6px] border border-[#DED7C8] overflow-hidden shadow-[inset_1px_1px_3px_#DBD3C3]">
                            <div 
                                className="h-full bg-[#1C1A17] transition-all duration-300"
                                style={{ width: `${((currentIdx + 1) / testsToRun.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Active Test Card: Tactile Convex Surface */}
                    <div className="tactile-raised">
                        <div className="flex items-center gap-3.5 pb-4 mb-5 border-b border-[#DED7C8]">
                            <div className="w-11 h-11 bg-[#1C1A17] text-[#F4F0E8] rounded-[13px] grid place-items-center text-lg shadow-[2px_2px_5px_#DBD3C3]">
                                <i className={currentTest.icon}></i>
                            </div>
                            <div>
                                <h3 className="m-0 text-sm font-bold text-[#1C1A17] font-['Outfit'] uppercase tracking-wide">
                                    {currentTest.id}. {currentTest.name}
                                </h3>
                                <p className="m-0 text-xs text-[#5C5852]">{currentTest.note}</p>
                            </div>
                        </div>

                        {/* TEST 1: Visual Inspection */}
                        {currentTest.id === 1 && (
                            <div>
                                <h4 className="text-xs font-bold text-[#1C1A17] uppercase tracking-wider mb-3">
                                    Physical & Metrological Checklist Observations
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                    {[
                                        { key: 'marking', label: 'Markings complete, indelible and legible' },
                                        { key: 'construction', label: 'Mechanical construction satisfactory' },
                                        { key: 'display', label: 'Display and indication fully functional' },
                                        { key: 'keyboard', label: 'Switches and keys operational' },
                                        { key: 'sealing', label: 'Sealing and verification marks intact' },
                                        { key: 'levelling', label: 'Instrument stable and levelled' }
                                    ].map(item => (
                                        <label key={item.key} className="flex items-center gap-3 bg-[#EAE4D6] p-3 rounded-[11px] border border-[#DED7C8] cursor-pointer shadow-[inset_1px_1px_3px_#DBD3C3]">
                                            <input
                                                type="checkbox"
                                                checked={form0[item.key]}
                                                onChange={e => setForm0(prev => ({ ...prev, [item.key]: e.target.checked }))}
                                                className="w-4 h-4 accent-[#1C1A17] cursor-pointer"
                                            />
                                            <span className="text-xs text-[#1C1A17] font-semibold">{item.label}</span>
                                        </label>
                                    ))}
                                </div>
                                <div className="mt-5">
                                    <ReadingPhotoUploader
                                        readingKey="visual_inspection"
                                        label="Visual Inspection Reading Photo Proof"
                                        currentProof={readingProofs["visual_inspection"]}
                                        onProofUploaded={handleProofUploaded}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TEST 2: Weighing Performance */}
                        {currentTest.id === 2 && (
                            <div>
                                <h4 className="text-xs font-bold text-[#1C1A17] uppercase tracking-wider mb-3">
                                    Ascending & Descending Load Indication Readings
                                </h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr>
                                                <th>LOAD</th>
                                                <th>ASCENDING (KG)</th>
                                                <th>DESCENDING (KG)</th>
                                                <th>READING PHOTO PROOF</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.keys(weighingReadings).map(loadG => {
                                                const loadKg = Number(loadG) / 1000;
                                                return (
                                                    <tr key={loadG}>
                                                        <td><strong>{loadKg >= 1 ? `${loadKg} kg` : `${loadG} g`}</strong></td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                placeholder="Observed reading"
                                                                className="form-input w-36 text-xs"
                                                                value={weighingReadings[loadG].asc}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    setWeighingReadings(prev => ({
                                                                        ...prev,
                                                                        [loadG]: { ...prev[loadG], asc: val }
                                                                    }));
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                placeholder="Observed reading"
                                                                className="form-input w-36 text-xs"
                                                                value={weighingReadings[loadG].desc}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    setWeighingReadings(prev => ({
                                                                        ...prev,
                                                                        [loadG]: { ...prev[loadG], desc: val }
                                                                    }));
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <ReadingPhotoUploader
                                                                readingKey={`weighing_${loadG}`}
                                                                label={`Load ${loadKg}kg Proof`}
                                                                currentProof={readingProofs[`weighing_${loadG}`]}
                                                                onProofUploaded={handleProofUploaded}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TEST 3: Repeatability */}
                        {currentTest.id === 3 && (
                            <div>
                                <h4 className="text-xs font-bold text-[#1C1A17] uppercase tracking-wider mb-1">
                                    Repeatability Test Observations
                                </h4>
                                <p className="text-xs text-[#5C5852] mb-4">
                                    Applied Half-Capacity Test Load: <strong>{(currentTest.load / 1000).toFixed(3)} kg</strong>
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
                                    {Object.keys(repeatabilityReadings).map((key, i) => (
                                        <div key={key} className="p-3.5 bg-[#EAE4D6] rounded-[13px] border border-[#DED7C8] shadow-[inset_1px_1px_3px_#DBD3C3]">
                                            <label className="text-[11px] font-bold text-[#1C1A17] uppercase tracking-wider block mb-1">
                                                Reading {i + 1} (kg)
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                placeholder="Observed value"
                                                className="form-input mb-2 text-xs"
                                                value={repeatabilityReadings[key]}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setRepeatabilityReadings(prev => ({ ...prev, [key]: val }));
                                                }}
                                            />
                                            <ReadingPhotoUploader
                                                readingKey={`repeatability_${key}`}
                                                label={`Reading ${i+1} Proof`}
                                                currentProof={readingProofs[`repeatability_${key}`]}
                                                onProofUploaded={handleProofUploaded}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TEST 4: Eccentricity */}
                        {currentTest.id === 4 && (
                            <div>
                                <h4 className="text-xs font-bold text-[#1C1A17] uppercase tracking-wider mb-1">
                                    Eccentricity Off-Center Loading (1/3 Load)
                                </h4>
                                <p className="text-xs text-[#5C5852] mb-4">
                                    Applied Test Load: <strong>{(currentTest.load / 1000).toFixed(3)} kg</strong>
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
                                    {['front', 'right', 'rear', 'left', 'center'].map(pos => (
                                        <div key={pos} className="p-3.5 bg-[#EAE4D6] rounded-[13px] border border-[#DED7C8] shadow-[inset_1px_1px_3px_#DBD3C3]">
                                            <label className="text-[11px] font-bold text-[#1C1A17] uppercase tracking-wider block mb-1">
                                                {pos} Position Reading (kg)
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                placeholder="Observed value"
                                                className="form-input mb-2 text-xs"
                                                value={eccentricityReadings[pos]}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setEccentricityReadings(prev => ({ ...prev, [pos]: val }));
                                                }}
                                            />
                                            <ReadingPhotoUploader
                                                readingKey={`eccentricity_${pos}`}
                                                label={`${pos.toUpperCase()} Proof`}
                                                currentProof={readingProofs[`eccentricity_${pos}`]}
                                                onProofUploaded={handleProofUploaded}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* TEST 5: Zero Setting */}
                        {currentTest.id === 5 && (
                            <div>
                                <h4 className="text-xs font-bold text-[#1C1A17] uppercase tracking-wider mb-3">
                                    Zero-Setting & Zero-Tracking Accuracy
                                </h4>
                                <div className="max-w-md my-4 p-4 bg-[#EAE4D6] rounded-[13px] border border-[#DED7C8] shadow-[inset_1px_1px_3px_#DBD3C3]">
                                    <label className="text-[11px] font-bold text-[#1C1A17] uppercase tracking-wider block mb-1">
                                        Zero Indication Reading (kg)
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="Observed zero value"
                                        className="form-input mb-3 text-xs"
                                        value={zeroReading.indication}
                                        onChange={e => setZeroReading({ indication: e.target.value })}
                                    />
                                    <ReadingPhotoUploader
                                        readingKey="zero_setting"
                                        label="Zero Setting Proof"
                                        currentProof={readingProofs["zero_setting"]}
                                        onProofUploaded={handleProofUploaded}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TEST 6: Tare Accuracy */}
                        {currentTest.id === 6 && (
                            <div>
                                <h4 className="text-xs font-bold text-[#1C1A17] uppercase tracking-wider mb-3">
                                    Tare Accuracy Verification
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 p-4 bg-[#EAE4D6] rounded-[13px] border border-[#DED7C8] shadow-[inset_1px_1px_3px_#DBD3C3]">
                                    <div>
                                        <label className="text-[11px] font-bold text-[#1C1A17] uppercase tracking-wider block mb-1">
                                            Tare Load Applied (kg)
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="Applied load"
                                            className="form-input text-xs"
                                            value={tareReading.tare_load}
                                            onChange={e => setTareReading(prev => ({ ...prev, tare_load: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-[#1C1A17] uppercase tracking-wider block mb-1">
                                            Net Indication After Tare (kg)
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="Observed net value"
                                            className="form-input text-xs"
                                            value={tareReading.net_indication}
                                            onChange={e => setTareReading(prev => ({ ...prev, net_indication: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <ReadingPhotoUploader
                                    readingKey="tare_accuracy"
                                    label="Tare Accuracy Photo Proof"
                                    currentProof={readingProofs["tare_accuracy"]}
                                    onProofUploaded={handleProofUploaded}
                                />
                            </div>
                        )}

                        {/* TEST 8: Tilt Test */}
                        {currentTest.id === 8 && (
                            <div>
                                <h4 className="text-xs font-bold text-[#1C1A17] uppercase tracking-wider mb-3">
                                    Tilt Test Observations (Mobile / Portable Instruments)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 p-4 bg-[#EAE4D6] rounded-[13px] border border-[#DED7C8] shadow-[inset_1px_1px_3px_#DBD3C3]">
                                    <div>
                                        <label className="text-[11px] font-bold text-[#1C1A17] uppercase tracking-wider block mb-1">
                                            Level Reference (kg)
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="Reference reading"
                                            className="form-input text-xs"
                                            value={tiltReading.ref}
                                            onChange={e => setTiltReading(prev => ({ ...prev, ref: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-[#1C1A17] uppercase tracking-wider block mb-1">
                                            X-Axis Tilt Reading (kg)
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="X tilt value"
                                            className="form-input text-xs"
                                            value={tiltReading.tilt_x}
                                            onChange={e => setTiltReading(prev => ({ ...prev, tilt_x: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-[#1C1A17] uppercase tracking-wider block mb-1">
                                            Y-Axis Tilt Reading (kg)
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder="Y tilt value"
                                            className="form-input text-xs"
                                            value={tiltReading.tilt_y}
                                            onChange={e => setTiltReading(prev => ({ ...prev, tilt_y: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <ReadingPhotoUploader
                                    readingKey="tilt_test"
                                    label="Tilt Test Observation Photo Proof"
                                    currentProof={readingProofs["tilt_test"]}
                                    onProofUploaded={handleProofUploaded}
                                />
                            </div>
                        )}
                    </div>

                    {/* Step Navigation Buttons */}
                    <div className="flex justify-between items-center mt-6">
                        <button
                            className="btn-secondary px-5 py-2.5 text-xs font-bold"
                            disabled={currentIdx === 0}
                            onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                            style={{ opacity: currentIdx === 0 ? 0.4 : 1 }}
                        >
                            &larr; Previous Step
                        </button>

                        {isLastTest ? (
                            <button
                                className="btn px-6 py-3 text-xs tracking-wider uppercase font-bold"
                                disabled={saving}
                                onClick={handleSaveReport}
                            >
                                {saving ? 'Finalizing Submission...' : 'Submit Calibration Data to Review Queue'} <i className="fas fa-paper-plane ml-1.5"></i>
                            </button>
                        ) : (
                            <button
                                className="btn px-6 py-2.5 text-xs tracking-wider uppercase font-bold"
                                onClick={() => {
                                    if (validateCurrentTestStep()) {
                                        setCurrentIdx(prev => Math.min(testsToRun.length - 1, prev + 1));
                                    }
                                }}
                            >
                                Next Step &rarr;
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

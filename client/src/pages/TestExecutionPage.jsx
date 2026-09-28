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
    const minG = Number(localStorage.getItem("minCapacity")) || (20 * eG);
    const maxG = maxKg * 1000;
    const dG = eG; // For digital instruments, d = e (OIML R-76-1 §3.1.2)
    const unit = 'kg';

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
    const [discriminationReadings, setDiscriminationReadings] = useState({
        min:     { initial: '', final: '' },
        halfMax: { initial: '', final: '' },
        max:     { initial: '', final: '' }
    });

    // Step 9 State: Time-Dependent Error (Zero Return & Creep)
    const [step9Reading, setStep9Reading] = useState({
        actualTestLoad: '',
        initialIndication: '',
        ind15min: '',
        ind30min: '',
        ind4hr: '',
        tempVar: '',
        zeroBefore: '',
        zeroAfter: '',
        loadingDuration: '30'
    });

    // Step 10 State: Stability of Equilibrium (5 trials)
    const [step10Reading, setStep10Reading] = useState({
        testLoad: '',
        trials: [
            { trialNo: 1, functionTested: 'Printing', disturbed: 'YES', executedBeforeStability: 'NO', observation: '', observedAfterOperation: '', zeroTareExecutedBefore: 'NO', zeroTareObservation: '' },
            { trialNo: 2, functionTested: 'Data storage', disturbed: 'YES', executedBeforeStability: 'NO', observation: '', observedAfterOperation: '', zeroTareExecutedBefore: 'NO', zeroTareObservation: '' },
            { trialNo: 3, functionTested: 'Zero-setting', disturbed: 'YES', executedBeforeStability: 'NO', observation: '', observedAfterOperation: '', zeroTareExecutedBefore: 'NO', zeroTareObservation: '' },
            { trialNo: 4, functionTested: 'Tare', disturbed: 'YES', executedBeforeStability: 'NO', observation: '', observedAfterOperation: '', zeroTareExecutedBefore: 'NO', zeroTareObservation: '' },
            { trialNo: 5, functionTested: 'Other function requiring stable equilibrium', disturbed: 'YES', executedBeforeStability: 'NO', observation: '', observedAfterOperation: '', zeroTareExecutedBefore: 'NO', zeroTareObservation: '' }
        ]
    });

    // Step 11 State: Warm-Up Time
    const [step11Reading, setStep11Reading] = useState({
        powerOffHours: '',
        testLoad: '',
        displayedDuringWarmup: 'NO',
        rows: {
            '0min':  { zeroError: '', loadedInd: '' },
            '5min':  { zeroError: '', loadedInd: '' },
            '15min': { zeroError: '', loadedInd: '' },
            '30min': { zeroError: '', loadedInd: '' }
        }
    });

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

    // Discrimination test helper: format value with auto-unit
    const formatLoadValue = (grams) => {
        if (grams >= 1000) return `${(grams / 1000).toFixed(3)} kg`;
        return `${grams} g`;
    };

    // Discrimination test points
    const discrimPoints = [
        { key: 'min',     label: 'Min',      loadG: minG },
        { key: 'halfMax', label: '50% Max',   loadG: maxG / 2 },
        { key: 'max',     label: 'Max',       loadG: maxG }
    ];

    const calculateDiscriminationResults = () => {
        const rows = {};
        let allPass = true;
        for (const pt of discrimPoints) {
            const reading = discriminationReadings[pt.key];
            const initialKg = Number(reading.initial);
            const finalKg = Number(reading.final);
            const hasValues = reading.initial !== '' && reading.final !== '';

            // Normalize to grams for comparison
            const observedChangeG = hasValues ? Math.round((finalKg - initialKg) * 1000 * 1e6) / 1e6 : 0;
            const passed = hasValues && Math.abs(observedChangeG - dG) < 0.001;
            if (!passed) allPass = false;

            rows[pt.key] = {
                label: pt.label,
                loadG: pt.loadG,
                initialKg,
                finalKg,
                observedChangeG,
                expectedChangeG: dG,
                status: hasValues ? (passed ? 'PASS' : 'FAIL') : 'PENDING'
            };
        }
        return {
            rows,
            status: allPass ? 'PASS' : 'FAIL'
        };
    };

    const calculateStep9Results = () => {
        const instData = JSON.parse(localStorage.getItem("InstrumentData") || "{}");
        const rangeType = instData.range_type || localStorage.getItem("rangeType") || "single";
        const e1G = Number(instData.e1_value) || Number(localStorage.getItem("e1Value")) || eG;
        const applicableE_g = (rangeType === "multi_interval" || rangeType === "multiple_range") ? e1G : eG;
        const applicableE_kg = applicableE_g / 1000;
        const eKg = eG / 1000;

        const actualLoadKg = step9Reading.actualTestLoad !== '' ? Number(step9Reading.actualTestLoad) : maxKg;
        const actualLoadG = actualLoadKg * 1000;

        const initInd = step9Reading.initialIndication !== '' ? Number(step9Reading.initialIndication) : NaN;
        const ind15 = step9Reading.ind15min !== '' ? Number(step9Reading.ind15min) : NaN;
        const ind30 = step9Reading.ind30min !== '' ? Number(step9Reading.ind30min) : NaN;
        const ind4h = step9Reading.ind4hr !== '' ? Number(step9Reading.ind4hr) : NaN;

        let change15_30 = null;
        let change0_30 = null;
        let change0_4h = null;
        let creepStatus = 'PENDING';
        let requires4hr = false;

        if (!isNaN(initInd) && !isNaN(ind15) && !isNaN(ind30)) {
            change15_30 = Math.abs(ind30 - ind15);
            change0_30 = Math.abs(ind30 - initInd);

            const limit0_30 = 0.5 * eKg;
            const limit15_30 = 0.2 * eKg;

            const cond1Pass = change0_30 <= limit0_30 + 1e-9;
            const cond2Pass = change15_30 <= limit15_30 + 1e-9;

            if (cond1Pass && cond2Pass) {
                creepStatus = 'PASS';
                requires4hr = false;
            } else {
                requires4hr = true;
                if (isNaN(ind4h)) {
                    creepStatus = '4-HOUR EVALUATION REQUIRED';
                } else {
                    change0_4h = Math.abs(ind4h - initInd);
                    const mpe_e = getMPE(actualLoadG, eG, cls);
                    const mpeKg = (mpe_e * eG) / 1000;
                    const pass4h = change0_4h <= mpeKg + 1e-9;
                    creepStatus = pass4h ? 'PASS' : 'FAIL';
                }
            }
        }

        const zBefore = step9Reading.zeroBefore !== '' ? Number(step9Reading.zeroBefore) : NaN;
        const zAfter = step9Reading.zeroAfter !== '' ? Number(step9Reading.zeroAfter) : NaN;
        let zeroDev = null;
        let zeroReturnStatus = 'PENDING';
        const allowedZeroDevKg = 0.5 * applicableE_kg;

        if (!isNaN(zBefore) && !isNaN(zAfter)) {
            zeroDev = Math.abs(zAfter - zBefore);
            zeroReturnStatus = (zeroDev <= allowedZeroDevKg + 1e-9) ? 'PASS' : 'FAIL';
        }

        let step9Status = 'PENDING';
        if (creepStatus === 'PASS' && zeroReturnStatus === 'PASS') {
            step9Status = 'PASS';
        } else if (creepStatus === 'FAIL' || zeroReturnStatus === 'FAIL') {
            step9Status = 'FAIL';
        } else if (creepStatus === '4-HOUR EVALUATION REQUIRED') {
            step9Status = '4-HOUR EVALUATION REQUIRED';
        }

        return {
            actualLoadKg,
            change15_30,
            change0_30,
            change0_4h,
            requires4hr,
            creepStatus,
            zeroDev,
            allowedZeroDevKg,
            applicableE_g,
            zeroReturnStatus,
            step9Status
        };
    };

    const calculateStep10Results = () => {
        const trials = step10Reading.trials || [];
        const trialResults = trials.map(t => {
            const isExecutedBefore = t.executedBeforeStability === 'YES';
            const isZeroTareExecutedBefore = (t.functionTested === 'Zero-setting' || t.functionTested === 'Tare') 
                ? t.zeroTareExecutedBefore === 'YES' 
                : false;
            
            const passed = !isExecutedBefore && !isZeroTareExecutedBefore;
            const isFilled = t.functionTested && t.disturbed && t.executedBeforeStability;
            return {
                ...t,
                passed,
                status: isFilled ? (passed ? 'PASS' : 'FAIL') : 'PENDING'
            };
        });

        const anyFailed = trialResults.some(t => t.status === 'FAIL');
        const allPassed = trialResults.length === 5 && trialResults.every(t => t.status === 'PASS');
        const overallStatus = allPassed ? 'PASS' : (anyFailed ? 'FAIL' : 'PENDING');

        return {
            trialResults,
            overallStatus
        };
    };

    const calculateStep11Results = () => {
        const powerOff = Number(step11Reading.powerOffHours);
        const powerOffValid = !isNaN(powerOff) && powerOff >= 8;
        const testLoadKg = step11Reading.testLoad !== '' ? Number(step11Reading.testLoad) : maxKg;
        const testLoadG = testLoadKg * 1000;

        const mpe_e = getMPE(testLoadG, eG, cls);
        const mpeKg = (mpe_e * eG) / 1000;

        const timePoints = [
            { key: '0min', label: '0 min' },
            { key: '5min', label: '5 min' },
            { key: '15min', label: '15 min' },
            { key: '30min', label: '30 min' }
        ];

        let allRowsPassed = true;
        const evaluatedRows = {};

        timePoints.forEach(tp => {
            const rowData = step11Reading.rows[tp.key] || {};
            const zErr = rowData.zeroError !== '' ? Number(rowData.zeroError) : NaN;
            const lInd = rowData.loadedInd !== '' ? Number(rowData.loadedInd) : NaN;

            if (!isNaN(zErr) && !isNaN(lInd)) {
                const rawLoadedError = lInd - testLoadKg;
                const correctedError = rawLoadedError - zErr;
                const passed = Math.abs(correctedError) <= (mpeKg + 1e-9);
                if (!passed) allRowsPassed = false;
                evaluatedRows[tp.key] = {
                    zeroError: zErr,
                    loadedInd: lInd,
                    rawLoadedError,
                    correctedError,
                    passed,
                    status: passed ? 'PASS' : 'FAIL'
                };
            } else {
                allRowsPassed = false;
                evaluatedRows[tp.key] = {
                    zeroError: zErr,
                    loadedInd: lInd,
                    correctedError: null,
                    passed: false,
                    status: 'PENDING'
                };
            }
        });

        const displayedFail = step11Reading.displayedDuringWarmup === 'YES';
        const overallPassed = powerOffValid && !displayedFail && allRowsPassed;
        const overallStatus = !powerOffValid ? 'FAIL (Power Off < 8h)' : displayedFail ? 'FAIL (Result Displayed)' : (allRowsPassed ? 'PASS' : 'FAIL');

        return {
            powerOffValid,
            testLoadKg,
            mpeKg,
            mpe_e,
            evaluatedRows,
            displayedFail,
            overallPassed,
            overallStatus
        };
    };

    const validateCurrentTestStep = () => {
        const testId = currentTest.id;
        if (testId === 1) {
            if (!readingProofs["visual_inspection"]) {
                alert("Please upload/capture the Visual Inspection photo proof before proceeding.");
                return false;
            }
        } else if (testId === 2) {
            for (let load in weighingReadings) {
                if (weighingReadings[load].asc === '' || weighingReadings[load].desc === '') {
                    alert("Please fill in both ascending and descending readings for all load points before proceeding.");
                    return false;
                }
                if (!readingProofs[`weighing_${load}`]) {
                    const loadKg = Number(load) / 1000;
                    alert(`Please upload photo proof for load point ${loadKg >= 1 ? loadKg + ' kg' : load + ' g'} before proceeding.`);
                    return false;
                }
            }
        } else if (testId === 3) {
            for (let k in repeatabilityReadings) {
                if (repeatabilityReadings[k] === undefined || repeatabilityReadings[k] === '') {
                    alert("Please fill in all repeatability test readings before proceeding.");
                    return false;
                }
                if (!readingProofs[`repeatability_${k}`]) {
                    alert(`Please upload photo proof for ${k.replace('_', ' ')} before proceeding.`);
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
                if (!readingProofs[`eccentricity_${pos}`]) {
                    alert(`Please upload photo proof for ${pos.toUpperCase()} position before proceeding.`);
                    return false;
                }
            }
        } else if (testId === 5) {
            if (zeroReading.indication === undefined || zeroReading.indication === '') {
                alert("Please fill in the Zero Indication Reading before proceeding.");
                return false;
            }
            if (!readingProofs["zero_setting"]) {
                alert("Please upload photo proof for Zero Setting before proceeding.");
                return false;
            }
        } else if (testId === 6) {
            if (!tareReading.tare_load || !tareReading.net_indication) {
                alert("Please fill in Tare Load Applied and Net Indication After Tare before proceeding.");
                return false;
            }
            if (!readingProofs["tare_accuracy"]) {
                alert("Please upload photo proof for Tare Accuracy before proceeding.");
                return false;
            }
        } else if (testId === 7) {
            for (const pt of discrimPoints) {
                const reading = discriminationReadings[pt.key];
                if (reading.initial === '' || reading.initial === undefined) {
                    alert(`Enter the initial indication for the ${pt.label} test point.`);
                    return false;
                }
                if (reading.final === '' || reading.final === undefined) {
                    alert(`Enter the indication after adding 1.4d for the ${pt.label} test point.`);
                    return false;
                }
                if (!readingProofs[`discrimination_${pt.key}`]) {
                    alert(`Please upload photo proof for ${pt.label} discrimination test point before proceeding.`);
                    return false;
                }
            }
        } else if (testId === 8) {
            if (!tiltReading.ref || !tiltReading.tilt_x || !tiltReading.tilt_y) {
                alert("Please fill in all Tilt Test observation readings (Level Reference, X-Axis, Y-Axis) before proceeding.");
                return false;
            }
            if (!readingProofs["tilt_test"]) {
                alert("Please upload photo proof for Tilt Test before proceeding.");
                return false;
            }
        } else if (testId === 9) {
            if (!step9Reading.actualTestLoad && step9Reading.actualTestLoad !== 0) {
                alert("Please enter the actual test load applied.");
                return false;
            }
            if (step9Reading.initialIndication === '' || step9Reading.ind15min === '' || step9Reading.ind30min === '') {
                alert("Please enter the Initial, 15-minute, and 30-minute indications for the Creep Test.");
                return false;
            }
            const s9Res = calculateStep9Results();
            if (s9Res.requires4hr && (step9Reading.ind4hr === '' || step9Reading.ind4hr === undefined)) {
                alert("30-minute criterion exceeded — 4-hour evaluation required. Please enter the 4-hour indication before proceeding.");
                return false;
            }
            if (step9Reading.zeroBefore === '' || step9Reading.zeroAfter === '') {
                alert("Please enter the zero indications before loading and after unloading for the Zero Return Test.");
                return false;
            }
            if (!readingProofs["creep_test"]) {
                alert("Please upload photo proof for Creep Test before proceeding.");
                return false;
            }
            if (!readingProofs["zero_return_test"]) {
                alert("Please upload photo proof for Zero Return Test before proceeding.");
                return false;
            }
        } else if (testId === 10) {
            for (let i = 0; i < step10Reading.trials.length; i++) {
                const tr = step10Reading.trials[i];
                if (!tr.functionTested || !tr.disturbed || !tr.executedBeforeStability) {
                    alert(`Please complete all required fields for Trial ${i + 1} of Stability of Equilibrium test before proceeding.`);
                    return false;
                }
                if (!readingProofs[`stability_trial_${i + 1}`]) {
                    alert(`Please upload photo proof for Trial ${i + 1} of Stability of Equilibrium test before proceeding.`);
                    return false;
                }
            }
        } else if (testId === 11) {
            const powerOff = Number(step11Reading.powerOffHours);
            if (step11Reading.powerOffHours === '' || isNaN(powerOff)) {
                alert("Please enter the actual power-off duration.");
                return false;
            }
            if (powerOff < 8) {
                alert("Actual power-off duration is less than 8 hours. OIML A.5.2 requires at least 8 hours power-off duration before warm-up test.");
                return false;
            }
            for (const key of ['0min', '5min', '15min', '30min']) {
                const row = step11Reading.rows[key];
                if (row.zeroError === '' || row.loadedInd === '') {
                    alert(`Please enter both Zero Error and Loaded Indication for ${key}.`);
                    return false;
                }
            }
            if (!readingProofs["warmup_test"]) {
                alert("Please upload photo proof for Warm-Up Time test before proceeding.");
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
            const fDiscrimRes = calculateDiscriminationResults();
            const f9Res = calculateStep9Results();
            const f10Res = calculateStep10Results();
            const f11Res = calculateStep11Results();

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
                form_discrimination: discriminationReadings,
                form_discrimination_results: fDiscrimRes,
                form9: step9Reading,
                form9_results: f9Res,
                form10: step10Reading,
                form10_results: f10Res,
                form11: step11Reading,
                form11_results: f11Res,
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
                        <div className="flex justify-between items-center mb-2 text-xs font-bold text-[#0F172A]">
                            <span className="uppercase tracking-wider">Step {currentIdx + 1} of {testsToRun.length}: {currentTest.name}</span>
                            <span className="font-mono text-[#475569]">{Math.round(((currentIdx + 1) / testsToRun.length) * 100)}% Completed</span>
                        </div>
                        <div className="h-2.5 bg-[#F1F5F9] rounded-[6px] border border-[#E2E8F0] overflow-hidden shadow-[inset_1px_1px_3px_#CBD5E1]">
                            <div 
                                className="h-full bg-[#2563EB] transition-all duration-300"
                                style={{ width: `${((currentIdx + 1) / testsToRun.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Active Test Card: Tactile Convex Surface */}
                    <div className="tactile-raised">
                        <div className="flex items-center gap-3.5 pb-4 mb-5 border-b border-[#E2E8F0]">
                            <div className="w-11 h-11 bg-[#2563EB] text-white rounded-[13px] grid place-items-center text-lg shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
                                <i className={currentTest.icon}></i>
                            </div>
                            <div>
                                <h3 className="m-0 text-sm font-bold text-[#0F172A] font-['Outfit'] uppercase tracking-wide">
                                    {currentTest.id}. {currentTest.name}
                                </h3>
                                <p className="m-0 text-xs text-[#475569]">{currentTest.note}</p>
                            </div>
                        </div>

                        {/* TEST 1: Visual Inspection */}
                        {currentTest.id === 1 && (
                            <div>
                                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
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
                                        <label key={item.key} className="flex items-center gap-3 bg-[#F1F5F9] p-3 rounded-[11px] border border-[#E2E8F0] cursor-pointer shadow-[inset_1px_1px_3px_#CBD5E1]">
                                            <input
                                                type="checkbox"
                                                checked={form0[item.key]}
                                                onChange={e => setForm0(prev => ({ ...prev, [item.key]: e.target.checked }))}
                                                className="w-4 h-4 accent-[#2563EB] cursor-pointer"
                                            />
                                            <span className="text-xs text-[#0F172A] font-semibold">{item.label}</span>
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
                                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                                    Repeatability Test Observations
                                </h4>
                                <p className="text-xs text-[#475569] mb-4">
                                    Applied Half-Capacity Test Load: <strong>{(currentTest.load / 1000).toFixed(3)} kg</strong>
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
                                    {Object.keys(repeatabilityReadings).map((key, i) => (
                                        <div key={key} className="p-3.5 bg-[#F1F5F9] rounded-[13px] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]">
                                            <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-1">
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
                                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-1">
                                    Eccentricity Off-Center Loading (1/3 Load)
                                </h4>
                                <p className="text-xs text-[#475569] mb-4">
                                    Applied Test Load: <strong>{(currentTest.load / 1000).toFixed(3)} kg</strong>
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
                                    {['front', 'right', 'rear', 'left', 'center'].map(pos => (
                                        <div key={pos} className="p-3.5 bg-[#F1F5F9] rounded-[13px] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]">
                                            <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-1">
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
                                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
                                    Zero-Setting & Zero-Tracking Accuracy
                                </h4>
                                <div className="max-w-md my-4 p-4 bg-[#F1F5F9] rounded-[13px] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]">
                                    <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-1">
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
                                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
                                    Tare Accuracy Verification
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 p-4 bg-[#F1F5F9] rounded-[13px] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]">
                                    <div>
                                        <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-1">
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
                                        <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-1">
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

                        {/* TEST 7: Discrimination / Sensitivity */}
                        {currentTest.id === 7 && (
                            <div>
                                {/* Instructions Section */}
                                <div className="p-4 bg-[#F1F5F9] rounded-[13px] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1] mb-5">
                                    <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2 flex items-center gap-2">
                                        <i className="fas fa-info-circle text-[#475569]"></i> Discrimination Test Instructions
                                    </h4>
                                    <div className="text-xs text-[#475569] leading-relaxed space-y-2">
                                        <p className="m-0">The discrimination test checks whether the weighing instrument responds correctly to a small change in load.</p>
                                        <p className="m-0">The test is performed at three load points: <strong>Min</strong>, <strong>50% Max</strong>, and <strong>Max</strong>.</p>
                                        <p className="m-0">At each test point:</p>
                                        <ol className="ml-4 space-y-0.5 list-decimal">
                                            <li>Place the specified test load on the weighing instrument and allow the indication to stabilize.</li>
                                            <li>Establish the initial indication (I) according to the prescribed test procedure.</li>
                                            <li>Add an additional load of <strong>1.4 × d = {formatLoadValue(1.4 * dG)}</strong>.</li>
                                            <li>Record the new indication.</li>
                                            <li>The indication must increase by exactly one actual scale interval (d).</li>
                                        </ol>
                                        <p className="m-0"><strong>Pass condition:</strong> Final Indication − Initial Indication = d</p>
                                        <p className="m-0 text-[11px] italic text-[#64748B] mt-2">
                                            <i className="fas fa-lock mr-1"></i>
                                            Min, Max, and d values are taken automatically from the instrument details entered earlier.
                                        </p>
                                    </div>
                                </div>

                                {/* Test Parameters */}
                                <div className="mb-5">
                                    <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
                                        <i className="fas fa-cogs mr-1.5 text-[#475569]"></i> Auto-Calculated Test Parameters
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {[
                                            { label: 'Min', value: formatLoadValue(minG) },
                                            { label: 'Max', value: formatLoadValue(maxG) },
                                            { label: 'd (scale interval)', value: formatLoadValue(dG) },
                                            { label: '50% Max', value: formatLoadValue(maxG / 2) },
                                            { label: '1.4d (extra load)', value: formatLoadValue(1.4 * dG) }
                                        ].map(p => (
                                            <div key={p.label} className="p-3 bg-[#F1F5F9] rounded-[11px] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]">
                                                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">{p.label}</div>
                                                <div className="text-sm font-bold text-[#0F172A] font-mono">{p.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Main Discrimination Test Table */}
                                <h4 className="text-xs font-bold text-[#1C1A17] uppercase tracking-wider mb-3">
                                    Discrimination Observation Readings
                                </h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr>
                                                <th>TEST POINT</th>
                                                <th>TEST LOAD</th>
                                                <th>INITIAL INDICATION (KG)</th>
                                                <th>AFTER +1.4d (KG)</th>
                                                <th>OBSERVED CHANGE</th>
                                                <th>EXPECTED</th>
                                                <th>RESULT</th>
                                                <th>READING PHOTO PROOF</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {discrimPoints.map(pt => {
                                                const reading = discriminationReadings[pt.key];
                                                const hasValues = reading.initial !== '' && reading.final !== '';
                                                const initialKg = Number(reading.initial);
                                                const finalKg = Number(reading.final);
                                                const observedChangeG = hasValues ? Math.round((finalKg - initialKg) * 1000 * 1e6) / 1e6 : 0;
                                                const passed = hasValues && Math.abs(observedChangeG - dG) < 0.001;
                                                const rowStatus = hasValues ? (passed ? 'PASS' : 'FAIL') : 'PENDING';
                                                return (
                                                    <tr key={pt.key}>
                                                        <td><strong>{pt.label}</strong></td>
                                                        <td className="font-mono text-[#5C5852]">{formatLoadValue(pt.loadG)}</td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                placeholder="Observed initial reading"
                                                                className="form-input w-40"
                                                                value={reading.initial}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    setDiscriminationReadings(prev => ({
                                                                        ...prev,
                                                                        [pt.key]: { ...prev[pt.key], initial: val }
                                                                    }));
                                                                }}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                placeholder="Reading after +1.4d"
                                                                className="form-input w-40"
                                                                value={reading.final}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    setDiscriminationReadings(prev => ({
                                                                        ...prev,
                                                                        [pt.key]: { ...prev[pt.key], final: val }
                                                                    }));
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="font-mono font-bold">
                                                            {hasValues ? formatLoadValue(observedChangeG) : '—'}
                                                        </td>
                                                        <td className="font-mono text-[#5C5852]">
                                                            d = {formatLoadValue(dG)}
                                                        </td>
                                                        <td>
                                                            {hasValues ? (
                                                                <span className={`status-badge ${
                                                                    rowStatus === 'PASS' ? 'status-pass' : 'status-fail'
                                                                }`}>
                                                                    {rowStatus}
                                                                </span>
                                                            ) : (
                                                                <span className="status-badge status-pending">PENDING</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <ReadingPhotoUploader
                                                                readingKey={`discrimination_${pt.key}`}
                                                                label={`${pt.label.toUpperCase()} DISCRIMINATION PROOF`}
                                                                currentProof={readingProofs[`discrimination_${pt.key}`]}
                                                                onProofUploaded={handleProofUploaded}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Overall Discrimination Result */}
                                {(() => {
                                    const dr = calculateDiscriminationResults();
                                    return (
                                        <div className={`mt-5 p-4 rounded-[13px] border flex items-center justify-between ${
                                            dr.status === 'PASS'
                                                ? 'bg-[#DCFCE7] border-[#BBF7D0]'
                                                : 'bg-[#FEE2E2] border-[#FECACA]'
                                        }`}>
                                            <div>
                                                <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: dr.status === 'PASS' ? '#166534' : '#991B1B' }}>
                                                    Overall Discrimination Test Result
                                                </div>
                                                <div className="text-[11px]" style={{ color: dr.status === 'PASS' ? '#166534' : '#991B1B' }}>
                                                    {discrimPoints.map(pt => {
                                                        const r = dr.rows[pt.key];
                                                        return `${pt.label}: ${r.status}`;
                                                    }).join('  •  ')}
                                                </div>
                                            </div>
                                            <span className={`status-badge text-sm px-4 py-1.5 ${
                                                dr.status === 'PASS' ? 'status-pass' : 'status-fail'
                                            }`}>
                                                <i className={`fas ${dr.status === 'PASS' ? 'fa-check-circle' : 'fa-times-circle'} mr-1.5`}></i>
                                                {dr.status}
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* TEST 8: Tilt Test */}
                        {currentTest.id === 8 && (
                            <div>
                                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3">
                                    Tilt Test Observations (Mobile / Portable Instruments)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 p-4 bg-[#F1F5F9] rounded-[13px] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]">
                                    <div>
                                        <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-1">
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
                                        <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-1">
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
                                        <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-1">
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

                        {/* TEST 9: Time-Dependent Error (Zero Return & Creep) */}
                        {currentTest.id === 9 && (() => {
                            const s9Res = calculateStep9Results();
                            const instData = JSON.parse(localStorage.getItem("InstrumentData") || "{}");
                            const rangeType = instData.range_type || localStorage.getItem("rangeType") || "single";

                            return (
                                <div className="space-y-6">
                                    {/* Page Subtitle & Instructions */}
                                    <div className="p-4 bg-[#F1F5F9] rounded-[13px] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]">
                                        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <i className="fas fa-info-circle text-[#475569]"></i> Step 9 Instructions & Rules (Zero Return & Creep)
                                        </h4>
                                        <div className="text-xs text-[#475569] leading-relaxed space-y-2">
                                            <p className="m-0 font-medium">
                                                These tests evaluate whether the indication remains within the permitted limits over time and whether the instrument returns sufficiently close to zero after loading.
                                            </p>
                                            <div className="bg-white p-3 rounded-[11px] border border-[#E2E8F0] space-y-1.5">
                                                <strong className="text-[#0F172A] block uppercase text-[11px] tracking-wide">Creep Test Procedure:</strong>
                                                <ol className="list-decimal list-inside space-y-1 pl-1">
                                                    <li>Load the instrument with a load close to Max.</li>
                                                    <li>Allow the indication to stabilize.</li>
                                                    <li>Record the initial stabilized indication.</li>
                                                    <li>Keep the load on the instrument and observe the indication over time.</li>
                                                    <li>Record the indication at 15 minutes and 30 minutes.</li>
                                                    <li>If required, continue the observation up to 4 hours.</li>
                                                </ol>
                                            </div>
                                            <div className="bg-white p-3 rounded-[11px] border border-[#E2E8F0] space-y-1.5">
                                                <strong className="text-[#0F172A] block uppercase text-[11px] tracking-wide">Zero Return Test Procedure:</strong>
                                                <ol className="list-decimal list-inside space-y-1 pl-1">
                                                    <li>Record the zero indication before loading.</li>
                                                    <li>Apply a load close to Max.</li>
                                                    <li>Keep the load applied for 30 minutes.</li>
                                                    <li>Remove the load.</li>
                                                    <li>Allow the indication to stabilize.</li>
                                                    <li>Record the zero indication after unloading.</li>
                                                    <li>For applicable multiple-range instruments, continue observing the zero indication for the required additional period.</li>
                                                </ol>
                                            </div>
                                            <div className="p-2.5 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] rounded-[9px] text-[11px] font-medium flex items-start gap-2">
                                                <i className="fas fa-exclamation-triangle text-[#2563EB] mt-0.5"></i>
                                                <span><strong>Important Note:</strong> For creep and zero-return calculations, use e (verification scale interval), not d, for the specified limits (OIML R 76-1 clause 3.9.4 and Annex A.4.11).</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Read-Only Test Parameters Card */}
                                    <div>
                                        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <i className="fas fa-cogs text-[#475569]"></i> Test Parameters
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-[#F1F5F9] rounded-[13px] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]">
                                            <div className="p-3 bg-white rounded-[11px] border border-[#E2E8F0]">
                                                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Accuracy Class</div>
                                                <div className="text-sm font-bold text-[#0F172A] font-mono">{cls}</div>
                                            </div>
                                            <div className="p-3 bg-white rounded-[11px] border border-[#E2E8F0]">
                                                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Max Capacity</div>
                                                <div className="text-sm font-bold text-[#0F172A] font-mono">{maxKg} kg</div>
                                            </div>
                                            <div className="p-3 bg-white rounded-[11px] border border-[#E2E8F0]">
                                                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Verification Interval (e)</div>
                                                <div className="text-sm font-bold text-[#0F172A] font-mono">{eG} g</div>
                                            </div>
                                            <div className="p-3 bg-white rounded-[11px] border border-[#E2E8F0]">
                                                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Required Test Load</div>
                                                <div className="text-sm font-bold text-[#2563EB] font-mono">Load close to Max</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actual Test Load Applied Input */}
                                    <div className="p-4 bg-white rounded-[13px] border border-[#E2E8F0] shadow-sm">
                                        <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-1">
                                            Actual Test Load Applied (kg) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            placeholder={`e.g. ${maxKg}`}
                                            className="form-input text-xs font-mono w-full md:w-64"
                                            value={step9Reading.actualTestLoad}
                                            onChange={e => setStep9Reading(prev => ({ ...prev, actualTestLoad: e.target.value }))}
                                        />
                                    </div>

                                    {/* PART A: CREEP TEST */}
                                    <div className="p-5 bg-white rounded-[13px] border border-[#E2E8F0] shadow-sm space-y-4">
                                        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                                            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider m-0">
                                                PART A — CREEP TEST
                                            </h4>
                                            <span className="text-[11px] font-mono font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-[8px] border border-[#E2E8F0]">
                                                OIML Clause A.4.11.1
                                            </span>
                                        </div>

                                        {/* Creep Table */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0]">
                                                        <th className="p-2.5 font-bold text-[#0F172A]">TEST LOAD</th>
                                                        <th className="p-2.5 font-bold text-[#0F172A]">INITIAL STABILIZED IND. (kg)</th>
                                                        <th className="p-2.5 font-bold text-[#0F172A]">IND. @ 15 MIN (kg)</th>
                                                        <th className="p-2.5 font-bold text-[#0F172A]">IND. @ 30 MIN (kg)</th>
                                                        <th className="p-2.5 font-bold text-[#0F172A]">15–30 MIN CHANGE</th>
                                                        <th className="p-2.5 font-bold text-[#0F172A]">0–30 MIN CHANGE</th>
                                                        <th className="p-2.5 font-bold text-[#0F172A]">RESULT</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-b border-[#E2E8F0]">
                                                        <td className="p-2.5 font-mono text-[#0F172A] font-bold">
                                                            {step9Reading.actualTestLoad ? `${step9Reading.actualTestLoad} kg` : `${maxKg} kg (Default)`}
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                placeholder="Initial kg"
                                                                className="form-input text-xs font-mono"
                                                                value={step9Reading.initialIndication}
                                                                onChange={e => setStep9Reading(prev => ({ ...prev, initialIndication: e.target.value }))}
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                placeholder="15 min kg"
                                                                className="form-input text-xs font-mono"
                                                                value={step9Reading.ind15min}
                                                                onChange={e => setStep9Reading(prev => ({ ...prev, ind15min: e.target.value }))}
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="number"
                                                                step="any"
                                                                placeholder="30 min kg"
                                                                className="form-input text-xs font-mono"
                                                                value={step9Reading.ind30min}
                                                                onChange={e => setStep9Reading(prev => ({ ...prev, ind30min: e.target.value }))}
                                                            />
                                                        </td>
                                                        <td className="p-2.5 font-mono">
                                                            {s9Res.change15_30 !== null ? `${s9Res.change15_30.toFixed(4)} kg` : '—'}
                                                        </td>
                                                        <td className="p-2.5 font-mono">
                                                            {s9Res.change0_30 !== null ? `${s9Res.change0_30.toFixed(4)} kg` : '—'}
                                                        </td>
                                                        <td className="p-2.5 font-bold">
                                                            <span className={`px-2.5 py-1 rounded-[8px] text-[11px] border ${
                                                                s9Res.creepStatus === 'PASS' ? 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]' :
                                                                s9Res.creepStatus === 'FAIL' ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]' :
                                                                s9Res.creepStatus === '4-HOUR EVALUATION REQUIRED' ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]' :
                                                                'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                                                            }`}>
                                                                {s9Res.creepStatus}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* 4-Hour Evaluation Fallback Card if 30-min criterion exceeded */}
                                        {s9Res.requires4hr && (
                                            <div className="p-4 bg-[#FEF3C7] border border-[#FDE68A] rounded-[11px] space-y-3">
                                                <div className="flex items-center gap-2 text-[#92400E] text-xs font-bold uppercase tracking-wide">
                                                    <i className="fas fa-exclamation-triangle"></i>
                                                    <span>30-minute criterion exceeded — 4-hour evaluation required.</span>
                                                </div>
                                                <p className="text-xs text-[#78350F] m-0">
                                                    The indication change exceeded 0.5e (0–30 min) or 0.2e (15–30 min). Per OIML R 76-1 Annex A.4.11.1, the technician must enter the 4-hour indication to evaluate against applicable MPE.
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                                    <div>
                                                        <label className="text-[11px] font-bold text-[#78350F] uppercase tracking-wider block mb-1">
                                                            4-Hour Indication (kg) <span className="text-red-500">*</span>
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            placeholder="4-hour indication kg"
                                                            className="form-input text-xs font-mono bg-white"
                                                            value={step9Reading.ind4hr}
                                                            onChange={e => setStep9Reading(prev => ({ ...prev, ind4hr: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col justify-end text-xs">
                                                        <div className="text-[11px] font-bold text-[#78350F] uppercase mb-1">0–4 Hour Change Evaluation</div>
                                                        <div className="font-mono text-xs">
                                                            Change: <strong>{s9Res.change0_4h !== null ? `${s9Res.change0_4h.toFixed(4)} kg` : '—'}</strong>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Environmental condition field */}
                                        <div className="pt-2">
                                            <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-1">
                                                Temperature variation during creep test (°C)
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                placeholder="e.g. 1.2"
                                                className="form-input text-xs font-mono w-full md:w-64"
                                                value={step9Reading.tempVar}
                                                onChange={e => setStep9Reading(prev => ({ ...prev, tempVar: e.target.value }))}
                                            />
                                            <p className="text-[11px] text-[#64748B] mt-1 m-0 italic">
                                                Recommended condition: temperature variation should not exceed 2 °C.
                                            </p>
                                        </div>

                                        {/* Creep Photo Proof */}
                                        <div className="pt-3">
                                            <ReadingPhotoUploader
                                                readingKey="creep_test"
                                                label="Creep Test Observation Photo Proof"
                                                currentProof={readingProofs["creep_test"]}
                                                onProofUploaded={handleProofUploaded}
                                            />
                                        </div>
                                    </div>

                                    {/* PART B: ZERO RETURN TEST */}
                                    <div className="p-5 bg-white rounded-[13px] border border-[#E2E8F0] shadow-sm space-y-4">
                                        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                                            <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider m-0">
                                                PART B — ZERO RETURN TEST
                                            </h4>
                                            <span className="text-[11px] font-mono font-bold text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-[8px] border border-[#E2E8F0]">
                                                OIML Clause A.4.11.2
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-1">
                                                    1. Zero indication before loading (kg) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder="0.000"
                                                    className="form-input text-xs font-mono"
                                                    value={step9Reading.zeroBefore}
                                                    onChange={e => setStep9Reading(prev => ({ ...prev, zeroBefore: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-1">
                                                    2. Test load applied (kg)
                                                </label>
                                                <input
                                                    type="text"
                                                    readOnly
                                                    className="form-input text-xs font-mono bg-[#F1F5F9] cursor-not-allowed"
                                                    value={step9Reading.actualTestLoad ? `${step9Reading.actualTestLoad} kg` : `${maxKg} kg`}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-1">
                                                    3. Loading duration (minutes)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder="30"
                                                    className="form-input text-xs font-mono"
                                                    value={step9Reading.loadingDuration}
                                                    onChange={e => setStep9Reading(prev => ({ ...prev, loadingDuration: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-1">
                                                    4. Zero indication after unloading / stabilization (kg) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder="0.000"
                                                    className="form-input text-xs font-mono"
                                                    value={step9Reading.zeroAfter}
                                                    onChange={e => setStep9Reading(prev => ({ ...prev, zeroAfter: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="p-4 bg-[#F1F5F9] rounded-[11px] border border-[#E2E8F0] grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                                            <div>
                                                <div className="text-[10px] font-bold text-[#64748B] uppercase">Zero Deviation</div>
                                                <div className="text-sm font-bold text-[#0F172A] font-mono">
                                                    {s9Res.zeroDev !== null ? `${s9Res.zeroDev.toFixed(4)} kg` : '—'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-[#64748B] uppercase">
                                                    Allowed Limit (0.5 × {rangeType === "single" ? 'e' : 'e1'})
                                                </div>
                                                <div className="text-sm font-bold text-[#0F172A] font-mono">
                                                    ≤ {s9Res.allowedZeroDevKg.toFixed(4)} kg ({s9Res.applicableE_g * 0.5} g)
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-[#64748B] uppercase mb-0.5">Zero Return Result</div>
                                                <span className={`px-3 py-1 rounded-[8px] text-xs font-bold border ${
                                                    s9Res.zeroReturnStatus === 'PASS' ? 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]' :
                                                    s9Res.zeroReturnStatus === 'FAIL' ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]' :
                                                    'bg-white text-[#64748B] border-[#E2E8F0]'
                                                }`}>
                                                    {s9Res.zeroReturnStatus}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Zero Return Photo Proof */}
                                        <div className="pt-2">
                                            <ReadingPhotoUploader
                                                readingKey="zero_return_test"
                                                label="Zero Return Observation Photo Proof"
                                                currentProof={readingProofs["zero_return_test"]}
                                                onProofUploaded={handleProofUploaded}
                                            />
                                        </div>
                                    </div>

                                    {/* STEP 9 OVERALL RESULT */}
                                    <div className={`p-4 rounded-[13px] border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                                        s9Res.step9Status === 'PASS' ? 'bg-[#DCFCE7] border-[#BBF7D0]' :
                                        s9Res.step9Status === 'FAIL' ? 'bg-[#FEE2E2] border-[#FECACA]' :
                                        'bg-[#FEF3C7] border-[#FDE68A]'
                                    }`}>
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{
                                                color: s9Res.step9Status === 'PASS' ? '#166534' : s9Res.step9Status === 'FAIL' ? '#991B1B' : '#92400E'
                                            }}>
                                                Step 9 Overall Result: {s9Res.step9Status}
                                            </div>
                                            <div className="text-[11px]" style={{
                                                color: s9Res.step9Status === 'PASS' ? '#166534' : s9Res.step9Status === 'FAIL' ? '#991B1B' : '#92400E'
                                            }}>
                                                Creep: <strong>{s9Res.creepStatus}</strong> &bull; Zero Return: <strong>{s9Res.zeroReturnStatus}</strong>
                                            </div>
                                        </div>
                                        <span className="text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-[8px] bg-white border border-current">
                                            {s9Res.step9Status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* TEST 10: Stability of Equilibrium */}
                        {currentTest.id === 10 && (() => {
                            const s10Res = calculateStep10Results();
                            const halfMaxKg = maxKg / 2;

                            const handleTrialChange = (index, field, value) => {
                                setStep10Reading(prev => {
                                    const updated = [...prev.trials];
                                    updated[index] = { ...updated[index], [field]: value };
                                    return { ...prev, trials: updated };
                                });
                            };

                            return (
                                <div className="space-y-6">
                                    {/* Subtitle & Instructions */}
                                    <div className="p-4 bg-[#F1F5F9] rounded-[13px] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]">
                                        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <i className="fas fa-info-circle text-[#475569]"></i> Step 10 Instructions (Stability of Equilibrium)
                                        </h4>
                                        <div className="text-xs text-[#475569] leading-relaxed space-y-2">
                                            <p className="m-0 font-medium">
                                                This test verifies the instrument's stable-equilibrium function, ensuring functions requiring stable equilibrium cannot be performed before stable equilibrium is reached.
                                            </p>
                                            <div className="bg-white p-3 rounded-[11px] border border-[#E2E8F0] space-y-1.5">
                                                <strong className="text-[#0F172A] block uppercase text-[11px] tracking-wide">Manufacturer Documentation Check:</strong>
                                                <ul className="list-disc list-inside space-y-1 pl-1">
                                                    <li>Check the basic principle and criteria used to determine stable equilibrium;</li>
                                                    <li>Check adjustable and non-adjustable parameters;</li>
                                                    <li>Check security of these parameters;</li>
                                                    <li>Check the most critical / worst-case adjustment.</li>
                                                </ul>
                                            </div>
                                            <div className="bg-white p-3 rounded-[11px] border border-[#E2E8F0] space-y-1.5">
                                                <strong className="text-[#0F172A] block uppercase text-[11px] tracking-wide">Test Execution Sequence:</strong>
                                                <ol className="list-decimal list-inside space-y-1 pl-1">
                                                    <li>Load the instrument to approximately 50% of Max, or to a load within the operating range of the relevant function.</li>
                                                    <li>Manually disturb the equilibrium with one deliberate action.</li>
                                                    <li>Immediately attempt the function being tested.</li>
                                                    <li>Verify that the function cannot be performed before stable equilibrium is reached.</li>
                                                    <li>Repeat the test 5 times as required (OIML A.4.12).</li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Read-Only Parameter Card */}
                                    <div>
                                        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <i className="fas fa-cogs text-[#475569]"></i> Test Configuration
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#F1F5F9] rounded-[13px] border border-[#E2E8F0] shadow-[inset_1px_1px_3px_#CBD5E1]">
                                            <div className="p-3 bg-white rounded-[11px] border border-[#E2E8F0]">
                                                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">Max Capacity</div>
                                                <div className="text-sm font-bold text-[#0F172A] font-mono">{maxKg} kg</div>
                                            </div>
                                            <div className="p-3 bg-white rounded-[11px] border border-[#E2E8F0]">
                                                <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-0.5">50% Max (Calculated)</div>
                                                <div className="text-sm font-bold text-[#2563EB] font-mono">{halfMaxKg.toFixed(3)} kg</div>
                                            </div>
                                            <div className="p-3 bg-white rounded-[11px] border border-[#E2E8F0]">
                                                <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">Test Load (kg)</label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    placeholder={`${halfMaxKg}`}
                                                    className="form-input text-xs font-mono py-1"
                                                    value={step10Reading.testLoad}
                                                    onChange={e => setStep10Reading(prev => ({ ...prev, testLoad: e.target.value }))}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5-Trial Function Test Cards / Table */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                                            <i className="fas fa-tasks text-[#475569]"></i> 5-Trial Equilibrium Stability Verification Table
                                        </h4>

                                        {step10Reading.trials.map((trial, idx) => {
                                            const trRes = s10Res.trialResults[idx] || {};
                                            const isPrintOrStorage = trial.functionTested === 'Printing' || trial.functionTested === 'Data storage';
                                            const isZeroOrTare = trial.functionTested === 'Zero-setting' || trial.functionTested === 'Tare';

                                            return (
                                                <div key={idx} className="p-4 bg-white rounded-[13px] border border-[#E2E8F0] shadow-sm space-y-3">
                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-2">
                                                        <span className="font-bold text-xs text-[#0F172A] uppercase tracking-wide">
                                                            Trial #{trial.trialNo} of 5
                                                        </span>
                                                        <span className={`px-2.5 py-0.5 rounded-[8px] text-[11px] font-bold border ${
                                                            trRes.status === 'PASS' ? 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]' :
                                                            trRes.status === 'FAIL' ? 'bg-[#FEE2E2] text-[#991B1B] border-[#FECACA]' :
                                                            'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]'
                                                        }`}>
                                                            Trial Result: {trRes.status || 'PENDING'}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Test Load</label>
                                                            <input
                                                                type="text"
                                                                readOnly
                                                                className="form-input text-xs font-mono bg-[#F1F5F9]"
                                                                value={step10Reading.testLoad ? `${step10Reading.testLoad} kg` : `${halfMaxKg.toFixed(3)} kg`}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Function Tested</label>
                                                            <select
                                                                className="form-input text-xs"
                                                                value={trial.functionTested}
                                                                onChange={e => handleTrialChange(idx, 'functionTested', e.target.value)}
                                                            >
                                                                <option value="Printing">Printing</option>
                                                                <option value="Data storage">Data storage</option>
                                                                <option value="Zero-setting">Zero-setting</option>
                                                                <option value="Tare">Tare</option>
                                                                <option value="Other function requiring stable equilibrium">Other function requiring stable equilibrium</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Equilibrium Disturbed?</label>
                                                            <select
                                                                className="form-input text-xs"
                                                                value={trial.disturbed}
                                                                onChange={e => handleTrialChange(idx, 'disturbed', e.target.value)}
                                                            >
                                                                <option value="YES">YES</option>
                                                                <option value="NO">NO</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Executed Before Stability?</label>
                                                            <select
                                                                className="form-input text-xs font-bold"
                                                                value={trial.executedBeforeStability}
                                                                onChange={e => handleTrialChange(idx, 'executedBeforeStability', e.target.value)}
                                                            >
                                                                <option value="NO">NO (Pass)</option>
                                                                <option value="YES">YES (Fail)</option>
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {/* Conditional detail fields per function type */}
                                                    {isPrintOrStorage && (
                                                        <div className="p-3 bg-[#F1F5F9] rounded-[9px] border border-[#E2E8F0] space-y-2">
                                                            <div className="text-[11px] font-bold text-[#0F172A]">
                                                                Stable-equilibrium indication observed after operation (5-second period)
                                                            </div>
                                                            <input
                                                                type="text"
                                                                placeholder="Recorded indication sequence over 5s following operation (e.g. 500.0 kg)"
                                                                className="form-input text-xs bg-white"
                                                                value={trial.observedAfterOperation}
                                                                onChange={e => handleTrialChange(idx, 'observedAfterOperation', e.target.value)}
                                                            />
                                                        </div>
                                                    )}

                                                    {isZeroOrTare && (
                                                        <div className="p-3 bg-[#F1F5F9] rounded-[9px] border border-[#E2E8F0] space-y-2">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                                                                        Was {trial.functionTested} operation performed before stable equilibrium?
                                                                    </label>
                                                                    <select
                                                                        className="form-input text-xs font-bold"
                                                                        value={trial.zeroTareExecutedBefore}
                                                                        onChange={e => handleTrialChange(idx, 'zeroTareExecutedBefore', e.target.value)}
                                                                    >
                                                                        <option value="NO">NO (Pass)</option>
                                                                        <option value="YES">YES (Fail)</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                                                                        Accuracy Observation Details
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Recorded observation / zero setting accuracy check"
                                                                        className="form-input text-xs bg-white"
                                                                        value={trial.zeroTareObservation}
                                                                        onChange={e => handleTrialChange(idx, 'zeroTareObservation', e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">Trial Observations & Notes</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Enter physical observations..."
                                                            className="form-input text-xs"
                                                            value={trial.observation}
                                                            onChange={e => handleTrialChange(idx, 'observation', e.target.value)}
                                                        />
                                                    </div>

                                                    {/* Trial Photo Proof */}
                                                    <div className="pt-1">
                                                        <ReadingPhotoUploader
                                                            readingKey={`stability_trial_${idx + 1}`}
                                                            label={`Trial #${trial.trialNo} Photo / Proof`}
                                                            currentProof={readingProofs[`stability_trial_${idx + 1}`]}
                                                            onProofUploaded={handleProofUploaded}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* STEP 10 OVERALL RESULT */}
                                    <div className={`p-4 rounded-[13px] border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                                        s10Res.overallStatus === 'PASS' ? 'bg-[#DCFCE7] border-[#BBF7D0]' :
                                        s10Res.overallStatus === 'FAIL' ? 'bg-[#FEE2E2] border-[#FECACA]' :
                                        'bg-[#FEF3C7] border-[#FDE68A]'
                                    }`}>
                                        <div>
                                            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{
                                                color: s10Res.overallStatus === 'PASS' ? '#166534' : s10Res.overallStatus === 'FAIL' ? '#991B1B' : '#92400E'
                                            }}>
                                                Overall Stability of Equilibrium Result: {s10Res.overallStatus}
                                            </div>
                                            <div className="text-[11px] font-mono" style={{
                                                color: s10Res.overallStatus === 'PASS' ? '#166534' : s10Res.overallStatus === 'FAIL' ? '#991B1B' : '#92400E'
                                            }}>
                                                {s10Res.trialResults.map((t, i) => `Trial ${i+1}: ${t.status}`).join(" | ")}
                                            </div>
                                        </div>
                                        <span className="text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-[8px] bg-white border border-current">
                                            {s10Res.overallStatus}
                                        </span>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* STEP 11: WARM-UP TIME */}
                        {currentTest.id === 11 && (
                            <div className="space-y-6">
                                {(() => {
                                    const s11Res = calculateStep11Results();
                                    const timePoints = [
                                        { key: '0min', label: '0 min' },
                                        { key: '5min', label: '5 min' },
                                        { key: '15min', label: '15 min' },
                                        { key: '30min', label: '30 min' }
                                    ];

                                    return (
                                        <>
                                            {/* 1. PRE-TEST */}
                                            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[13px] space-y-4">
                                                <div className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                                                    <i className="fas fa-power-off text-[#2563EB]"></i> Pre-Test Requirements
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-[9px]">
                                                        <div className="text-[10px] font-bold text-[#64748B] uppercase">Required Power-Off Duration</div>
                                                        <div className="text-sm font-mono font-bold text-[#0F172A] mt-0.5">&ge; 8 hours</div>
                                                    </div>
                                                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-[9px]">
                                                        <label className="text-[10px] font-bold text-[#64748B] uppercase block mb-1">
                                                            Actual Power-Off Duration (hours)
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            min="0"
                                                            placeholder="e.g. 8.0"
                                                            className="form-input text-xs font-mono font-bold"
                                                            value={step11Reading.powerOffHours}
                                                            onChange={e => setStep11Reading(prev => ({ ...prev, powerOffHours: e.target.value }))}
                                                        />
                                                    </div>
                                                    <div className="p-3 bg-white border border-[#E2E8F0] rounded-[9px]">
                                                        <div className="text-[10px] font-bold text-[#64748B] uppercase">Test Load (Close to Max)</div>
                                                        <div className="text-sm font-mono font-bold text-[#2563EB] mt-0.5">{s11Res.testLoadKg} {unit}</div>
                                                    </div>
                                                </div>

                                                {!s11Res.powerOffValid && step11Reading.powerOffHours !== '' && (
                                                    <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-[9px] text-xs font-bold text-[#991B1B] flex items-center gap-2">
                                                        <i className="fas fa-exclamation-triangle"></i>
                                                        FAIL: Actual power-off duration is less than 8 hours. OIML A.5.2 requires &ge; 8 hours.
                                                    </div>
                                                )}
                                            </div>

                                            {/* 2. WARM-UP TEST TABLE */}
                                            <div className="overflow-x-auto border border-[#E2E8F0] rounded-[13px] bg-white">
                                                <table className="w-full text-xs text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] font-bold uppercase text-[10px]">
                                                            <th className="p-3">Time</th>
                                                            <th className="p-3">Zero Error ({unit})</th>
                                                            <th className="p-3">Loaded Indication ({unit})</th>
                                                            <th className="p-3">Corrected Error ({unit})</th>
                                                            <th className="p-3 text-center">Result</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#E2E8F0]">
                                                        {timePoints.map(tp => {
                                                            const row = s11Res.evaluatedRows[tp.key] || {};
                                                            const rawInput = step11Reading.rows[tp.key] || { zeroError: '', loadedInd: '' };
                                                            return (
                                                                <tr key={tp.key} className="hover:bg-[#F8FAFC]">
                                                                    <td className="p-3 font-mono font-bold text-[#0F172A]">{tp.label}</td>
                                                                    <td className="p-3">
                                                                        <input
                                                                            type="number"
                                                                            step="any"
                                                                            placeholder="e.g. 0.0"
                                                                            className="form-input text-xs font-mono py-1.5"
                                                                            value={rawInput.zeroError}
                                                                            onChange={e => setStep11Reading(prev => ({
                                                                                ...prev,
                                                                                rows: {
                                                                                    ...prev.rows,
                                                                                    [tp.key]: { ...prev.rows[tp.key], zeroError: e.target.value }
                                                                                }
                                                                            }))}
                                                                        />
                                                                    </td>
                                                                    <td className="p-3">
                                                                        <input
                                                                            type="number"
                                                                            step="any"
                                                                            placeholder={`e.g. ${s11Res.testLoadKg}`}
                                                                            className="form-input text-xs font-mono py-1.5"
                                                                            value={rawInput.loadedInd}
                                                                            onChange={e => setStep11Reading(prev => ({
                                                                                ...prev,
                                                                                rows: {
                                                                                    ...prev.rows,
                                                                                    [tp.key]: { ...prev.rows[tp.key], loadedInd: e.target.value }
                                                                                }
                                                                            }))}
                                                                        />
                                                                    </td>
                                                                    <td className="p-3 font-mono font-bold">
                                                                        {row.correctedError !== null && row.correctedError !== undefined
                                                                            ? `${row.correctedError > 0 ? '+' : ''}${row.correctedError.toFixed(4)}`
                                                                            : '—'
                                                                        }
                                                                    </td>
                                                                    <td className="p-3 text-center font-mono font-bold">
                                                                        <span className={`px-2.5 py-1 rounded-[6px] text-[11px] ${
                                                                            row.status === 'PASS' ? 'bg-[#DCFCE7] text-[#166534]' :
                                                                            row.status === 'FAIL' ? 'bg-[#FEE2E2] text-[#991B1B]' :
                                                                            'bg-[#F1F5F9] text-[#64748B]'
                                                                        }`}>
                                                                            {row.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* OIML REQUIREMENT CHECK (CLAUSE 5.3.5) */}
                                            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[13px] space-y-2">
                                                <label className="text-xs font-bold text-[#0F172A] block">
                                                    Was a weighing result displayed or transmitted during warm-up? (OIML R 76-1 5.3.5)
                                                </label>
                                                <div className="flex gap-4">
                                                    <label className="flex items-center gap-2 text-xs font-bold text-[#0F172A] cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="displayedDuringWarmup"
                                                            value="NO"
                                                            checked={step11Reading.displayedDuringWarmup === 'NO'}
                                                            onChange={e => setStep11Reading(prev => ({ ...prev, displayedDuringWarmup: e.target.value }))}
                                                        />
                                                        No (PASS)
                                                    </label>
                                                    <label className="flex items-center gap-2 text-xs font-bold text-[#0F172A] cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="displayedDuringWarmup"
                                                            value="YES"
                                                            checked={step11Reading.displayedDuringWarmup === 'YES'}
                                                            onChange={e => setStep11Reading(prev => ({ ...prev, displayedDuringWarmup: e.target.value }))}
                                                        />
                                                        Yes (FAIL)
                                                    </label>
                                                </div>
                                            </div>

                                            {/* PHOTO PROOF */}
                                            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[13px]">
                                                <ReadingPhotoUploader
                                                    readingKey="warmup_test"
                                                    label="Capture / Select Warm-Up Test Proof Photo"
                                                    currentProof={readingProofs["warmup_test"]}
                                                    onProofUploaded={handleProofUploaded}
                                                />
                                            </div>

                                            {/* OVERALL RESULT BANNER */}
                                            <div className={`p-4 rounded-[13px] border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                                                s11Res.overallPassed ? 'bg-[#DCFCE7] border-[#BBF7D0]' : 'bg-[#FEE2E2] border-[#FECACA]'
                                            }`}>
                                                <div>
                                                    <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{
                                                        color: s11Res.overallPassed ? '#166534' : '#991B1B'
                                                    }}>
                                                        Overall Result: {s11Res.overallStatus}
                                                    </div>
                                                    <div className="text-[11px] font-mono" style={{
                                                        color: s11Res.overallPassed ? '#166534' : '#991B1B'
                                                    }}>
                                                        MPE: &plusmn;{s11Res.mpeKg.toFixed(4)} {unit} (&plusmn;{s11Res.mpe_e}e)
                                                    </div>
                                                </div>
                                                <span className={`text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-[8px] border ${
                                                    s11Res.overallPassed ? 'bg-white text-[#166534] border-[#BBF7D0]' : 'bg-white text-[#991B1B] border-[#FECACA]'
                                                }`}>
                                                    {s11Res.overallPassed ? 'PASS' : 'FAIL'}
                                                </span>
                                            </div>
                                        </>
                                    );
                                })()}
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

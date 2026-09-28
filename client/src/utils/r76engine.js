import oimlRulesetJSON from './rulesets/oiml-r76-1-2006.js';

export const OIML_CONSTANTS = {
    ZERO_SETTING_LIMIT_E: oimlRulesetJSON?.constants?.zero_setting_limit_e || 0.25,
    ZERO_RETURN_LIMIT_E: oimlRulesetJSON?.constants?.zero_return_limit_e || 0.5,
    ECCENTRICITY_FRACTION: oimlRulesetJSON?.constants?.eccentricity_load_fraction || 0.3333333333333333,
    TARE_MULTIPLIER: oimlRulesetJSON?.constants?.tare_mpe_multiplier || 1.0,
    DISCRIMINATION_MULTIPLIER: oimlRulesetJSON?.constants?.discrimination_load_multiplier || 1.4
};

export function normalizeClass(cls) {
    return (cls || "").replace(/class\s*/i, "").trim().toUpperCase();
}

/**
 * Core Formula 1: Indication before rounding (OIML R-76-1 §A.4.4.3)
 * P = I + 0.5*e - ΔL
 */
export function calculateIndicationBeforeRounding(I, e, deltaL) {
    return I + 0.5 * e - deltaL;
}

/**
 * Core Formula 2: Raw error before rounding (OIML R-76-1 §A.4.4.3)
 * E = P - L
 */
export function calculateError(P, L) {
    return P - L;
}

/**
 * Core Formula 3: Zero-load error baseline E0 (OIML R-76-1 §A.4.4.3)
 * P0 = 0 + 0.5*e - ΔL0
 * E0 = P0 - 0 = 0.5*e - ΔL0
 */
export function calculateZeroLoadError(deltaL0, e) {
    const P0 = 0 + 0.5 * e - deltaL0;
    return P0; // E0 = P0 - 0
}

/**
 * Core Formula 4: Corrected error (OIML R-76-1 §A.4.4.3)
 * Ec = E - E0
 */
export function calculateCorrectedError(E, E0 = 0) {
    return E - E0;
}

/**
 * MPE Calculation (OIML R-76 Table 6)
 * Supports initial verification and in-service inspection (2x MPE)
 */
export function getMPE(load_g, e_g, cls, activeRules = null, isInService = false) {
    const c = normalizeClass(cls);
    const m = load_g / e_g;
    let mult = 0;
    
    let intervals = oimlRulesetJSON?.mpe_table?.[`class_${c}`]?.e_intervals || [];
    let mpe_e = oimlRulesetJSON?.mpe_table?.[`class_${c}`]?.mpe_e || [0.5, 1.0, 1.5];

    if (intervals.length === 0) {
        if      (c === "I")    intervals = [50000, 200000];
        else if (c === "II")   intervals = [5000, 20000];
        else if (c === "III")  intervals = [500, 2000];
        else if (c === "IIII") intervals = [50, 200];
    }

    if (activeRules && activeRules.mpe) {
        const rules = activeRules.mpe;
        const clsKey = "class_" + c;
        if (rules[clsKey]) {
            intervals = rules[clsKey].e_intervals || intervals;
            mpe_e = rules[clsKey].mpe_e || mpe_e;
        }
    }

    if (intervals.length >= 2) {
        if (m <= intervals[0]) mult = mpe_e[0];
        else if (m <= intervals[1]) mult = mpe_e[1];
        else mult = mpe_e[2] || 1.5;
    }

    const baseMPE = mult * e_g;
    return isInService ? (baseMPE * 2) : baseMPE;
}

/**
 * MPE Tier Boundaries
 */
export function getMPETierBoundaries(cls, e_g, activeRules = null) {
    const c = normalizeClass(cls);
    let intervals = [];

    if (activeRules && activeRules.mpe) {
        const rules = activeRules.mpe;
        const clsKey = "class_" + c;
        if (rules[clsKey] && rules[clsKey].e_intervals) {
            intervals = rules[clsKey].e_intervals;
        }
    }

    if (intervals.length === 0) {
        intervals = oimlRulesetJSON?.mpe_table?.[`class_${c}`]?.e_intervals || [];
        if (intervals.length === 0) {
            if (c === "I")    intervals = [50000, 200000];
            else if (c === "II")   intervals = [5000, 20000];
            else if (c === "III")  intervals = [500, 2000];
            else if (c === "IIII") intervals = [50, 200];
        }
    }

    return intervals.map(v => v * e_g);
}

/**
 * Generate test points according to OIML R-76 §3.6
 */
export function generateTestPoints(max_g, min_g, e_g, cls, activeRules = null) {
    const pts = new Set();
    pts.add(0);

    const minLoad = (min_g > 0) ? min_g : (20 * e_g);
    if (minLoad <= max_g) pts.add(minLoad);

    getMPETierBoundaries(cls, e_g, activeRules).forEach(b => {
        if (b > minLoad && b < max_g) pts.add(b);
    });

    [0.10, 0.25, 0.50, 0.75].forEach(f => {
        const r = Math.round((max_g * f) / e_g) * e_g;
        if (r > minLoad && r < max_g) pts.add(r);
    });

    pts.add(max_g);
    return Array.from(pts).filter(p => p >= 0 && p <= max_g).sort((a, b) => a - b);
}

/**
 * Number of repeatability readings (OIML R-76 §3.6.2)
 */
export function getRepeatabilityReadings(cls) {
    const c = normalizeClass(cls);
    return (c === "I" || c === "II") ? 3 : 6;
}

// ── THE 11 CALCULABLE OIML R-76 TEST EVALUATORS ──────────────────

/**
 * Reusable Weighing Point Evaluator
 * Used by: Test 1 (Performance), Test 3 (Eccentricity), Test 10 (Tilting), Test 11 (Warm-Up), Test 12 (Voltage)
 */
export function evaluateWeighingPoint({
    L,
    I,
    deltaL,
    e,
    E0 = 0,
    cls,
    activeRules = null,
    isInService = false,
    testCondition = "normal",
    clause = "A.4.4"
}) {
    const P = calculateIndicationBeforeRounding(I, e, deltaL);
    const E = calculateError(P, L);
    const Ec = calculateCorrectedError(E, E0);
    const mpe = getMPE(L, e, cls, activeRules, isInService);
    const passed = Math.abs(Ec) <= Math.abs(mpe);
    const clauseRef = `OIML R76-1 ${clause}`;

    const signEc = Ec >= 0 ? "+" : "";
    const signMPE = "±" + Math.abs(mpe).toFixed(2);
    const explanation = `${clauseRef} (${testCondition}): Ec = ${signEc}${Ec.toFixed(2)}g within ${signMPE}g limit. Result: ${passed ? 'PASS' : 'FAIL'}.`;

    return {
        L,
        I,
        deltaL,
        P,
        E,
        Ec,
        E0,
        mpe,
        passed,
        testCondition,
        clause_reference: clauseRef,
        explanation
    };
}

/**
 * Test 2: Zero-Load Error Baseline (Clause A.4.4)
 */
export function evaluateZeroLoadError({ deltaL0, e, clause = "A.4.4" }) {
    const P0 = calculateZeroLoadError(deltaL0, e);
    const E0 = P0;
    const clauseRef = `OIML R76-1 ${clause}`;
    const signE0 = E0 >= 0 ? "+" : "";
    const explanation = `${clauseRef}: E0 zero-load error baseline calculated as ${signE0}${E0.toFixed(2)}g.`;

    return {
        P0,
        E0,
        clause_reference: clauseRef,
        explanation
    };
}

/**
 * Test 3: Eccentricity Corner Test (Clause A.4.7)
 */
export function evaluateEccentricityPoint({
    L,
    I,
    deltaL,
    e,
    E0 = 0,
    cls,
    position = "Center",
    activeRules = null,
    isInService = false,
    clause = "A.4.7"
}) {
    const res = evaluateWeighingPoint({
        L,
        I,
        deltaL,
        e,
        E0,
        cls,
        activeRules,
        isInService,
        testCondition: `eccentric_${position.toLowerCase()}`,
        clause
    });

    const signEc = res.Ec >= 0 ? "+" : "";
    const signMPE = "±" + Math.abs(res.mpe).toFixed(2);
    res.position = position;
    res.explanation = `OIML R76-1 ${clause} [${position}]: Ec = ${signEc}${res.Ec.toFixed(2)}g within ${signMPE}g limit. Result: ${res.passed ? 'PASS' : 'FAIL'}.`;
    return res;
}

/**
 * Test 4: Repeatability Test (Clause A.4.10)
 */
export function evaluateRepeatability({
    P_series = [],
    load,
    e,
    cls,
    activeRules = null,
    isInService = false,
    clause = "A.4.10"
}) {
    if (P_series.length === 0) {
        return { passed: false, clause_reference: `OIML R76-1 ${clause}`, explanation: `OIML R76-1 ${clause}: No readings provided.` };
    }

    const P_max = Math.max(...P_series);
    const P_min = Math.min(...P_series);
    const deltaP = P_max - P_min;
    const mpe = getMPE(load, e, cls, activeRules, isInService);
    const passed = deltaP <= Math.abs(mpe);
    const clauseRef = `OIML R76-1 ${clause}`;
    const signMPE = "±" + Math.abs(mpe).toFixed(2);

    const explanation = `${clauseRef}: repeatability spread ΔP of ${deltaP.toFixed(2)}g is ${passed ? 'within' : 'exceeds'} the ${signMPE}g limit for Class ${normalizeClass(cls)} at ${load}g load. Result: ${passed ? 'PASS' : 'FAIL'}.`;

    return {
        P_max,
        P_min,
        deltaP,
        mpe,
        passed,
        clause_reference: clauseRef,
        explanation
    };
}

/**
 * Test 5: Discrimination & Sensitivity Test (Clause A.4.8)
 */
export function evaluateDiscrimination({
    I1,
    I2,
    d,
    clause = "A.4.8"
}) {
    const deltaI = I2 - I1;
    const passed = deltaI >= d;
    const clauseRef = `OIML R76-1 ${clause}`;
    const explanation = `${clauseRef}: indication change ΔI = ${deltaI}g is ${passed ? '≥' : '<'} scale interval d = ${d}g (with 1.4d extra load). Result: ${passed ? 'PASS' : 'FAIL'}.`;

    return {
        I1,
        I2,
        deltaI,
        d,
        passed,
        clause_reference: clauseRef,
        explanation
    };
}

/**
 * Test 6: Tare & Zero-Setting Test (Clause A.4.2 & A.4.6.1)
 */
export function evaluateTareAndZeroSetting({
    I0 = 0,
    deltaL0 = 0,
    I_net,
    deltaL_net,
    L_net,
    e,
    cls,
    activeRules = null,
    isInService = false,
    clause = "A.4.2 / A.4.6.1"
}) {
    // 1. Zero-setting accuracy check (|E0| <= 0.25e)
    const P0 = calculateZeroLoadError(deltaL0, e);
    const E0 = P0;
    const zeroLimitE = activeRules?.constants?.zero_setting_limit_e || OIML_CONSTANTS.ZERO_SETTING_LIMIT_E;
    const zero_limit = zeroLimitE * e;
    const zero_passed = Math.abs(E0) <= zero_limit;

    // 2. Net-load accuracy check (|E_net| <= tareMult * MPE)
    const P_net = calculateIndicationBeforeRounding(I_net, e, deltaL_net);
    const E_net = calculateError(P_net, L_net);
    const baseMPE = getMPE(L_net, e, cls, activeRules, isInService);
    const tareMult = activeRules?.constants?.tare_mpe_multiplier || OIML_CONSTANTS.TARE_MULTIPLIER;
    const mpe_net = baseMPE * tareMult;
    const net_passed = Math.abs(E_net) <= Math.abs(mpe_net);

    const passed = zero_passed && net_passed;
    const clauseRef = `OIML R76-1 ${clause}`;
    const explanation = `${clauseRef}: Zero error |E0| = ${Math.abs(E0).toFixed(2)}g (${zero_passed ? '≤' : '>'} ${zero_limit.toFixed(2)}g limit) & Net error |E_net| = ${Math.abs(E_net).toFixed(2)}g (${net_passed ? '≤' : '>'} ±${Math.abs(mpe_net).toFixed(2)}g MPE). Result: ${passed ? 'PASS' : 'FAIL'}.`;

    return {
        E0,
        zero_limit,
        zero_passed,
        P_net,
        E_net,
        mpe_net,
        net_passed,
        passed,
        clause_reference: clauseRef,
        explanation
    };
}

/**
 * Test 7: Time-Dependent Error: Zero Return (Clause A.4.11.2)
 */
export function evaluateZeroReturn({
    P_zero_before,
    P_zero_after,
    e,
    clause = "A.4.11.2"
}) {
    const deltaP0 = Math.abs(P_zero_after - P_zero_before);
    const returnLimitE = OIML_CONSTANTS.ZERO_RETURN_LIMIT_E;
    const zero_return_limit = returnLimitE * e;
    const passed = deltaP0 <= zero_return_limit;
    const clauseRef = `OIML R76-1 ${clause}`;

    const explanation = `${clauseRef}: zero recovery return drift ΔP0 = ${deltaP0.toFixed(2)}g is ${passed ? '≤' : '>'} 0.5e (${zero_return_limit.toFixed(2)}g) limit after 30 min sustained load. Result: ${passed ? 'PASS' : 'FAIL'}.`;

    return {
        P_zero_before,
        P_zero_after,
        deltaP0,
        zero_return_limit,
        passed,
        clause_reference: clauseRef,
        explanation
    };
}

/**
 * Test 8: Time-Dependent Error: Creep (Clause A.4.11.1)
 */
export function evaluateCreep({
    P_start,
    P_end,
    max_load,
    e,
    cls,
    activeRules = null,
    isInService = false,
    clause = "A.4.11.1"
}) {
    const deltaP_creep = Math.abs(P_end - P_start);
    const mpe = getMPE(max_load, e, cls, activeRules, isInService);
    const passed = deltaP_creep <= Math.abs(mpe);
    const clauseRef = `OIML R76-1 ${clause}`;

    const explanation = `${clauseRef}: creep drift ΔP = ${deltaP_creep.toFixed(2)}g while load sustained is ${passed ? '≤' : '>'} MPE ±${Math.abs(mpe).toFixed(2)}g. Result: ${passed ? 'PASS' : 'FAIL'}.`;

    return {
        P_start,
        P_end,
        deltaP_creep,
        mpe,
        passed,
        clause_reference: clauseRef,
        explanation
    };
}

/**
 * Test 9: Stability of Equilibrium Test (Clause A.4.12)
 */
export function evaluateStabilityOfEquilibrium({
    instrument_locks_output_until_stable,
    clause = "A.4.12"
}) {
    const passed = Boolean(instrument_locks_output_until_stable);
    const clauseRef = `OIML R76-1 ${clause}`;
    const explanation = `${clauseRef}: technician verification: instrument output lock prior to display equilibrium is ${passed ? 'VERIFIED ACTIVE' : 'FAILED / UNLOCKED'}. Result: ${passed ? 'PASS' : 'FAIL'}.`;

    return {
        instrument_locks_output_until_stable,
        passed,
        clause_reference: clauseRef,
        explanation
    };
}

/**
 * Test 10: Tilting Test (Clause A.5.1)
 */
export function evaluateTiltingPoint(params) {
    return evaluateWeighingPoint({
        ...params,
        testCondition: "tilted",
        clause: "A.5.1"
    });
}

/**
 * Test 11: Warm-Up Time Test (Clause A.5.2)
 */
export function evaluateWarmUpPoint(params) {
    return evaluateWeighingPoint({
        ...params,
        testCondition: "cold_start",
        clause: "A.5.2"
    });
}

/**
 * Optional Test 12: Voltage Variations Test (Clause A.5.4)
 */
export function evaluateVoltageVariantPoint(params) {
    return evaluateWeighingPoint({
        ...params,
        testCondition: "voltage_variant",
        clause: "A.5.4"
    });
}

/**
 * Test Plan Generator
 */
export function generateTestPlan(instr, activeRules = {}) {
    const {
        max_g,
        min_g,
        e_g,
        cls,
        isMobile         = false,
        hasTare          = true,
        hasMultiPosition = true
    } = instr;

    const eccFrac     = (activeRules?.eccentricity?.load_fraction) ? activeRules.eccentricity.load_fraction : (1/3);
    const repMaxDiffE = (activeRules?.repeatability?.max_diff_e) ? activeRules.repeatability.max_diff_e : 1.0;
    const zeroLimitE  = (activeRules?.zero_setting?.limit_e) ? activeRules.zero_setting.limit_e : 0.25;
    const tiltLimitE  = (activeRules?.tilt?.limit_e) ? activeRules.tilt.limit_e : 1.0;
    const tareMult    = (activeRules?.tare?.mpe_multiplier) ? activeRules.tare.mpe_multiplier : 1.0;

    const testPoints  = generateTestPoints(max_g, min_g, e_g, cls, activeRules);
    const repeatLoad  = Math.round((max_g / 2) / e_g) * e_g;
    const eccLoad     = Math.round((max_g * eccFrac) / e_g) * e_g;
    const numReadings = getRepeatabilityReadings(cls);
    const nonZeroPts  = testPoints.filter(p => p > 0);

    return [
        {
            id: 1,
            name: "Visual Inspection",
            shortName: "Visual",
            icon: "fas fa-eye",
            status: "REQUIRED",
            note: "Markings, construction, sealing, levelling, display"
        },
        {
            id: 2,
            name: "Weighing Performance",
            shortName: "Weighing",
            icon: "fas fa-weight",
            status: "REQUIRED",
            note: `${nonZeroPts.length} loads × 2 (asc + desc) = ${nonZeroPts.length * 2} readings`,
            testPoints
        },
        {
            id: 3,
            name: "Repeatability",
            shortName: "Repeat.",
            icon: "fas fa-sync-alt",
            status: "REQUIRED",
            note: `${numReadings} readings at ${(repeatLoad/1000).toFixed(3)} kg (½ Max, max diff ≤ ${repMaxDiffE}e)`,
            load: repeatLoad,
            readings: numReadings,
            max_diff_e: repMaxDiffE
        },
        {
            id: 4,
            name: "Eccentricity",
            shortName: "Eccentric",
            icon: "fas fa-crosshairs",
            status: hasMultiPosition ? "REQUIRED" : "NOT_APPLICABLE",
            note: hasMultiPosition
                ? `5 positions at ${(eccLoad/1000).toFixed(3)} kg (~${Math.round(eccFrac * 100)}% Max)`
                : "N/A: single-point load receptor (e.g. crane/hanging scale)",
            load: eccLoad,
            positions: ["Front", "Right", "Rear", "Left", "Center"]
        },
        {
            id: 5,
            name: "Zero-Setting / Tracking",
            shortName: "Zero",
            icon: "fas fa-bullseye",
            status: "REQUIRED",
            note: `Limit: ±${zeroLimitE}e = ±${(zeroLimitE * e_g).toFixed(2)} g`,
            halfE_g: zeroLimitE * e_g,
            limit_e: zeroLimitE
        },
        {
            id: 6,
            name: "Tare Accuracy",
            shortName: "Tare",
            icon: "fas fa-balance-scale",
            status: hasTare ? "IF_APPLICABLE" : "NOT_APPLICABLE",
            note: hasTare
                ? `Include if tare device used (Tolerance: ${tareMult} × MPE)`
                : "N/A: instrument has no tare device",
            mpe_multiplier: tareMult
        },
        {
            id: 7,
            name: "Discrimination / Sensitivity",
            shortName: "Discrim.",
            icon: "fas fa-sliders-h",
            status: "REQUIRED",
            note: "Discrimination test at Min, 50% Max, and Max (1.4d extra load)"
        },
        {
            id: 8,
            name: "Tilt Test",
            shortName: "Tilt",
            icon: "fas fa-arrows-alt",
            status: isMobile ? "REQUIRED" : "IF_MOBILE",
            note: isMobile
                ? `Required: mobile instrument. Limit: ${tiltLimitE}e = ${(tiltLimitE * e_g).toFixed(2)} g`
                : `Include if mobile/portable (Limit: ${tiltLimitE}e)`,
            limit_g: tiltLimitE * e_g,
            limit_e: tiltLimitE
        },
        {
            id: 9,
            name: "Time-Dependent Error (Zero Return & Creep)",
            shortName: "Creep / Zero Return",
            icon: "fas fa-clock",
            status: "REQUIRED",
            note: "30 min sustained load creep (Clause A.4.11.1) & zero return recovery (Clause A.4.11.2)"
        },
        {
            id: 10,
            name: "Stability of Equilibrium",
            shortName: "Stability",
            icon: "fas fa-anchor",
            status: "REQUIRED",
            note: "Verification of printout/data output lock prior to display equilibrium (Clause A.4.12)"
        },
        {
            id: 11,
            name: "Warm-Up Time",
            shortName: "Warm-Up",
            icon: "fas fa-temperature-low",
            status: "REQUIRED",
            note: "Cold-start weighing performance test immediately after power-on (Clause A.5.2)"
        },
        {
            id: 12,
            name: "Environmental / Influence Tests",
            shortName: "Environmental",
            icon: "fas fa-flask",
            status: "STATIC_DATA_ENTRY",
            note: "Recorded static lab forms: Damp Heat (B.2.2), EMC (B.3), Span Stability (B.4), Endurance (A.6)"
        }
    ];
}

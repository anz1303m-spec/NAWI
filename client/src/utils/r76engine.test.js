// Unit Tests for NAWI OIML R-76 Core Calculation Engine (11 Evaluators)
import {
    getMPE,
    getMPETierBoundaries,
    evaluateWeighingPoint,
    evaluateZeroLoadError,
    evaluateEccentricityPoint,
    evaluateRepeatability,
    evaluateDiscrimination,
    evaluateTareAndZeroSetting,
    evaluateZeroReturn,
    evaluateCreep,
    evaluateStabilityOfEquilibrium,
    evaluateTiltingPoint,
    evaluateWarmUpPoint
} from './r76engine.js';

function assert(condition, message) {
    if (!condition) {
        throw new Error("❌ Test Failed: " + message);
    }
}

export function runOIMLEngineTests() {
    console.log("🧪 Running OIML R-76-1 Calculation Engine Unit Tests...");

    // 1. MPE Tier Boundaries Worked Example (Class III, Max = 15000g, e = 5g)
    const mpeTier1 = getMPE(1000, 5, "Class III"); // 200e -> Tier 1 (<=500e)
    assert(mpeTier1 === 2.5, `Class III Tier 1 MPE at 1000g should be 2.5g, got ${mpeTier1}`);

    const mpeTier2 = getMPE(5000, 5, "Class III"); // 1000e -> Tier 2 (500e-2000e)
    assert(mpeTier2 === 5.0, `Class III Tier 2 MPE at 5000g should be 5.0g, got ${mpeTier2}`);

    const mpeTier3 = getMPE(15000, 5, "Class III"); // 3000e -> Tier 3 (>2000e)
    assert(mpeTier3 === 7.5, `Class III Tier 3 MPE at 15000g should be 7.5g, got ${mpeTier3}`);
    console.log("  ✅ Worked Example 1 (MPE Table Bounding): PASSED");

    // 2. Test 2: Zero-Load Error Baseline (Worked Example: ΔL0 = 1.5g, e = 5g)
    const zeroRes = evaluateZeroLoadError({ deltaL0: 1.5, e: 5 });
    assert(zeroRes.E0 === 1.0, `Zero-load error E0 should be +1.0g, got ${zeroRes.E0}`);
    console.log("  ✅ Worked Example 2 (Zero-Load Baseline E0 = +1.0g): PASSED");

    // 3. Test 1: Weighing Performance Test (Worked Example: L=5000g, I=5000g, ΔL=2.0g, e=5g, E0=+1.0g)
    const wpRes = evaluateWeighingPoint({
        L: 5000,
        I: 5000,
        deltaL: 2.0,
        e: 5,
        E0: zeroRes.E0,
        cls: "Class III"
    });
    assert(wpRes.P === 5000.5, `P should be 5000.5g, got ${wpRes.P}`);
    assert(wpRes.E === 0.5, `E should be +0.5g, got ${wpRes.E}`);
    assert(wpRes.Ec === -0.5, `Corrected Error Ec should be -0.5g, got ${wpRes.Ec}`);
    assert(wpRes.mpe === 5.0, `MPE should be 5.0g, got ${wpRes.mpe}`);
    assert(wpRes.passed === true, "Weighing performance point should PASS");
    assert(wpRes.clause_reference === "OIML R76-1 A.4.4", `Clause reference error: ${wpRes.clause_reference}`);
    console.log("  ✅ Worked Example 3 (Weighing Performance Point Ec = -0.5g <= ±5.0g): PASSED");

    // 4. Test 3: Eccentricity Corner Test (Worked Example: Back-Right I=4995g, ΔL=1.0g, L_ecc=5000g, E0=+1.0g)
    const eccRes = evaluateEccentricityPoint({
        L: 5000,
        I: 4995,
        deltaL: 1.0,
        e: 5,
        E0: 1.0,
        cls: "Class III",
        position: "Back-Right"
    });
    assert(eccRes.P === 4996.5, `P should be 4996.5g, got ${eccRes.P}`);
    assert(eccRes.E === -3.5, `E should be -3.5g, got ${eccRes.E}`);
    assert(eccRes.Ec === -4.5, `Ec should be -4.5g, got ${eccRes.Ec}`);
    assert(eccRes.mpe === 5.0, `MPE should be 5.0g, got ${eccRes.mpe}`);
    assert(eccRes.passed === true, "Eccentricity point should PASS");
    assert(eccRes.clause_reference === "OIML R76-1 A.4.7", `Clause reference error: ${eccRes.clause_reference}`);
    console.log("  ✅ Worked Example 4 (Eccentricity Corner Ec = -4.5g <= ±5.0g): PASSED");

    // 5. Test 4: Repeatability Test (Worked Example: P_max=15003.5g, P_min=14998.0g, ΔP=5.5g, MPE=±7.5g)
    const repRes = evaluateRepeatability({
        P_series: [15003.5, 14999.0, 15001.0, 14998.0, 15002.5],
        load: 15000,
        e: 5,
        cls: "Class III"
    });
    assert(repRes.deltaP === 5.5, `Repeatability spread ΔP should be 5.5g, got ${repRes.deltaP}`);
    assert(repRes.mpe === 7.5, `MPE at 15000g Class III should be 7.5g, got ${repRes.mpe}`);
    assert(repRes.passed === true, "Repeatability should PASS");
    assert(repRes.clause_reference === "OIML R76-1 A.4.10", `Clause reference error: ${repRes.clause_reference}`);
    console.log("  ✅ Worked Example 5 (Repeatability ΔP = 5.5g <= 7.5g): PASSED");

    // 6. Test 5: Discrimination Test (Worked Example: I1=15000g, I2=15005g, d=5g)
    const discRes = evaluateDiscrimination({ I1: 15000, I2: 15005, d: 5 });
    assert(discRes.deltaI === 5, `ΔI should be 5g, got ${discRes.deltaI}`);
    assert(discRes.passed === true, "Discrimination should PASS");
    assert(discRes.clause_reference === "OIML R76-1 A.4.8", `Clause reference error: ${discRes.clause_reference}`);
    console.log("  ✅ Worked Example 6 (Discrimination ΔI = 5g >= 5g): PASSED");

    // 7. Test 6: Tare & Zero-Setting Test
    const tareRes = evaluateTareAndZeroSetting({
        I0: 0,
        deltaL0: 2.5,
        I_net: 5000,
        deltaL_net: 2.5,
        L_net: 5000,
        e: 5,
        cls: "Class III"
    });
    assert(tareRes.zero_passed === true, "Zero setting check should pass");
    assert(tareRes.net_passed === true, "Net load check should pass");
    assert(tareRes.passed === true, "Tare & Zero test should PASS");
    assert(tareRes.clause_reference === "OIML R76-1 A.4.2 / A.4.6.1", `Clause reference error: ${tareRes.clause_reference}`);
    console.log("  ✅ Worked Example 7 (Tare & Zero-Setting Subchecks): PASSED");

    // 8. Test 7: Zero Return Test (Worked Example: P0_before=0.5g, P0_after=2.0g, e=5g)
    const zrRes = evaluateZeroReturn({ P_zero_before: 0.5, P_zero_after: 2.0, e: 5 });
    assert(zrRes.deltaP0 === 1.5, `ΔP0 should be 1.5g, got ${zrRes.deltaP0}`);
    assert(zrRes.zero_return_limit === 2.5, `Limit 0.5e should be 2.5g, got ${zrRes.zero_return_limit}`);
    assert(zrRes.passed === true, "Zero return should PASS");
    assert(zrRes.clause_reference === "OIML R76-1 A.4.11.2", `Clause reference error: ${zrRes.clause_reference}`);
    console.log("  ✅ Worked Example 8 (Zero Return ΔP0 = 1.5g <= 2.5g): PASSED");

    // 9. Test 8: Creep Test (Worked Example: P_start=15000g, P_end=15003g, max_load=15000g, e=5g)
    const creepRes = evaluateCreep({ P_start: 15000, P_end: 15003, max_load: 15000, e: 5, cls: "Class III" });
    assert(creepRes.deltaP_creep === 3.0, `Creep drift should be 3.0g, got ${creepRes.deltaP_creep}`);
    assert(creepRes.passed === true, "Creep test should PASS");
    assert(creepRes.clause_reference === "OIML R76-1 A.4.11.1", `Clause reference error: ${creepRes.clause_reference}`);
    console.log("  ✅ Worked Example 9 (Creep Drift ΔP = 3.0g <= MPE 7.5g): PASSED");

    // 10. Test 9: Stability of Equilibrium
    const stabRes = evaluateStabilityOfEquilibrium({ instrument_locks_output_until_stable: true });
    assert(stabRes.passed === true, "Stability test should PASS");
    assert(stabRes.clause_reference === "OIML R76-1 A.4.12", `Clause reference error: ${stabRes.clause_reference}`);
    console.log("  ✅ Worked Example 10 (Stability Output Lock Verification): PASSED");

    // 11. Test 10 & 11: Tilting & Warm-Up Time Test
    const tiltRes = evaluateTiltingPoint({ L: 5000, I: 5000, deltaL: 2.5, e: 5, E0: 0, cls: "Class III" });
    assert(tiltRes.passed === true && tiltRes.clause_reference === "OIML R76-1 A.5.1", "Tilting test should PASS");
    console.log("  ✅ Worked Example 11 (Tilting Clause A.5.1): PASSED");

    const warmupRes = evaluateWarmUpPoint({ L: 5000, I: 5000, deltaL: 2.5, e: 5, E0: 0, cls: "Class III" });
    assert(warmupRes.passed === true && warmupRes.clause_reference === "OIML R76-1 A.5.2", "Warm-Up test should PASS");
    console.log("  ✅ Worked Example 12 (Warm-Up Clause A.5.2): PASSED");

    console.log("\n🎉 ALL 11 OIML R-76 CALCULABLE TEST EVALUATOR SUITES PASSED VERIFIED!\n");
    return true;
}

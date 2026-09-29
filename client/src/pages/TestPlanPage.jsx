import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { generateTestPlan } from '../utils/r76engine';

export default function TestPlanPage() {
    const navigate = useNavigate();

    const [testPlan, setTestPlan] = useState([]);
    const [instrument, setInstrument] = useState({});
    const [ruleSetVersion, setRuleSetVersion] = useState("OIML R-76 V1");
    const [selectedModalTest, setSelectedModalTest] = useState(null);

    useEffect(() => {
        const rawInst = localStorage.getItem("InstrumentData");
        if (!rawInst) {
            navigate('/new-test');
            return;
        }

        const instData = JSON.parse(rawInst);
        setInstrument(instData);

        const version = localStorage.getItem("RuleSetVersion") || "OIML R-76 V1";
        setRuleSetVersion(version);

        let activeRules = {};
        try {
            activeRules = JSON.parse(localStorage.getItem("RuleSetRules") || "{}");
        } catch (e) {}

        const maxKg = Number(localStorage.getItem("Capacity")) || Number(instData.capacity) || 1000;
        const eG = Number(localStorage.getItem("eValue")) || Number(instData.e_value) || 10;
        const cls = localStorage.getItem("ClassValue") || instData.Class_value || "class III";
        const minG = Number(localStorage.getItem("minCapacity")) || (20 * eG);

        const isMobile = localStorage.getItem("isMobile") === "true";
        const hasTare = localStorage.getItem("hasTare") !== "false";
        const hasMultiPosition = localStorage.getItem("hasMultiPosition") !== "false";

        const plan = generateTestPlan({
            max_g: maxKg * 1000,
            min_g: minG,
            e_g: eG,
            cls,
            isMobile,
            hasTare,
            hasMultiPosition
        }, activeRules);

        setTestPlan(plan);
        localStorage.setItem("testPlan", JSON.stringify(plan));
        if (plan[1] && plan[1].testPoints) {
            localStorage.setItem("testPoints_g", JSON.stringify(plan[1].testPoints));
        }
    }, [navigate]);

    const requiredCount = testPlan.filter(t => t.status === "REQUIRED").length;
    const optionalCount = testPlan.filter(t => t.status === "IF_APPLICABLE").length;
    const loadPointsCount = (testPlan[1] && testPlan[1].testPoints) ? testPlan[1].testPoints.length : 0;

    const handleConfirm = () => {
        localStorage.setItem("confirmedTestPlan", JSON.stringify(testPlan));
        navigate('/tests');
    };

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title="Dynamic Test Planner" />
                <div className="app-content">
                    {/* Summary Card */}
                    <div className="tactile-raised mb-6">
                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#E2E8F0]">
                            <div>
                                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest block mb-0.5">
                                    Metrological Evaluation Specification
                                </span>
                                <h2 className="text-lg font-bold text-[#0F172A] font-['Outfit'] uppercase tracking-tight m-0">
                                    Automated Test Plan & Load Schedule
                                </h2>
                            </div>
                            <span className="bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1 rounded-[11px] text-xs font-mono font-bold text-[#0F172A] shadow-[inset_1px_1px_3px_#CBD5E1]">
                                TP-SCHEDULE
                            </span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] px-3 py-1 rounded-[11px] text-[11px] font-bold shadow-[inset_1px_1px_3px_#CBD5E1]">
                                <i className="fas fa-book mr-1 text-[#475569]"></i> Governing Ruleset: {ruleSetVersion}
                            </span>
                        </div>

                        <div className="text-xs text-[#475569] mb-4">
                            <strong className="text-[#0F172A]">{instrument.manufacturer} {instrument.model}</strong> &bull; Serial: {instrument.serial_no} &bull; Class: {instrument.Class_value} &bull; Capacity: {instrument.capacity} kg (e = {instrument.e_value} g)
                        </div>

                        <div className="flex gap-4 flex-wrap border-t border-[#E2E8F0] pt-3 text-xs">
                            <span className="text-[#166534] font-bold">{requiredCount} Required Tests</span>
                            <span className="text-[#92400E] font-bold">{optionalCount} Conditional Tests</span>
                            <span className="text-[#0F172A] font-bold">{loadPointsCount} Asc/Desc Load Points</span>
                            <span className="text-[#64748B]">Estimated Duration: ~15 min</span>
                        </div>
                    </div>

                    {/* Test List */}
                    <div className="mb-6">
                        <h3 className="mt-0 mb-3 text-xs font-bold text-[#0F172A] uppercase tracking-wider font-['Outfit']">
                            Evaluation Modules per OIML R 76-1
                        </h3>
                        
                        <div className="flex flex-col gap-3">
                            {testPlan.map((t) => (
                                <div key={t.id} className="bg-white border border-[#E2E8F0] rounded-[13px] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-10 h-10 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] rounded-[11px] grid place-items-center text-sm shrink-0">
                                            <i className={t.icon}></i>
                                        </div>
                                        <div>
                                            <h4 className="m-0 mb-0.5 text-xs font-bold text-[#0F172A] font-['Outfit'] uppercase">
                                                {t.id}. {t.name}
                                            </h4>
                                            <p className="m-0 text-[11px] text-[#475569]">{t.note}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 self-end sm:self-center">
                                        <span className={`status-badge ${
                                            t.status === 'REQUIRED' ? 'status-pass' : t.status === 'IF_APPLICABLE' ? 'status-pending' : 'status-fail'
                                        }`}>
                                            {t.status === 'REQUIRED' ? 'REQUIRED' : 'CONDITIONAL'}
                                        </span>
                                        <button className="btn-secondary px-3 py-1.5 text-xs font-bold" onClick={() => setSelectedModalTest(t)}>
                                            <i className="fas fa-info-circle"></i> Info
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-[13px] border border-[#E2E8F0] shadow-sm">
                        <div className="text-xs font-bold text-[#166534]">
                            <i className="fas fa-check-circle mr-1.5"></i> {requiredCount} required test modules ready for execution
                        </div>
                        <button className="btn px-6 py-2.5 text-xs tracking-wider uppercase font-bold w-full sm:w-auto" onClick={handleConfirm}>
                            Confirm Plan & Begin Execution <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>

                    {/* Modal */}
                    {selectedModalTest && (
                        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-5" onClick={() => setSelectedModalTest(null)}>
                            <div className="bg-white rounded-[14px] p-6 max-w-lg w-full border border-[#E2E8F0] shadow-xl" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0] mb-4">
                                    <h3 className="m-0 text-sm font-bold text-[#0F172A] uppercase tracking-wide font-['Outfit']">
                                        {selectedModalTest.name} Specification
                                    </h3>
                                    <button className="bg-transparent border-0 text-xl cursor-pointer text-[#64748B] hover:text-[#0F172A]" onClick={() => setSelectedModalTest(null)}>
                                        &times;
                                    </button>
                                </div>
                                <p className="text-xs text-[#475569] leading-relaxed mb-4">{selectedModalTest.note}</p>
                                
                                {selectedModalTest.testPoints && (
                                    <div>
                                        <span className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block mb-2">
                                            Calculated Test Load Points:
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedModalTest.testPoints.map((p, idx) => (
                                                <span key={idx} className="bg-[#F1F5F9] border border-[#E2E8F0] px-2.5 py-1 rounded-[11px] text-xs font-mono font-bold text-[#0F172A] shadow-[inset_1px_1px_3px_#CBD5E1]">
                                                    {p >= 1000 ? `${p/1000} kg` : `${p} g`}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 text-right">
                                    <button className="btn px-4 py-2 text-xs font-bold" onClick={() => setSelectedModalTest(null)}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

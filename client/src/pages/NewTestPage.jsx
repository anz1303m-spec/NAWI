import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function NewTestPage() {
    const navigate = useNavigate();

    const [activeRule, setActiveRule] = useState("OIML R-76 V1");
    const [activeRuleRules, setActiveRuleRules] = useState(null);

    const [formData, setFormData] = useState({
        instrument_type: "platform",
        Class_value: "class III",
        capacity: "",
        max_unit: "kg",
        min_capacity: "",
        min_unit: "g",
        e_value: "",
        e_unit: "g",
        manufacturer: "",
        model: "",
        serial_no: "",
        lab_name: "",
        lab_location: "",
        temperature: "",
        humidity: "",
        voltage: ""
    });

    const [files, setFiles] = useState({
        photo_front: null,
        photo_nameplate: null,
        photo_rear_side: null,
        doc_tech_spec: null,
        doc_operating_manual: null,
        doc_drawing: null
    });

    const [previews, setPreviews] = useState({
        photo_front: null,
        photo_nameplate: null,
        photo_rear_side: null
    });

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/rules/active`)
            .then(res => res.json())
            .then(data => {
                if (data && data.version_name) {
                    setActiveRule(data.version_name);
                    setActiveRuleRules(data.rules);
                }
            })
            .catch(err => console.error("Failed to fetch active rule set:", err));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e, field) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFiles(prev => ({ ...prev, [field]: selectedFile }));

            if (field.startsWith('photo_')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviews(prev => ({ ...prev, [field]: reader.result }));
                };
                reader.readAsDataURL(selectedFile);
            }
        }
    };

    const removePhoto = (field) => {
        setFiles(prev => ({ ...prev, [field]: null }));
        setPreviews(prev => ({ ...prev, [field]: null }));
    };

    const readFileAsBase64 = (file) => {
        if (!file) return Promise.resolve("");
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const {
            capacity, min_capacity, e_value, manufacturer, model, serial_no,
            lab_name, lab_location, temperature, humidity, voltage
        } = formData;

        if (
            !capacity || !min_capacity || !e_value || !manufacturer || !model ||
            !serial_no || !lab_name || !lab_location || !temperature || !humidity || !voltage
        ) {
            alert("Please fill in all required instrument specifications and laboratory conditions before proceeding.");
            return;
        }

        if (!files.photo_front || !files.photo_nameplate || !files.photo_rear_side || !files.doc_tech_spec) {
            alert("Please upload all required Instrument Photographs (Front View, Nameplate, Rear/Side View) and Technical Spec Document.");
            return;
        }

        const maxKg = Number(capacity);
        const eG = Number(e_value);

        if (isNaN(maxKg) || maxKg <= 0 || isNaN(eG) || eG <= 0) {
            alert("Please enter valid positive numbers for Max Capacity and Verification Interval (e).");
            return;
        }

        const minG = Number(min_capacity) * (formData.min_unit === "kg" ? 1000 : 1);

        const photoFrontBase64 = await readFileAsBase64(files.photo_front);
        const photoNameplateBase64 = await readFileAsBase64(files.photo_nameplate);
        const photoRearSideBase64 = await readFileAsBase64(files.photo_rear_side);
        const docTechSpecBase64 = await readFileAsBase64(files.doc_tech_spec);
        const docManualBase64 = await readFileAsBase64(files.doc_operating_manual);
        const docDrawingBase64 = await readFileAsBase64(files.doc_drawing);

        const adminEvidence = {
            photo_front: { name: files.photo_front?.name || "", data: photoFrontBase64 },
            photo_nameplate: { name: files.photo_nameplate?.name || "", data: photoNameplateBase64 },
            photo_rear_side: { name: files.photo_rear_side?.name || "", data: photoRearSideBase64 },
            doc_tech_spec: { name: files.doc_tech_spec?.name || "", data: docTechSpecBase64 },
            doc_operating_manual: { name: files.doc_operating_manual?.name || "", data: docManualBase64 },
            doc_drawing: { name: files.doc_drawing?.name || "", data: docDrawingBase64 }
        };

        const labDetails = {
            name: formData.lab_name,
            location: formData.lab_location,
            temperature: formData.temperature,
            humidity: formData.humidity,
            voltage: formData.voltage
        };

        try {
            localStorage.setItem("InstrumentData", JSON.stringify(formData));
            localStorage.setItem("LabDetails", JSON.stringify(labDetails));
            localStorage.setItem("AdministrativeEvidence", JSON.stringify(adminEvidence));
            localStorage.setItem("InstrumentPhoto", photoFrontBase64 || photoNameplateBase64 || photoRearSideBase64 || "");
            localStorage.setItem("RuleSetVersion", activeRule);
            if (activeRuleRules) {
                localStorage.setItem("RuleSetRules", JSON.stringify(activeRuleRules));
            }

            localStorage.setItem("Capacity", maxKg);
            localStorage.setItem("eValue", eG);
            localStorage.setItem("ClassValue", formData.Class_value);
            localStorage.setItem("minCapacity", minG);

            let isMobile = false;
            let hasMultiPosition = true;

            if (formData.instrument_type === "crane") {
                hasMultiPosition = false;
            } else if (formData.instrument_type === "mobile") {
                isMobile = true;
            }

            localStorage.setItem("isMobile", isMobile ? "true" : "false");
            localStorage.setItem("hasTare", "true");
            localStorage.setItem("hasMultiPosition", hasMultiPosition ? "true" : "false");
            localStorage.setItem("instrumentType", formData.instrument_type);

            // Clear previous session data
            [
                "confirmedTestPlan", "testPlan", "testPoints_g",
                "form0", "form0_results", "form1", "form1_results",
                "form2", "form2_results", "form3", "form3_results",
                "form_zero", "form_zero_results", "form_tare", "form_tare_results",
                "form_tilt", "form_tilt_results",
                "evidence_1", "evidence_2", "evidence_3", "evidence_4", "evidence_5", "evidence_6", "evidence_8"
            ].forEach(k => localStorage.removeItem(k));
        } catch (err) {
            console.error("Failed to save session data:", err);
            if (err.name === "QuotaExceededError" || err.code === 22) {
                alert("Storage quota exceeded. The uploaded files may be too large. Please try smaller images (under 1 MB each) or clear your browser data and retry.");
            } else {
                alert("An unexpected error occurred while saving session data. Please try again.");
            }
            return;
        }

        navigate('/test-plan');
    };

    return (
        <div className="app-wrapper">
            <Sidebar />
            <div className="app-main">
                <Header title="Instrument Setup & Registration" />
                <div className="app-content">

                    {/* Page Header */}
                    <div className="mb-6">
                        <span className="text-[10px] font-bold text-[#7A7469] uppercase tracking-widest block mb-1">
                            OIML R 76-1 Metrological Intake
                        </span>
                        <h2 className="text-xl md:text-2xl font-['Outfit'] font-bold text-[#1C1A17] uppercase tracking-tight m-0">
                            Automatic Test Planner Setup
                        </h2>
                        <p className="text-xs text-[#5C5852] mt-1 mb-4">
                            Configure instrument parameters and upload required administrative evidence for automated evaluation.
                        </p>

                        <div className="p-3.5 bg-[#EAE4D6] border border-[#DED7C8] rounded-[13px] shadow-[inset_1px_1px_3px_#DBD3C3]">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2.5">
                                    <span className="bg-[#E2EBDC] text-[#2D5A27] border border-[#C5DAC0] text-[10px] font-bold px-2.5 py-0.5 rounded-[11px] uppercase tracking-wider">
                                        Active Governing Ruleset
                                    </span>
                                    <span className="font-bold text-[#1C1A17] text-xs font-['Outfit']">
                                        {activeRule}
                                    </span>
                                </div>
                                <span className="text-[11px] text-[#5C5852] font-semibold">
                                    OIML R-76-1:2006 (E) Metrological Tolerance Engine
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="tactile-raised">
                        <form onSubmit={handleSubmit}>
                            {/* Section 1: Instrument Specifications */}
                            <h3 className="m-0 pb-3 border-b border-[#DED7C8] text-[#1C1A17] font-['Outfit'] text-sm font-bold uppercase tracking-wider">
                                1. Instrument Specifications & Metrological Parameters
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                                <div className="form-group">
                                    <label>Instrument Type</label>
                                    <select name="instrument_type" className="form-input" value={formData.instrument_type} onChange={handleChange} required>
                                        <option value="platform">Platform Scale</option>
                                        <option value="analytical">Analytical Balance</option>
                                        <option value="crane">Crane / Hanging Scale</option>
                                        <option value="mobile">Mobile / Portable Scale</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Accuracy Class</label>
                                    <select name="Class_value" className="form-input" value={formData.Class_value} onChange={handleChange} required>
                                        <option value="class I">Class I (Special Accuracy)</option>
                                        <option value="class II">Class II (High Accuracy)</option>
                                        <option value="class III">Class III (Medium Accuracy)</option>
                                        <option value="class IIII">Class IIII (Ordinary Accuracy)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Max Capacity (Max)</label>
                                    <div className="flex gap-2">
                                        <input type="number" step="any" name="capacity" placeholder="e.g. 1000" className="form-input flex-1" value={formData.capacity} onChange={handleChange} required />
                                        <select name="max_unit" value={formData.max_unit} onChange={handleChange} className="form-input w-20">
                                            <option value="kg">kg</option>
                                            <option value="g">g</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Min Capacity (Min)</label>
                                    <div className="flex gap-2">
                                        <input type="number" step="any" name="min_capacity" placeholder="e.g. 20" className="form-input flex-1" value={formData.min_capacity} onChange={handleChange} required />
                                        <select name="min_unit" value={formData.min_unit} onChange={handleChange} className="form-input w-20">
                                            <option value="g">g</option>
                                            <option value="kg">kg</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Verification Scale Interval (e)</label>
                                    <div className="flex gap-2">
                                        <input type="number" step="any" name="e_value" placeholder="e.g. 10" className="form-input flex-1" value={formData.e_value} onChange={handleChange} required />
                                        <select name="e_unit" value={formData.e_unit} onChange={handleChange} className="form-input w-20">
                                            <option value="g">g</option>
                                            <option value="mg">mg</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Machine Make / Manufacturer</label>
                                    <input type="text" name="manufacturer" placeholder="e.g. Mettler Toledo" className="form-input" value={formData.manufacturer} onChange={handleChange} required />
                                </div>

                                <div className="form-group">
                                    <label>Model Name / Series</label>
                                    <input type="text" name="model" placeholder="e.g. IND570" className="form-input" value={formData.model} onChange={handleChange} required />
                                </div>

                                <div className="form-group">
                                    <label>Serial Number (S/N)</label>
                                    <input type="text" name="serial_no" placeholder="e.g. SN-987654321" className="form-input" value={formData.serial_no} onChange={handleChange} required />
                                </div>
                            </div>

                            {/* Section 2: Instrument & Administrative Evidence Uploads */}
                            <div className="mt-7 p-5 bg-[#EAE4D6] border border-[#DED7C8] rounded-[13px] shadow-[inset_1px_1px_3px_#DBD3C3]">
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                    <div>
                                        <h4 className="m-0 text-[#1C1A17] text-xs font-bold uppercase tracking-wider font-['Outfit'] flex items-center gap-2">
                                            <i className="fas fa-camera-retro text-[#1C1A17]"></i> 2. Instrument & Administrative Evidence Uploads
                                        </h4>
                                        <p className="m-0 text-[11px] text-[#5C5852] mt-0.5">
                                            Attach verified photographs and technical compliance documents required for certification trail.
                                        </p>
                                    </div>
                                    <span className="bg-[#F4F0E8] text-[#1C1A17] border border-[#DED7C8] px-2.5 py-1 rounded-[11px] text-[10px] font-bold uppercase tracking-wider">
                                        OIML R-76 §A.3 Evidence Vault
                                    </span>
                                </div>

                                {/* Photographed Evidence Upload Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                                    {/* Front View */}
                                    <div className="bg-[#F4F0E8] border border-[#DED7C8] rounded-[13px] p-3.5 shadow-[2px_2px_6px_#DBD3C3]">
                                        <div className="text-xs font-bold text-[#1C1A17] mb-2 flex justify-between">
                                            <span>Front View Photo <span className="text-[#8B2522]">*</span></span>
                                            {previews.photo_front && (
                                                <button type="button" onClick={() => removePhoto('photo_front')} className="text-[#8B2522] hover:underline text-[10px] bg-transparent border-0 cursor-pointer">
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        {previews.photo_front ? (
                                            <div className="relative">
                                                <img src={previews.photo_front} alt="Front View" className="w-full h-32 object-cover rounded-[11px] border border-[#DED7C8]" />
                                                <div className="absolute bottom-1.5 left-1.5 bg-[#1C1A17]/80 text-[#F4F0E8] text-[9px] px-2 py-0.5 rounded-[6px] font-mono">
                                                    Attached
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="border-2 border-dashed border-[#DED7C8] hover:border-[#1C1A17] rounded-[11px] h-32 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#EAE4D6]/50">
                                                <i className="fas fa-camera text-[#7A7469] text-xl mb-1"></i>
                                                <span className="text-xs font-bold text-[#1C1A17]">Select Front Photo</span>
                                                <span className="text-[10px] text-[#7A7469]">Platform and Display</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'photo_front')} />
                                            </label>
                                        )}
                                    </div>

                                    {/* Nameplate View */}
                                    <div className="bg-[#F4F0E8] border border-[#DED7C8] rounded-[13px] p-3.5 shadow-[2px_2px_6px_#DBD3C3]">
                                        <div className="text-xs font-bold text-[#1C1A17] mb-2 flex justify-between">
                                            <span>Nameplate / S/N Photo <span className="text-[#8B2522]">*</span></span>
                                            {previews.photo_nameplate && (
                                                <button type="button" onClick={() => removePhoto('photo_nameplate')} className="text-[#8B2522] hover:underline text-[10px] bg-transparent border-0 cursor-pointer">
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        {previews.photo_nameplate ? (
                                            <div className="relative">
                                                <img src={previews.photo_nameplate} alt="Nameplate" className="w-full h-32 object-cover rounded-[11px] border border-[#DED7C8]" />
                                                <div className="absolute bottom-1.5 left-1.5 bg-[#1C1A17]/80 text-[#F4F0E8] text-[9px] px-2 py-0.5 rounded-[6px] font-mono">
                                                    Attached
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="border-2 border-dashed border-[#DED7C8] hover:border-[#1C1A17] rounded-[11px] h-32 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#EAE4D6]/50">
                                                <i className="fas fa-id-card text-[#7A7469] text-xl mb-1"></i>
                                                <span className="text-xs font-bold text-[#1C1A17]">Select Nameplate Photo</span>
                                                <span className="text-[10px] text-[#7A7469]">Ratings & Stamped Marks</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'photo_nameplate')} />
                                            </label>
                                        )}
                                    </div>

                                    {/* Rear / Side View */}
                                    <div className="bg-[#F4F0E8] border border-[#DED7C8] rounded-[13px] p-3.5 shadow-[2px_2px_6px_#DBD3C3]">
                                        <div className="text-xs font-bold text-[#1C1A17] mb-2 flex justify-between">
                                            <span>Rear/Side View Photo <span className="text-[#8B2522]">*</span></span>
                                            {previews.photo_rear_side && (
                                                <button type="button" onClick={() => removePhoto('photo_rear_side')} className="text-[#8B2522] hover:underline text-[10px] bg-transparent border-0 cursor-pointer">
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        {previews.photo_rear_side ? (
                                            <div className="relative">
                                                <img src={previews.photo_rear_side} alt="Rear/Side" className="w-full h-32 object-cover rounded-[11px] border border-[#DED7C8]" />
                                                <div className="absolute bottom-1.5 left-1.5 bg-[#1C1A17]/80 text-[#F4F0E8] text-[9px] px-2 py-0.5 rounded-[6px] font-mono">
                                                    Attached
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="border-2 border-dashed border-[#DED7C8] hover:border-[#1C1A17] rounded-[11px] h-32 flex flex-col items-center justify-center cursor-pointer transition-colors bg-[#EAE4D6]/50">
                                                <i className="fas fa-cube text-[#7A7469] text-xl mb-1"></i>
                                                <span className="text-xs font-bold text-[#1C1A17]">Select Rear/Side Photo</span>
                                                <span className="text-[10px] text-[#7A7469]">Seals & Connection Ports</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'photo_rear_side')} />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Supporting Technical Documents Dropzone Cards */}
                                <div>
                                    <label className="font-bold text-xs text-[#1C1A17] uppercase tracking-wider mb-2.5 block">
                                        <i className="fas fa-file-contract mr-1.5 text-[#5C5852]"></i> Supporting Compliance Documents
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Technical Spec */}
                                        <div className="bg-[#F4F0E8] border border-[#DED7C8] rounded-[13px] p-3.5 shadow-[2px_2px_6px_#DBD3C3]">
                                            <div className="text-xs font-bold text-[#1C1A17] mb-2">
                                                Technical Specification Sheet <span className="text-[#8B2522]">*</span>
                                            </div>
                                            <label className="block cursor-pointer">
                                                <div className="p-2.5 bg-[#EAE4D6] border border-[#DED7C8] rounded-[11px] text-xs font-bold text-[#1C1A17] shadow-[inset_1px_1px_3px_#DBD3C3] truncate">
                                                    <i className={files.doc_tech_spec ? "fas fa-file-pdf text-[#2D5A27] mr-1.5" : "fas fa-paperclip mr-1.5 text-[#7A7469]"}></i>
                                                    {files.doc_tech_spec ? files.doc_tech_spec.name : "Attach Tech Spec (PDF) *"}
                                                </div>
                                                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileChange(e, 'doc_tech_spec')} />
                                            </label>
                                        </div>

                                        {/* Operating Manual */}
                                        <div className="bg-[#F4F0E8] border border-[#DED7C8] rounded-[13px] p-3.5 shadow-[2px_2px_6px_#DBD3C3]">
                                            <div className="text-xs font-bold text-[#1C1A17] mb-2">Operating Manual</div>
                                            <label className="block cursor-pointer">
                                                <div className="p-2.5 bg-[#EAE4D6] border border-[#DED7C8] rounded-[11px] text-xs font-bold text-[#1C1A17] shadow-[inset_1px_1px_3px_#DBD3C3] truncate">
                                                    <i className={files.doc_operating_manual ? "fas fa-file-pdf text-[#2D5A27] mr-1.5" : "fas fa-paperclip mr-1.5 text-[#7A7469]"}></i>
                                                    {files.doc_operating_manual ? files.doc_operating_manual.name : "Attach Manual (PDF)"}
                                                </div>
                                                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileChange(e, 'doc_operating_manual')} />
                                            </label>
                                        </div>

                                        {/* Drawing */}
                                        <div className="bg-[#F4F0E8] border border-[#DED7C8] rounded-[13px] p-3.5 shadow-[2px_2px_6px_#DBD3C3]">
                                            <div className="text-xs font-bold text-[#1C1A17] mb-2">Dimensional Drawing</div>
                                            <label className="block cursor-pointer">
                                                <div className="p-2.5 bg-[#EAE4D6] border border-[#DED7C8] rounded-[11px] text-xs font-bold text-[#1C1A17] shadow-[inset_1px_1px_3px_#DBD3C3] truncate">
                                                    <i className={files.doc_drawing ? "fas fa-file-pdf text-[#2D5A27] mr-1.5" : "fas fa-paperclip mr-1.5 text-[#7A7469]"}></i>
                                                    {files.doc_drawing ? files.doc_drawing.name : "Attach Schematic (PDF)"}
                                                </div>
                                                <input type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" onChange={(e) => handleFileChange(e, 'doc_drawing')} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Laboratory & Environmental Details */}
                            <h3 className="mt-7 mb-4 pb-3 border-b border-[#DED7C8] text-[#1C1A17] font-['Outfit'] text-sm font-bold uppercase tracking-wider">
                                3. Laboratory & Environmental Test Conditions
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="form-group">
                                    <label>Testing Laboratory Name</label>
                                    <input type="text" name="lab_name" placeholder="e.g. National Metrology Lab" className="form-input" value={formData.lab_name} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Laboratory Location / State</label>
                                    <input type="text" name="lab_location" placeholder="e.g. New Delhi, Delhi" className="form-input" value={formData.lab_location} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Testing Ambient Conditions</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input type="number" name="temperature" placeholder="Temp (°C)" className="form-input" value={formData.temperature} onChange={handleChange} required />
                                        <input type="number" name="humidity" placeholder="Hum (%)" className="form-input" value={formData.humidity} onChange={handleChange} required />
                                        <input type="number" name="voltage" placeholder="Supply (V)" className="form-input" value={formData.voltage} onChange={handleChange} required />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 text-right">
                                <button type="submit" className="btn px-7 py-3 text-xs tracking-wider uppercase font-bold">
                                    Generate OIML Test Plan &rarr;
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

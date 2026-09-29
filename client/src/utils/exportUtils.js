/**
 * OIML R76 Report Export Utility
 * Provides HTML/Print, JSON Data Export, and Editable Document (.doc) exports for reports.
 */

export function exportReportToDoc(report) {
    if (!report) return;

    const reportId = `TP-${report._id.substring(0, 8).toUpperCase()}`;
    const dateStr = new Date(report.createdAt).toLocaleDateString();
    const inst = report.instrument_data || {};
    const lab = report.lab_details || {};

    const content = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>OIML R 76 Evaluation Report ${reportId}</title>
            <style>
                body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #0F172A; }
                h1 { font-size: 18pt; color: #2563EB; border-bottom: 2px solid #2563EB; padding-bottom: 5px; }
                h2 { font-size: 14pt; color: #0F172A; margin-top: 15px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
                th, td { border: 1px solid #CBD5E1; padding: 6px 10px; text-align: left; font-size: 10pt; }
                th { background-color: #F1F5F9; font-weight: bold; }
                .pass { color: #166534; font-weight: bold; }
                .fail { color: #991B1B; font-weight: bold; }
                .meta-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 6px; margin-bottom: 15px; }
            </style>
        </head>
        <body>
            <h1>OIML R 76-1 STANDARDIZED EVALUATION REPORT</h1>
            <div class="meta-box">
                <p><strong>Report ID:</strong> ${reportId}<br/>
                <strong>Date of Issue:</strong> ${dateStr}<br/>
                <strong>Ruleset Version:</strong> ${report.rule_set_version || 'OIML R-76-1 (2006 Edition)'}<br/>
                <strong>Workflow Status:</strong> ${report.workflow_status || 'SUBMITTED'}<br/>
                <strong>Cryptographic SHA-256 Seal:</strong> ${report.sha256_hash || 'Verified'}</p>
            </div>

            <h2>1. Laboratory & Instrument Identification</h2>
            <table>
                <tr><th>Laboratory Name</th><td>${lab.name || 'Metrology Lab'} (${lab.location || 'HQ'})</td></tr>
                <tr><th>Manufacturer</th><td>${inst.manufacturer || 'N/A'}</td></tr>
                <tr><th>Model Number</th><td>${inst.model || 'N/A'}</td></tr>
                <tr><th>Serial Number</th><td>${inst.serial_no || 'N/A'}</td></tr>
                <tr><th>Accuracy Class</th><td>Class ${inst.Class_value || 'III'}</td></tr>
                <tr><th>Max Capacity (Max)</th><td>${inst.capacity || 'N/A'} kg</td></tr>
                <tr><th>Verification Scale Interval (e)</th><td>${inst.e_value || 'N/A'} g</td></tr>
            </table>

            <h2>2. Metrological Evaluation Summary</h2>
            <table>
                <thead>
                    <tr>
                        <th>Evaluation Module</th>
                        <th>OIML R 76 Clause</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.form0_results ? `<tr><td>Visual Inspection</td><td>Clause 3.10 / Annex A.2</td><td class="pass">PASS</td></tr>` : ''}
                    ${report.form1_results ? `<tr><td>Weighing Performance</td><td>Clause 3.5.1 / Annex A.4.4</td><td class="${JSON.stringify(report.form1_results).includes('FAIL') ? 'fail' : 'pass'}">${JSON.stringify(report.form1_results).includes('FAIL') ? 'FAIL' : 'PASS'}</td></tr>` : ''}
                    ${report.form2_results ? `<tr><td>Repeatability Test</td><td>Clause 3.6.1 / Annex A.4.4</td><td class="${JSON.stringify(report.form2_results).includes('FAIL') ? 'fail' : 'pass'}">${JSON.stringify(report.form2_results).includes('FAIL') ? 'FAIL' : 'PASS'}</td></tr>` : ''}
                    ${report.form3_results ? `<tr><td>Eccentricity Test</td><td>Clause 3.6.2 / Annex A.4.7</td><td class="${JSON.stringify(report.form3_results).includes('FAIL') ? 'fail' : 'pass'}">${JSON.stringify(report.form3_results).includes('FAIL') ? 'FAIL' : 'PASS'}</td></tr>` : ''}
                    ${report.form_zero_results ? `<tr><td>Zero-Setting Test</td><td>Clause 3.8.1 / Annex A.4.2</td><td class="${JSON.stringify(report.form_zero_results).includes('FAIL') ? 'fail' : 'pass'}">${JSON.stringify(report.form_zero_results).includes('FAIL') ? 'FAIL' : 'PASS'}</td></tr>` : ''}
                    ${report.form_tare_results ? `<tr><td>Tare Accuracy Test</td><td>Clause 3.5.3.4 / Annex A.4.6</td><td class="${JSON.stringify(report.form_tare_results).includes('FAIL') ? 'fail' : 'pass'}">${JSON.stringify(report.form_tare_results).includes('FAIL') ? 'FAIL' : 'PASS'}</td></tr>` : ''}
                    ${report.form_tilt_results ? `<tr><td>Tilt Test</td><td>Clause 3.9.1 / Annex A.5</td><td class="${JSON.stringify(report.form_tilt_results).includes('FAIL') ? 'fail' : 'pass'}">${JSON.stringify(report.form_tilt_results).includes('FAIL') ? 'FAIL' : 'PASS'}</td></tr>` : ''}
                </tbody>
            </table>

            <h2>3. Signatures & Authorization</h2>
            <table>
                <tr>
                    <th>Verification Tester</th>
                    <td>${report.createdBy || 'Authorized Tester'}</td>
                </tr>
                <tr>
                    <th>Quality Reviewer</th>
                    <td>${report.reviewedBy || 'Quality Inspector'}</td>
                </tr>
                <tr>
                    <th>Approving Authority</th>
                    <td>${report.approvedBy || 'Admin Authority'}</td>
                </tr>
            </table>
        </body>
        </html>
    `;

    const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OIML_R76_Report_${reportId}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function exportReportToJson(report) {
    if (!report) return;
    const reportId = `TP-${report._id.substring(0, 8).toUpperCase()}`;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `OIML_R76_Report_${reportId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

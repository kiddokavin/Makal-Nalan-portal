const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

/**
 * Regenerates the entire Excel database file from the current list of complaints.
 * This keeps the Excel sheet in sync with any status changes (e.g. Pending -> Resolved).
 * @param {Array} complaints - Array of all complaints from JSON database
 * @param {string} filePath - Target file path for the Excel sheet
 */
function updateExcelDatabase(complaints, filePath) {
    // Ensure the parent directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Map the complaints array to standard columns
    const data = complaints.map(c => ({
        "Grievance ID": c.id,
        "Date": c.date,
        "Name (பெயர்)": c.name,
        "Contact No (கைபேசி எண்)": c.contact,
        "Email (மின்னஞ்சல்)": c.email || "N/A",
        "Address (முகவரி)": c.address,
        "District (மாவட்டம்)": c.district,
        "Department (துறை)": c.department,
        "Subject (பொருள்)": c.subject,
        "Complaint Text (புகார் விவரம்)": c.complaintText,
        "Status (நிலை)": c.status || "Pending"
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Adjust column widths for professional appearance in Excel
    const colWidths = [
        { wch: 18 }, // Grievance ID
        { wch: 15 }, // Date
        { wch: 22 }, // Name
        { wch: 16 }, // Contact No
        { wch: 25 }, // Email
        { wch: 45 }, // Address
        { wch: 16 }, // District
        { wch: 40 }, // Department
        { wch: 35 }, // Subject
        { wch: 60 }, // Complaint Text
        { wch: 15 }  // Status
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Complaints");
    
    // Write and replace the file
    XLSX.writeFile(wb, filePath);
}

module.exports = { updateExcelDatabase };

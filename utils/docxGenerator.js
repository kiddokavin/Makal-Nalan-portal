const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType } = require('docx');

/**
 * Generates a clean, print-ready Word document for the complaint.
 * @param {Object} complaint 
 * @param {string} outputFilePath 
 * @returns {Promise<string>} File path of the written file
 */
function generateWordDocument(complaint, outputFilePath) {
    // Ensure the output directory exists
    const dir = path.dirname(outputFilePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // TVK header
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "TAMILAGA VETTRI KAZHAGAM (TVK)",
                            bold: true,
                            size: 32, // 16pt
                            color: "7A0016", // Maroon
                            font: "Calibri",
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({
                            text: "IT WING PUBLIC GRIEVANCE CELL (26_tvk_it_wing_)",
                            bold: true,
                            size: 20, // 10pt
                            color: "D4AF37", // Gold
                            font: "Calibri",
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                    children: [
                        new TextRun({
                            text: "--------------------------------------------------------------------------------",
                            bold: true,
                            color: "7A0016",
                        })
                    ]
                }),
                // Complaint details title
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    spacing: { after: 200 },
                    children: [
                        new TextRun({
                            text: "OFFICIAL COMPLAINT RECORD",
                            bold: true,
                            color: "333333",
                            size: 24, // 12pt
                            underline: {},
                            font: "Calibri",
                        })
                    ]
                }),
                // Table of complainant details and metadata
                new Table({
                    width: {
                        size: 100,
                        type: WidthType.PERCENTAGE,
                    },
                    rows: [
                        createTableRow("Grievance ID (புகார் எண்)", complaint.id, true),
                        createTableRow("Date of Submission (தேதி)", complaint.date),
                        createTableRow("Complainant Name (பெயர்)", complaint.name),
                        createTableRow("Contact Number (கைபேசி)", complaint.contact),
                        createTableRow("Email Address (மின்னஞ்சல்)", complaint.email || "N/A"),
                        createTableRow("Address (முகவரி)", complaint.address),
                        createTableRow("District (மாவட்டம்)", complaint.district),
                        createTableRow("Target Department (துறை)", complaint.department, true),
                        createTableRow("Grievance Subject (பொருள்)", complaint.subject, true),
                    ],
                }),
                new Paragraph({
                    spacing: { before: 400, after: 150 },
                    children: [
                        new TextRun({
                            text: "COMPLAINT DESCRIPTION (புகார் விவரம்):",
                            bold: true,
                            size: 24,
                            color: "7A0016",
                            font: "Calibri",
                        })
                    ]
                }),
                // Complaint description block
                new Paragraph({
                    spacing: { before: 100, after: 400, line: 360 }, // 1.5 line spacing
                    children: [
                        new TextRun({
                            text: complaint.complaintText,
                            size: 24, // 12pt
                            font: "Calibri",
                        })
                    ]
                }),
                // Footer signature block
                new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    spacing: { before: 600 },
                    children: [
                        new TextRun({
                            text: "Generated by TVK IT Wing Grievance Portal\n",
                            italic: true,
                            size: 18,
                            color: "666666",
                            font: "Calibri",
                        }),
                        new TextRun({
                            text: "Verified by: @26_tvk_it_wing_",
                            bold: true,
                            size: 18,
                            color: "7A0016",
                            font: "Calibri",
                        })
                    ]
                })
            ]
        }]
    });

    // Write file to output location
    return Packer.toBuffer(doc).then(buffer => {
        fs.writeFileSync(outputFilePath, buffer);
        return outputFilePath;
    });
}

/**
 * Helper to build a table row for docx Table
 */
function createTableRow(label, value, isBold = false) {
    return new TableRow({
        children: [
            new TableCell({
                width: {
                    size: 35,
                    type: WidthType.PERCENTAGE,
                },
                children: [
                    new Paragraph({
                        spacing: { before: 80, after: 80 },
                        children: [
                            new TextRun({
                                text: label,
                                bold: true,
                                size: 20,
                                font: "Calibri",
                            })
                        ]
                    })
                ],
            }),
            new TableCell({
                width: {
                    size: 65,
                    type: WidthType.PERCENTAGE,
                },
                children: [
                    new Paragraph({
                        spacing: { before: 80, after: 80 },
                        children: [
                            new TextRun({
                                text: value || "N/A",
                                bold: isBold,
                                size: 20,
                                font: "Calibri",
                            })
                        ]
                    })
                ],
            })
        ]
    });
}

module.exports = { generateWordDocument };

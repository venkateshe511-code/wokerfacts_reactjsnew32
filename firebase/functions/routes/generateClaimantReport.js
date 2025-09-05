const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  BorderStyle,
  ImageRun,
  WidthType,
  HeadingLevel,
} = require("docx");

const router = express.Router();

// Helpers
const borderlessCell = (text, bold = false) =>
  new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold })],
      }),
    ],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
  });

const headerText = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, color: "4472C4" })],
    spacing: { before: 200, after: 150 },
  });

const subHeaderText = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true })],
    spacing: { before: 150, after: 100 },
  });

const labelValueRow = (label, value) =>
  new Paragraph({
    children: [
      new TextRun({ text: `${label}: `, bold: true }),
      new TextRun({ text: value ?? "" }),
    ],
    spacing: { after: 60 },
  });

const calcAverage = (measurements = {}) => {
  const vals = [
    measurements.trial1,
    measurements.trial2,
    measurements.trial3,
    measurements.trial4,
    measurements.trial5,
    measurements.trial6,
  ].filter((v) => typeof v === "number" && !isNaN(v) && v > 0);
  if (!vals.length) return 0;
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  return Math.round(avg * 100) / 100;
};

const getImageBuffer = async (src) => {
  if (!src || typeof src !== "string") return null;
  try {
    let buffer = null;
    if (/^data:image\//i.test(src)) {
      const base64 = (src.split(",")[1] || "").replace(/\s/g, "");
      if (base64) buffer = Buffer.from(base64, "base64");
    } else if (/^https?:\/\//i.test(src)) {
      const resp = await fetch(src);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const arr = await resp.arrayBuffer();
      buffer = Buffer.from(arr);
    } else {
      const abs = path.isAbsolute(src) ? src : path.resolve(src);
      if (fs.existsSync(abs)) buffer = fs.readFileSync(abs);
    }

    if (buffer) {
      try {
        const tmpPath = path.join(os.tmpdir(), `docx_img_${Date.now()}.bin`);
        fs.writeFileSync(tmpPath, buffer);
      } catch {}
    }

    return buffer;
  } catch (e) {
    return null;
  }
};

router.post("/", async (req, res) => {
  try {
    if (req.query.dryRun === "1") {
      return res.status(200).json({ ok: true, body: req.body || {} });
    }

    const body = req.body || {};

    const {
      claimantName = "",
      claimNumber = "",
      evaluationDate = "",
      logoPath = null,
      clinicName = "",
      clinicAddress = "",
      clinicPhone = "",
      clinicFax = "",
      claimantData = {},
      painIllustrationData = {},
      activityRatingData = {},
      referralQuestionsData = {},
      protocolTestsData = {},
      occupationalTasksData = {},
      testData = {},
      mtmTestData = {},
      digitalLibraryData = {},
      reportSummary = {},
    } = body;

    const nameDisplay =
      claimantName || `${claimantData?.lastName || ""}, ${claimantData?.firstName || ""}`.trim() || "Unknown";

    const children = [];

    // COVER PAGE
    const logoBuffer = await getImageBuffer(logoPath || body?.evaluatorData?.clinicLogo);

    children.push(
      new Paragraph({ children: [], spacing: { after: 1200 } })
    );

    if (logoBuffer) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({ data: logoBuffer, transformation: { width: 150, height: 70 } }),
          ],
          spacing: { after: 200 },
        })
      );
    } else if (clinicName) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: clinicName, bold: true, color: "4472C4", size: 32 })],
          spacing: { after: 200 },
        })
      );
    }

    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        indent: { left: 2880 },
        children: [
          new TextRun({ text: "Functional Abilities Determination", bold: true, color: "4472C4", size: 28 }),
        ],
        spacing: { after: 200 },
      })
    );

    const coverInfoTable = new Table({
      width: { size: 60, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER,
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideH: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideV: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
      rows: [
        new TableRow({ children: [borderlessCell("Claimant Name:", true), borderlessCell(nameDisplay)] }),
        new TableRow({ children: [borderlessCell("Claimant #:", true), borderlessCell(claimNumber || "N/A")] }),
        new TableRow({ children: [borderlessCell("Date of Evaluation(s):", true), borderlessCell(evaluationDate || "")] }),
      ],
    });

    children.push(coverInfoTable);

    if (clinicName || clinicAddress || clinicPhone || clinicFax) {
      children.push(
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1200, after: 120 }, children: [
          new TextRun({ text: "CONFIDENTIAL INFORMATION ENCLOSED", bold: true, size: 18 }),
        ]})
      );
      if (clinicName) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: clinicName, bold: true, size: 16 })] }));
      if (clinicAddress) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: clinicAddress, size: 16 })] }));
      const phoneFax = `Phone: ${clinicPhone || ""}${clinicPhone && clinicFax ? "    " : ""}${clinicFax ? `Fax: ${clinicFax}` : ""}`.trim();
      if (phoneFax) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: phoneFax, size: 16 })] }));
    }

    // TABLE OF CONTENTS (simple static list)
    children.push(new Paragraph({ pageBreakBefore: true }));
    children.push(headerText("Contents of Report:"));
    [
      "Client Information",
      "Pain & Symptom Illustration",
      "Referral Questions",
      "Conclusions",
      "Functional Abilities Determination and Job Match Results",
      "Test Data (Activity Overview, Extremity Strength, Occupational Tasks, Range of Motion, Whole Body Strength)",
      "Appendix One: Reference Charts",
      "Appendix Two: Digital Library",
    ].forEach((item) => children.push(new Paragraph({ children: [new TextRun({ text: `• ${item}` })], spacing: { after: 80 } })));

    // CLIENT INFORMATION
    children.push(new Paragraph({ pageBreakBefore: true }));
    children.push(headerText("Client Information"));

    // Optional claimant photo
    if (claimantData.profilePhoto) {
      const claimantImg = await getImageBuffer(claimantData.profilePhoto);
      if (claimantImg) {
        children.push(
          new Paragraph({
            children: [
              new ImageRun({ data: claimantImg, transformation: { width: 120, height: 150 } }),
            ],
            spacing: { after: 200 },
          })
        );
      }
    }

    const infoRowsLeft = [
      ["Name", `${claimantData.firstName || ""} ${claimantData.lastName || ""}`.trim()],
      ["Address", claimantData.address || "N/A"],
      ["Home Phone", claimantData.phone || claimantData.phoneNumber || "N/A"],
      ["Work Phone", claimantData.workPhone || "N/A"],
      ["Occupation", claimantData.occupation || claimantData.currentOccupation || "N/A"],
      ["Employer(SIC)", claimantData.employer || "N/A"],
      ["Insurance", claimantData.insurance || "N/A"],
      ["Physician", claimantData.referredBy || "N/A"],
    ];

    const infoRowsRight = [
      ["ID", claimNumber || claimantData.claimantId || reportSummary.reportId || "N/A"],
      ["DOB (Age)", `${claimantData.dateOfBirth || "N/A"}`],
      ["Gender", claimantData.gender || "N/A"],
      ["Height", claimantData.heightValue ? `${claimantData.heightValue} ${claimantData.heightUnit || ""}` : claimantData.height || "N/A"],
      ["Weight", claimantData.weightValue ? `${claimantData.weightValue} ${claimantData.weightUnit || ""}` : claimantData.weight || "N/A"],
      ["Dominant Hand", claimantData.dominantHand || claimantData.handDominance || "N/A"],
      ["Referred By", claimantData.referredBy || "N/A"],
      ["Tested By", (body?.evaluatorData?.name) || reportSummary.evaluatorName || "Evaluator"],
    ];

    const infoTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        ...infoRowsLeft.map((row, i) => (
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row[0] + ":", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row[1] })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: infoRowsRight[i]?.[0] + ":", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: infoRowsRight[i]?.[1] || "" })] })] }),
            ],
          })
        )),
      ],
    });
    children.push(infoTable);

    // Mechanism and History of Injury
    children.push(subHeaderText("Mechanism and History of Injury"));
    const hist = claimantData.claimantHistory || claimantData.injuryDescription || "";
    children.push(new Paragraph({ children: [new TextRun({ text: hist })] }));

    // PAIN / SYMPTOM ILLUSTRATION
    children.push(new Paragraph({ pageBreakBefore: true }));
    children.push(headerText("Pain/Symptom Illustration"));

    if (painIllustrationData?.description) {
      children.push(new Paragraph({ children: [new TextRun({ text: painIllustrationData.description })], spacing: { after: 120 } }));
    }
    if (painIllustrationData?.savedImage) {
      const painImg = await getImageBuffer(painIllustrationData.savedImage);
      if (painImg) {
        children.push(new Paragraph({ children: [new ImageRun({ data: painImg, transformation: { width: 300, height: 220 } })], spacing: { after: 160 } }));
      }
    }

    // ACTIVITY OVERVIEW
    children.push(headerText("Activity Overview"));
    const activities = activityRatingData?.activities || [];
    if (activities.length) {
      const activityHeader = new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Activity", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Rating", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Demonstrated", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Perceived", bold: true })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Comments", bold: true })] })] }),
        ],
      });
      const activityRows = activities.map((a) => new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(a.name || "")] }),
          new TableCell({ children: [new Paragraph(String(a.rating ?? ""))] }),
          new TableCell({ children: [new Paragraph(a.demonstrated ? "Yes" : "No")] }),
          new TableCell({ children: [new Paragraph(a.perceived ? "Yes" : "No")] }),
          new TableCell({ children: [new Paragraph(a.comments || "")] }),
        ],
      }));
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [activityHeader, ...activityRows] }));
    } else {
      children.push(new Paragraph({ children: [new TextRun({ text: "No activity ratings provided." })] }));
    }

    // REFERRAL QUESTIONS
    children.push(new Paragraph({ pageBreakBefore: true }));
    children.push(headerText("Referral Questions"));
    const questions = referralQuestionsData?.questions || [];
    if (questions.length) {
      let idx = 0;
      for (const q of questions) {
        idx += 1;
        children.push(subHeaderText(`Q${idx}. ${q.question || ""}`));
        children.push(new Paragraph({ children: [new TextRun({ text: q.answer || "" })], spacing: { after: 80 } }));
        if (Array.isArray(q.savedImageData)) {
          for (const img of q.savedImageData) {
            const buf = await getImageBuffer(img.dataUrl || img.data);
            if (buf) children.push(new Paragraph({ children: [new ImageRun({ data: buf, transformation: { width: 300, height: 200 } })], spacing: { after: 60 } }));
          }
        }
      }
    } else {
      children.push(new Paragraph({ children: [new TextRun({ text: "No referral questions provided." })] }));
    }

    // PROTOCOL & SELECTED TESTS
    children.push(headerText("Protocol & Selected Tests"));
    const protoName = protocolTestsData?.selectedProtocol || "Standard FCE Protocol";
    children.push(labelValueRow("Protocol", protoName));
    const selectedTests = protocolTestsData?.selectedTests || [];
    if (selectedTests.length) {
      selectedTests.forEach((t) => children.push(new Paragraph({ children: [new TextRun({ text: `• ${t}` })] })));
    }

    // OCCUPATIONAL TASKS (MTM)
    const mtm = mtmTestData && typeof mtmTestData === "object" ? mtmTestData : {};
    if (Object.keys(mtm).length) {
      children.push(new Paragraph({ pageBreakBefore: true }));
      children.push(headerText("Occupational Tasks - MTM Analysis"));
      for (const [testKey, data] of Object.entries(mtm)) {
        const trials = Array.isArray(data.trials) ? data.trials : [];
        children.push(subHeaderText(`${data.testName || testKey}`));
        const header = new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(new TextRun({ text: "Trial", bold: true }))] }),
            new TableCell({ children: [new Paragraph(new TextRun({ text: "Side", bold: true }))] }),
            new TableCell({ children: [new Paragraph(new TextRun({ text: "Weight/Plane", bold: true }))] }),
            new TableCell({ children: [new Paragraph(new TextRun({ text: "Distance/Posture", bold: true }))] }),
            new TableCell({ children: [new Paragraph(new TextRun({ text: "Reps", bold: true }))] }),
            new TableCell({ children: [new Paragraph(new TextRun({ text: "Time (sec)", bold: true }))] }),
            new TableCell({ children: [new Paragraph(new TextRun({ text: "%IS", bold: true }))] }),
            new TableCell({ children: [new Paragraph(new TextRun({ text: "CV%", bold: true }))] }),
            new TableCell({ children: [new Paragraph(new TextRun({ text: "Time Set Completed", bold: true }))] }),
          ],
        });
        const rows = trials.length
          ? trials.map((t, i) => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(String(t.trial || i + 1))] }),
                new TableCell({ children: [new Paragraph(t.side || "Both")] }),
                new TableCell({ children: [new Paragraph(String(t.weight || t.plane || "Immediate"))] }),
                new TableCell({ children: [new Paragraph(String(t.distance || t.position || "Standing"))] }),
                new TableCell({ children: [new Paragraph(String(t.reps ?? 1))] }),
                new TableCell({ children: [new Paragraph(String((t.testTime || 0).toFixed ? t.testTime.toFixed(1) : t.testTime || 0))] }),
                new TableCell({ children: [new Paragraph(String((t.percentIS || 0).toFixed ? t.percentIS.toFixed(1) : t.percentIS || 0))] }),
                new TableCell({ children: [new Paragraph(String(t.cv || 0))] }),
                new TableCell({ children: [new Paragraph(String((t.totalCompleted || t.testTime || 0).toFixed ? (t.totalCompleted || t.testTime || 0).toFixed(1) : (t.totalCompleted || t.testTime || 0))) ] }),
              ],
            }))
          : [new TableRow({ children: [new TableCell({ columnSpan: 9, children: [new Paragraph("No trial data")], }),] })];
        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [header, ...rows] }));

        if (Array.isArray(data.savedImageData) && data.savedImageData.length) {
          for (const img of data.savedImageData) {
            const b = await getImageBuffer(img.dataUrl || img.data);
            if (b) children.push(new Paragraph({ children: [new ImageRun({ data: b, transformation: { width: 250, height: 160 } })], spacing: { after: 60 } }));
          }
        }
      }
    }

    // FUNCTIONAL TESTS DATA
    children.push(new Paragraph({ pageBreakBefore: true }));
    children.push(headerText("Functional Tests"));
    const tests = Array.isArray(testData?.tests) ? testData.tests : [];
    if (tests.length) {
      for (const t of tests) {
        children.push(subHeaderText(t.testName || "Test"));
        if (t.result) children.push(labelValueRow("Result", t.result));
        if (t.effort) children.push(labelValueRow("Effort", t.effort));
        if (t.consistency) children.push(labelValueRow("Consistency", t.consistency));

        if (t.measurements && Object.keys(t.measurements).length) {
          const measHeader = new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(new TextRun({ text: "Trial", bold: true }))] }),
              new TableCell({ children: [new Paragraph(new TextRun({ text: "Value", bold: true }))] }),
            ],
          });
          const measRows = Object.entries(t.measurements)
            .filter(([k]) => /^trial\d+$/i.test(k))
            .map(([k, v]) => new TableRow({ children: [
              new TableCell({ children: [new Paragraph(k)] }),
              new TableCell({ children: [new Paragraph(String(v))] }),
            ] }));
          const avg = calcAverage(t.measurements);
          children.push(new Table({ width: { size: 60, type: WidthType.PERCENTAGE }, rows: [measHeader, ...measRows] }));
          children.push(labelValueRow("Average", String(avg)));
          if (t.unit) children.push(labelValueRow("Unit", t.unit));
        }

        if (t.limitations) children.push(labelValueRow("Limitations", t.limitations));
        if (t.jobRequirements) children.push(labelValueRow("Job Requirements", t.jobRequirements));
        if (t.comments) children.push(new Paragraph({ children: [new TextRun({ text: `Comments: ${t.comments}` })], spacing: { after: 120 } }));
      }
    } else {
      children.push(new Paragraph({ children: [new TextRun({ text: "No test data provided." })] }));
    }

    // DIGITAL LIBRARY (Appendix Two)
    children.push(new Paragraph({ pageBreakBefore: true }));
    children.push(headerText("Appendix Two: Digital Library"));
    const files = digitalLibraryData?.savedFileData || [];
    if (files.length) {
      files.forEach((f, i) => {
        const line = `${i + 1}. ${f.name || "File"}   (${f.type || ""}${f.size ? `, ${Math.round(f.size / 1024)} KB` : ""})`;
        children.push(new Paragraph({ children: [new TextRun({ text: line })] }));
      });
    } else {
      children.push(new Paragraph({ children: [new TextRun({ text: "No files in digital library." })] }));
    }

    // APPENDIX ONE: REFERENCE CHARTS (placeholder descriptive text)
    children.push(new Paragraph({ pageBreakBefore: true }));
    children.push(headerText("Appendix One: Reference Charts"));
    children.push(new Paragraph({ children: [new TextRun({ text: "Reference charts and norms used during evaluation are available upon request and were consulted to interpret the client performance across tests." })] }));

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1480, right: 720, bottom: 720, left: 720 },
            },
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return res
      .status(200)
      .set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
      .set(
        "Content-Disposition",
        `attachment; filename=FCE_Report_${nameDisplay.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`
      )
      .send(buffer);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error generating DOCX", details: err?.message || String(err) });
  }
});

module.exports = router;

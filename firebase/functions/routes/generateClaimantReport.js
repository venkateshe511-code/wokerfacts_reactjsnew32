const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
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
  PageBreak,
  HeightRule,
  TableLayoutType,
  VerticalAlign,
  ShadingType,
  Alignment,
  PageNumber,
  Footer
} = require("docx");

const router = express.Router();
const BRAND_COLOR = "337FE5";
const NARROW_FONT = "Arial Narrow";
const DEFAULT_FONT = "Arial";
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// Helper functions for table cells
function createTableCellForPain(text, bold = false, background = "") {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text, bold, size: 16 }),
        ],
        spacing: { before: 0, after: 0 },
      }),
    ],
    shading: background ? { type: "clear", fill: background } : undefined,
    margins: { top: 0, bottom: 0, left: 40, right: 40 },
  });
}

let globalSampleImageBuffer = null;


async function fetchImageBuffer(url) {
  try {
    if (!url) return null;
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
  } catch (e) {
    console.error("Image fetch error:", e.message, url);
    return null;
  }
}

async function getSampleImageBuffer() {
  if (!globalSampleImageBuffer) {
    globalSampleImageBuffer = await fetchImageBuffer("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWK1bi8ireVtN4jstd8ciOgk1AhSSeuB5lkw&s");
  }
  return globalSampleImageBuffer;
}

function createColoredSymbolCell(text) {
  // Split text into symbol and label
  const [symbol, ...rest] = text.trim().split(" ");
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: symbol + " ", bold: true, size: 16 }),
          new TextRun({ text: rest.join(" "), size: 16 }), // normal rest
        ],
        spacing: { before: 0, after: 0 },
      }),
    ],
  });
}

// ===== Shared helpers =====
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
    children: [
      new TextRun({
        text,
        bold: true,
        color: BRAND_COLOR,
        font: NARROW_FONT,
        size: 28,
      }),
    ],
    spacing: { before: 200, after: 150 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND_COLOR },
    },
  });

const subHeaderText = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [
      new TextRun({ text: text, bold: true, font: NARROW_FONT, size: 24 }),
    ],
    spacing: { before: 150, after: 100 },
  });

const labelValueRow = (label, value) =>
  new Paragraph({
    children: [
      new TextRun({
        text: `${label}: `,
        bold: true,
        font: DEFAULT_FONT,
        size: 24,
      }),
      new TextRun({ text: value ?? "", font: DEFAULT_FONT, size: 24 }),
    ],
    spacing: { after: 60 },
    alignment: AlignmentType.JUSTIFIED,
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

const calculateCV = (measurements = {}) => {
  const vals = [
    measurements.trial1,
    measurements.trial2,
    measurements.trial3,
    measurements.trial4,
    measurements.trial5,
    measurements.trial6,
  ].filter((v) => typeof v === "number" && !isNaN(v) && v > 0);

  if (vals.length < 2) return 0;

  const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / vals.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / avg) * 100;
  return Math.round(cv * 10) / 10; // Round to 1 decimal place
};

const calculateBilateralDeficiency = (leftAvg, rightAvg) => {
  if (!leftAvg || !rightAvg) return 0;
  const max = Math.max(leftAvg, rightAvg);
  const min = Math.min(leftAvg, rightAvg);
  const deficiency = ((max - min) / max) * 100;
  return Math.round(deficiency * 10) / 10; // Round to 1 decimal place
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
      } catch { }
    }

    return buffer;
  } catch (e) {
    return null;
  }
};

const noBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "FFFFFF" },
};



// helper functions
function createHeaderCell(text) {
  return new TableCell({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text, bold: true, color: "#000000", size: 20 }),
        ],
      }),
    ],
    shading: { fill: "FFFF99", type: ShadingType.CLEAR }, // light yellow header fill
  });
}

function createDataRow(values) {
  return new TableRow({
    children: values.map(
      (val) =>
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: val, size: 20 })],
            }),
          ],
        })
    ),
  });
}

//
// === Helper Tables ===
//
function generateLumbarMotionTable() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          createHeaderCell("Area Evaluated"),
          createHeaderCell("Data"),
          createHeaderCell("Valid?"),
          createHeaderCell("Norm"),
          createHeaderCell("% of Norm"),
        ],
      }),
      createDataRow(["Lumbar Flexion", "49°", "Pass", "60°", "82%"]),
      createDataRow(["Lumbar Extension", "28°", "Pass", "25°", "112%"]),
      createDataRow(["Lateral Flexion - Left", "27°", "Pass", "25°", "108%"]),
      createDataRow(["Lateral Flexion - Right", "25°", "Pass", "25°", "116%"]),
    ],
  });
}



// format date first
const currentDate = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

// Helper: calculate average of L/R readings
const calculateAverage = (measurements) => {
  if (!measurements || typeof measurements !== "object") return 0;
  const values = Object.values(measurements).filter(
    (v) => typeof v === "number" && !isNaN(v)
  );
  return values.length
    ? values.reduce((a, b) => a + b, 0) / values.length
    : 0;
};


// ===== Section builders =====
async function addCoverPage(children, body) {
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
  } = body || {};

  const nameDisplay =
    claimantName ||
    `${claimantData?.lastName || ""}, ${claimantData?.firstName || ""}`.trim() ||
    "Unknown";

  // Debug: log incoming logo sources (only short preview)
  try {
    const preview = (s) =>
      typeof s === "string" ? `${s.slice(0, 48)}... (len=${s.length})` : String(s);
    if (body?.logoPath)
      console.log("[DOCX] logoPath:", preview(body.logoPath));
    if (body?.evaluatorData?.clinicLogo)
      console.log(
        "[DOCX] evaluatorData.clinicLogo:",
        preview(body.evaluatorData.clinicLogo),
      );
    if (body?.logoUrl)
      console.log("[DOCX] logoUrl:", preview(body.logoUrl));
  } catch { }

  let logoBuffer = null;
  const logoSources = [
    body?.logoPath,
    body?.evaluatorData?.clinicLogo,
    body?.logoUrl,
  ].filter(Boolean);
  for (const src of logoSources) {
    // eslint-disable-next-line no-await-in-loop
    logoBuffer = await getImageBuffer(src);
    if (logoBuffer) {
      try {
        console.log("[DOCX] Loaded logo buffer from src prefix:", src.slice(0, 24));
      } catch { }
    }
    if (logoBuffer) break;
  }
  if (!logoBuffer) {
    logoBuffer = await getImageBuffer(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/256px-React-icon.svg.png",
    );
    try {
      console.log("[DOCX] Using fallback logo image (React icon)");
    } catch { }
  }

  // Large top spacer to vertically center cover content area
  children.push(new Paragraph({ children: [], spacing: { after: 4000 } }));

  // Centered logo
  if (logoBuffer) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: logoBuffer,
            transformation: { width: 80, height: 80 },
          }),
        ],
        spacing: { after: 200 },
      }),
    );
  } else if (clinicName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: clinicName, bold: true, color: BRAND_COLOR }),
        ],
        spacing: { after: 200 },
      }),
    );
  }

  // Centered title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Functional Abilities Determination",
          bold: true,
          color: BRAND_COLOR,
          size: 24,
        }),
      ],
      spacing: { after: 200 },
    }),
  );

  // Left-indented label/value rows
  const displayClaimNumber = claimNumber || "N/A";
  const displayEvalDate = evaluationDate || new Date().toISOString().split("T")[0];

  // Revert to non-table rows, positioned directly under the title
  const coverRow = (label, val) =>
    new Paragraph({
      indent: { left: 4000 },
      spacing: { after: 80 },
      children: [
        new TextRun({ text: `${label}:`, bold: true, size: 16, }),
        new TextRun({ text: "  ", size: 16, }),
        new TextRun({ text: val || "", size: 16, }),
      ],
    });

  children.push(coverRow("Claimant Name", nameDisplay));
  children.push(coverRow("Claimant #", displayClaimNumber));
  children.push(coverRow("Date of Evaluation(s)", displayEvalDate));

  // Return footer content so caller can place at page bottom
  const phoneFax = `Phone: ${clinicPhone || ""}${clinicPhone && clinicFax ? "    " : ""
    }${clinicFax ? `Fax: ${clinicFax}` : ""}`.trim();

  const footerChildren = [];
  footerChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "CONFIDENTIAL INFORMATION ENCLOSED",
          bold: true,
          color: "808080",
          size: 20
        }),
      ],
    }),
  );
  if (clinicName)
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: clinicName, bold: true, size: 20 })],
      }),
    );
  if (clinicAddress)
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: clinicAddress, size: 20 })],
      }),
    );
  if (phoneFax)
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: phoneFax, size: 20 })],
      }),
    );

  children.__coverFooter = new (require("docx").Footer)({
    children: footerChildren,
  });
}

async function addContentsOfReport(children) {

  const contentChildren = [
    new Paragraph({
      children: [
        new TextRun({
          text: "Contents of Report:",
          bold: true,
          color: BRAND_COLOR,
          size: 18, // Bigger for heading
        }),
      ],
      spacing: { after: 260, before: 260 },
      indent: { left: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Client Information", size: 18 })],
      spacing: { after: 260 },
      indent: { left: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Pain & Symptom Illustration", size: 18 })],
      spacing: { after: 260 },
      indent: { left: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Referral Questions", size: 18 })],
      spacing: { after: 260 },
      indent: { left: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Conclusions", size: 18 })],
      spacing: { after: 260 },
      indent: { left: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Functional Abilities Determination and Job Match Results", size: 18 })],
      spacing: { after: 300 },
      indent: { left: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Test Data:", size: 18 })],
      spacing: { before: 120, after: 260 },
      indent: { left: 300 },
    }),
    // --- BULLETS ---
    new Paragraph({
      children: [
        new TextRun({ text: "• ", size: 20, color: "000000" }), // small black bullet
        new TextRun({ text: "Activity Overview", size: 18 }),
      ],
      spacing: { after: 100 },
      indent: { left: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "• ", size: 20, color: "000000" }),
        new TextRun({ text: "Extremity Strength", size: 18 }),
      ],
      spacing: { after: 100 },
      indent: { left: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "• ", size: 20, color: "000000" }),
        new TextRun({ text: "Occupational Tasks", size: 18 }),
      ],
      spacing: { after: 100 },
      indent: { left: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "• ", size: 20, color: "000000" }),
        new TextRun({ text: "Range of Motion (Spine)", size: 18 }),
      ],
      spacing: { after: 300 },
      indent: { left: 400 },
    }),
    // --- END BULLETS ---
    new Paragraph({
      children: [new TextRun({ text: "Appendix One: Reference Charts", size: 18 })],
      spacing: { before: 160, after: 260 },
      indent: { left: 300 },
    }),
    new Paragraph({
      children: [new TextRun({ text: "Appendix Two: Digital Library", size: 18 })],
      spacing: { after: 260 },
      indent: { left: 300 },
    }),
    new Paragraph({ children: [], spacing: { after: 600 } }), // Spacer
  ];

  const lineTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    indent: { size: 3000, type: WidthType.DXA }, // 720 = 0.5 inch
    rows: [
      new TableRow({
        height: { value: 8000, rule: HeightRule.EXACT },
        children: [
          new TableCell({
            borders: {
              left: { style: BorderStyle.SINGLE, size: 2, color: "CCCCCC" },
              top: { style: BorderStyle.SINGLE, color: "FFFFFF", size: 0 },
              right: { style: BorderStyle.SINGLE, color: "FFFFFF", size: 0 },
              bottom: { style: BorderStyle.SINGLE, color: "FFFFFF", size: 0 },
            },
            children: contentChildren,
          }),
        ],
      }),
    ],
  });

  children.push(new Paragraph({ text: "", spacing: { after: 1080 } }));
  children.push(lineTable);
}

async function addClientInformation(children, body) {

  children.push(new Paragraph({ children: [new PageBreak()] }));

  const headerLines = [
    "Functional Abilities Determination",
    "MedSource",
    "1490-5A Quarterpath Road #242, Williamsburg, VA 23185",
    "Phone: 757-220-5051 Fax: 757-273-6198",
  ];

  const cd = body?.claimantData || {};
  const fullName = `${cd.firstName || ""} ${cd.lastName || ""}`.trim();
  const dob = cd.dateOfBirth || "";
  const age = dob ? (() => {
    try { const d = new Date(dob); const diff = Date.now() - d.getTime(); return Math.max(0, Math.floor(diff / (365.25 * 24 * 3600 * 1000))); } catch { return ""; }
  })() : "";
  const heightDisp = `${cd.height || ""} ${cd.heightUnit || ""}`.trim();
  const weightDisp = `${cd.weight || ""} ${cd.weightUnit || ""}`.trim();
  const idDisp = cd.claimantId || body?.claimNumber || "";
  const phone = cd.phone || "";
  const workPhone = cd.workPhone || "n/a";
  const gender = cd.gender || "";
  const dominant = cd.dominantHand || "";
  const occupation = cd.currentOccupation || cd.occupation || "";
  const employer = cd.employer || "";
  const referredBy = cd.referredBy || cd.physician || "";
  const restingPulse = cd.restingPulse || "";
  const bpSitting = cd.bpSitting || "";
  const testedBy = body?.evaluatorData.name || "";


const clientInfoRowsData = [
  ["Name:", fullName || "N/A", "ID:", idDisp || "N/A"],
  ["Address:", cd.address || "N/A", "DOB (Age):", `${dob || "N/A"}${age !== "" ? ` (${age})` : ""}`],
  ["Gender:", gender || "N/A", "Height:", heightDisp || "N/A"], // ✅ moved height beside gender
  ["Home Phone:", phone || "N/A", "Weight:", weightDisp || "N/A"],
  ["Work Phone:", workPhone || "N/A", "Dominant Hand:", dominant || "N/A"],
  ["Occupation:", occupation || "N/A", "Referred By:", referredBy || "N/A"],
  ["Employer(SIC):", employer || "N/A", "Resting Pulse:", restingPulse || ""],
  ["Insurance:", cd.insurance || "N/A", "BP Sitting:", bpSitting || ""],
  ["Physician:", referredBy || "N/A", "Tested By:", testedBy || ""],
];

  // Use the same logo logic as addCoverPage
  let logoBuffer = null;
  const logoSources = [
    body?.logoPath,
    body?.evaluatorData?.clinicLogo,
    body?.logoUrl,
    body?.logo,
  ].filter(Boolean);

  for (const src of logoSources) {
    // eslint-disable-next-line no-await-in-loop
    logoBuffer = await getImageBuffer(src);
    if (logoBuffer) {
      try {
        console.log("[DOCX] Loaded logo buffer from src prefix:", src.slice(0, 24));
      } catch { }
    }
    if (logoBuffer) break;
  }

  if (!logoBuffer) {
    logoBuffer = await getImageBuffer(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/256px-React-icon.svg.png",
    );
    try {
      console.log("[DOCX] Using fallback logo image (React icon)");
    } catch { }
  }

  if (logoBuffer) {
    children.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: logoBuffer,
            transformation: { width: 80, height: 80 },
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
      })
    );
  }

  headerLines.forEach((line, idx) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            bold: true,
            color: line.startsWith("Functional") ? BRAND_COLOR : "000000",
            size: idx === 0 ? 24 : (idx === 1 ? 20 : 18),
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: idx === headerLines.length - 1 ? 10 : 5 },
      })
    );
  });
  children.push(new Paragraph({ text: "", spacing: { after: 300 } }));


  const bodyImageUrl = "https://images.pexels.com/photos/5155762/pexels-photo-5155762.jpeg?auto=compress&cs=tinysrgb&w=600";

  // Prefer dynamically provided pain illustration image; fall back to sample
  let bodyDiagramBackBuffer = null;
  if (body?.painIllustrationData?.compositedViews) {
    bodyDiagramBackBuffer = await getImageBuffer(body.painIllustrationData.compositedViews);
  }
  console.log(`body?.painIllustrationData?.compositedViews ==${body?.painIllustrationData?.compositedViews}`);
  if (!bodyDiagramBackBuffer) {
    bodyDiagramBackBuffer = await fetchImageBuffer(bodyImageUrl);
  }

  children.push(new Paragraph({ text: "", spacing: { after: 100 } }));

  // Collect up to THREE relevant images from pain step only (support {dataUrl,name} or plain strings)
  const extraImages = [];
  if (Array.isArray(body?.painIllustrationData?.savedImageData) && body.painIllustrationData.savedImageData.length) {
    for (const item of body.painIllustrationData.savedImageData.slice(0, 3)) {
      const dataUrl = typeof item === "string" ? item : (item?.dataUrl || item?.src || "");
      const label = typeof item === "object" ? (item?.name || item?.title || "") : "";
      if (!dataUrl) continue;
      // eslint-disable-next-line no-await-in-loop
      const buf = await getImageBuffer(dataUrl);
      if (buf) extraImages.push({ buf, label });
    }
  }

  // Optional 4-view composited grid (front/back/left/right) similar to PDF
  const compositedViewsInput = body?.painIllustrationData?.compositedViews;
  const painViews = Array.isArray(compositedViewsInput)
    ? compositedViewsInput
    : (Array.isArray(compositedViewsInput?.imageUrls) ? compositedViewsInput.imageUrls : []);
  const painViewBuffers = [];
  for (const url of painViews) {
    const buf = await getImageBuffer(url);
    if (buf) painViewBuffers.push(buf);
  }

  // Legend Table with red symbols (this table should retain its borders)
  const legendTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        indent: { left: 0 },
        children: [createTableCellForPain("Area of Primary Concern", true, "FFFF99")],
      }),
      new TableRow({ indent: { left: 0 }, children: [createColoredSymbolCell("P1    Primary")] }),
      new TableRow({ indent: { left: 0 }, children: [createColoredSymbolCell("P2    Secondary")] }),
      new TableRow({ indent: { left: 0 }, children: [createTableCellForPain("Pain Indicator", true, "FFFF99")] }),
      new TableRow({ indent: { left: 0 }, children: [createColoredSymbolCell("~    Primary")] }),
      new TableRow({ indent: { left: 0 }, children: [createColoredSymbolCell("/    Shooting")] }),
      new TableRow({ indent: { left: 0 }, children: [createColoredSymbolCell("x    Burning")] }),
      new TableRow({ indent: { left: 0 }, children: [createColoredSymbolCell("•    Pins and Needles")] }),
      new TableRow({ indent: { left: 0 }, children: [createColoredSymbolCell("o    Numbness")] }),
      new TableRow({ indent: { left: 0 }, children: [createTableCellForPain("General", true, "FFFF99")] }),
      new TableRow({ indent: { left: 0 }, children: [createColoredSymbolCell("T    Temperature")] }),
      new TableRow({ indent: { left: 0 }, children: [createColoredSymbolCell("SW   Swelling")] }),
      new TableRow({ indent: { left: 0 }, children: [createColoredSymbolCell("S    Scar")] }),
      new TableRow({ indent: { left: 0 }, children: [createColoredSymbolCell("C    Crepitus")] }),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
    },
  });


  const clientInfoTable = new Table({
    borders: noBorders,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: clientInfoRowsData.map((row) => new TableRow({
      children: [
        // Column 1 (Label)
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: row[0],
                  bold: true,
                  size: 20,
                }),
              ],
              spacing: { after: 0 },
            }),
          ],
          borders: noBorders,
        }),
        // Column 2 (Value)
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: row[1],
                  size: 20,
                }),
              ],
              spacing: { after: 0 },
            }),
          ],
          borders: noBorders,
        }),
        // Column 3 (Label)
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: row[2],
                  bold: true,
                  size: 20,
                }),
              ],
              spacing: { after: 0 },
            }),
          ],
          borders: noBorders,
        }),
        // Column 4 (Value)
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: row[3],
                  size: 20,
                }),
              ],
              spacing: { after: 0 },
            }),
          ],
          borders: noBorders,
        }),
      ],
    })),
    layout: TableLayoutType.AUTOFIT,
    borders: {
      ...noBorders,
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    spacing: { after: 0 },
  });

  // Prefer a real claimant photo if provided
  const claimantPhotoSrc = cd.profilePhoto || body?.profilePhoto || body?.photoUrl;
  const sampleImageBuffer = claimantPhotoSrc ? await getImageBuffer(claimantPhotoSrc) : await getSampleImageBuffer();
  const claimantName =
    body.claimantName ||
    `${body?.claimantData?.lastName || ""}, ${body?.claimantData?.firstName || ""}`.trim() ||
    "Unknown";
  // Main layout table for Report Date, Photo, Client Information, and Mechanism
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,   // <-- FIXED width layout (important!)
      columnWidths: [2500, 6500],
      borders: noBorders,
      rows: [
        new TableRow({
          children: [
            // LEFT COLUMN
            new TableCell({
              borders: noBorders,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Report Date: ${currentDate}`,
                      bold: true,
                      size: 16,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 20 },
                }),
                sampleImageBuffer
                  ? new Paragraph({
                    children: [
                      new ImageRun({
                        data: sampleImageBuffer,
                        transformation: { width: 120, height: 120 },
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 10 },
                  })
                  : new Paragraph({
                    text: "[Photo Placeholder]",
                    alignment: AlignmentType.START,
                    spacing: { after: 10 },
                    border: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                    },
                  }),

                new Paragraph({
                  children: [
                    new TextRun({
                      text: claimantName,
                      size: 16,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 20 },
                }),

              ],
              verticalAlign: "top",
            }),

            // RIGHT COLUMN — Contains Client Information and Mechanism sections
            new TableCell({
              verticalAlign: "top",
              borders: {
                top: { style: BorderStyle.SINGLE, size: 0, color: "FFFFFF" },
                bottom: { style: BorderStyle.SINGLE, size: 0, color: "FFFFFF" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, // vertical dividing line
                right: { style: BorderStyle.SINGLE, size: 0, color: "FFFFFF" },
              },

              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Client Information", bold: true, color: BRAND_COLOR, size: 18 }),
                  ],
                  spacing: { after: 80 },
                }),
                clientInfoTable,

                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Mechanism and History of Injury",
                      bold: true,
                      color: BRAND_COLOR,
                      size: 18,
                    }),
                  ],
                  spacing: { before: 80, after: 80 },
                }),

                // Mechanism Table
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  layout: TableLayoutType.FIXED,
                  borders: noBorders,
                  columnWidths: [2000, 7000],
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true, size: 16 })] })],
                          borders: noBorders,
                        }),
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true, size: 16 })] })],
                          borders: noBorders,
                        }),
                      ],
                    }),
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [new Paragraph({ children: [new TextRun({ text: currentDate, size: 16 })] })],
                          borders: noBorders,
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [new TextRun({
                                text: cd.claimantHistory || "",
                                size: 16,
                              })],
                            }),
                          ],
                          borders: noBorders,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // Separate section for Pain/Symptom Illustration (without vertical divider)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Pain/Symptom Illustration",
          bold: true,
          color: BRAND_COLOR,
          size: 18,
        }),
      ],
      spacing: { before: 150, after: 150 },
    })
  );


  // Prepare up to 4 images for a 2x2 grid with robust fallbacks
  const defaultDiagramUrls = [
    "https://melodic-capybara-28bf3c.netlify.app/workerfacts-logo.png",
    "https://firebasestorage.googleapis.com/v0/b/workerfacts-60c02.firebasestorage.app/o/human_anatomy_bodies%2Ffront_view.png?alt=media&token=dcfd579a-affc-41b0-a242-2ce6a7765282",
    "https://firebasestorage.googleapis.com/v0/b/workerfacts-60c02.firebasestorage.app/o/human_anatomy_bodies%2Fleft_view.png?alt=media&token=be1c07f2-1bee-470a-b463-e2fa5d55eeb6",
    "https://firebasestorage.googleapis.com/v0/b/workerfacts-60c02.firebasestorage.app/o/human_anatomy_bodies%2Fright_view.png?alt=media&token=f513bcfb-f6d8-4466-a0bd-18368908d1aa",
  ];

  const providedViews = Array.isArray(body?.painIllustrationData?.compositedViews)
    ? body.painIllustrationData.compositedViews
    : [];

  const diagramSources = [...providedViews, ...defaultDiagramUrls].slice(0, 4);

  const diagramBuffers = await Promise.all(
    diagramSources.map(async (src) => (await fetchImageBuffer(src)) || (await getImageBuffer(src)))
  );


  let bodyDiagramBuffers = [];

  if (body?.painIllustrationData?.compositedViews) {
    let imageUrls = [];

    // Handle both string and array types
    if (Array.isArray(body.painIllustrationData.compositedViews)) {
      imageUrls = body.painIllustrationData.compositedViews;
    } else if (typeof body.painIllustrationData.compositedViews === "string") {
      imageUrls = body.painIllustrationData.compositedViews.split(",");
    }

    for (const url of imageUrls) {
      try {
        const buffer = await getImageBuffer(url.trim());
        if (buffer) bodyDiagramBuffers.push(buffer);
      } catch (err) {
        console.error("Error loading image:", url, err);
      }
    }
  }
  // Fallback: if no composited buffers resolved, use providedViews/defaults buffers
  if (!bodyDiagramBuffers.length) {
    bodyDiagramBuffers = (diagramBuffers || []).filter(Boolean);
  }


  const diagramCells = bodyDiagramBuffers.map((buf, idx) =>
    new TableCell({
      borders: noBorders,
      verticalAlign: VerticalAlign.CENTER, // ensures content inside cell centers vertically
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER, // horizontal centering
          spacing: { before: 0, after: 0 },
          children: buf
            ? [
              new ImageRun({
                data: buf,
                transformation: { width: 140, height: 200 },
              }),
            ]
            : [new TextRun(`Image ${idx + 1} not available`)],
        }),
      ],
    })
  );


  // Side-by-side diagram and legend
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      borders: noBorders,
      columnWidths: [7500, 2000],
      rows: [
        new TableRow({
          children: [
            // LEFT COLUMN with 4 images
            new TableCell({
              shading: { fill: "F9FAFA" },
              borders: noBorders,
              children: [
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  layout: TableLayoutType.FIXED,
                  borders: noBorders,
                  columnWidths: [1700, 1700, 1700, 1700],
                  rows: [
                    new TableRow({
                      tableHeader: false,
                      children: [
                        ...(diagramCells.length ? diagramCells.slice(0, 4) : []),
                      ],
                      height: { value: 1800, rule: HeightRule.ATLEAST }, // ensures vertical space for centering
                    }),
                  ],
                })


              ],
            }),

            // RIGHT COLUMN: legend
            new TableCell({
              children: [legendTable],
              borders: noBorders,
              margins: { top: 0, bottom: 0, left: 20, right: 0 },
            }),
          ],
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "",
        }),
      ],
      spacing: { before: 0, after: 200 },
    })
  );
  // After your existing 4-image layout table
  if (body?.painIllustrationData?.savedImageData && body?.painIllustrationData?.savedImageData?.length > 0) {

    // Create table for reference images
    const referenceImageCells = [];

    body?.painIllustrationData?.savedImageData?.forEach((ref) => {
      const imgCellChildren = [];

      const title = typeof ref === "object" ? (ref.title || ref.name || "") : "";
      if (title) {
        imgCellChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 50 },
            children: [
              new TextRun({
                text: title,
                color: BRAND_COLOR,
                bold: true,
                size: 18,
              }),
            ],
          })
        );
      }

      const dataUrl = typeof ref === "object" ? (ref.dataUrl || ref.src || ref.url || "") : String(ref || "");
      if (dataUrl) {
        imgCellChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: dataUrl,
                transformation: { width: 100, height: 100 },
              }),
            ],
            alignment: AlignmentType.CENTER,
          })
        );
      }

      referenceImageCells.push(
        new TableCell({
          children: imgCellChildren,
          borders: noBorders,
          verticalAlign: VerticalAlign.CENTER,
        })
      );
    });

    // Add table row with all reference images
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        layout: TableLayoutType.FIXED,
        borders: noBorders,
        columnWidths: Array(referenceImageCells.length).fill(
          9000 / referenceImageCells.length
        ),
        rows: [new TableRow({ children: referenceImageCells })],
      })
    );
  }

}

async function addReferenceChartsContent(children, body) {
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Header
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Appendix One: Reference Charts",
          bold: true,
          color: BRAND_COLOR,
          size: 18,
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 50 },
    })
  );

  // Perceived Exertion and Pain Scales Table
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Perceived Exertion and Pain Scales",
          bold: true,
          color: BRAND_COLOR,
          size: 18,
        }),
      ],
      spacing: { before: 200, after: 200 },
    })
  );

  const exertionTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    },
    rows: [
      // Header row
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Perceived Exertion", bold: true, size: 16 })] })],
            shading: { fill: "FFFF99" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            verticalAlign: AlignmentType.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Rating (RPE)", bold: true, size: 16 })] })],
            shading: { fill: "FFFF99" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            verticalAlign: AlignmentType.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Minimal Heart Rate", bold: true, size: 16 })] })],
            shading: { fill: "FFFF99" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            verticalAlign: AlignmentType.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mean Heart Rate", bold: true, size: 16 })] })],
            shading: { fill: "FFFF99" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            verticalAlign: AlignmentType.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Maximal Heart Rate", bold: true, size: 16 })] })],
            shading: { fill: "FFFF99" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            verticalAlign: AlignmentType.CENTER,
          }),
        ],
      }),
      // Data rows
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "no exertion at all", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "6", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "69", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "77", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "91", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "extremely light", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "7", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "76", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "85", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "101", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "8", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "83", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "93", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "111", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "very light", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "9", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "89", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "101", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "122", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "10", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "96", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "110", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "132", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "light", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "11", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "103", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "118", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "142", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "12", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "110", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "126", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "153", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "somewhat hard", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "13", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "116", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "135", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "163", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "14", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "123", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "143", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "173", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "hard (heavy)", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "15", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "130", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "151", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "184", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "16", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "137", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "159", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "194", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "very hard", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "17", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "143", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "168", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "204", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "18", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "150", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "176", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "215", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "extremely hard", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "19", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "157", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "184", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "225", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "maximal exertion", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "20", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "164", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "193", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "235", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
    ],
  });

  children.push(exertionTable);

  // Citation
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Borg G. Borg's Perceived Exertion and Pain Scales. Human Kinetics. 1998.",
          italics: true,
          size: 12,
        }),
      ],
      spacing: { before: 200, after: 400 },
    })
  );

  // Physical Demand Characteristics of Work Table
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Physical Demand Characteristics of Work",
          bold: true,
          color: BRAND_COLOR,
          size: 18,
        }),
      ],
      spacing: { before: 200, after: 200 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "(Dictionary of Occupational Titles - Volume II, Fourth Edition, Revised 1991)",
          italics: true,
          size: 14,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  const physicalDemandTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    },
    rows: [
      // Main header row
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Physical Demand Characteristics of Work", bold: true, size: 16 })] })],
            shading: { fill: "FFFF99" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            verticalAlign: AlignmentType.CENTER,
            colSpan: 4,
          }),
        ],
      }),
      // Subheader row
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Physical Demand Level", bold: true, size: 16 })] })],
            shading: { fill: "FFFF99" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            verticalAlign: AlignmentType.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "OCCASIONAL\n0-33% of the workday", bold: true, size: 16 })] })],
            shading: { fill: "FFFF99" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            verticalAlign: AlignmentType.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "FREQUENT\n34-66% of the workday", bold: true, size: 16 })] })],
            shading: { fill: "FFFF99" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            verticalAlign: AlignmentType.CENTER,
          }),
          new TableCell({
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CONSTANT\n67-100% of the workday", bold: true, size: 16 })] })],
            shading: { fill: "FFFF99" },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            verticalAlign: AlignmentType.CENTER,
          }),
        ],
      }),
      // Data rows
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sedentary", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1-10 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Negligible", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Negligible", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Light", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "11-20 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1-10 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Negligible", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Medium", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "21-50 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "11-25 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1-10 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Heavy", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "51-100 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "26-50 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "11-20 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Very Heavy", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Over 100 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Over 50 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Over 20 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
        ],
      }),
    ],
  });

  children.push(physicalDemandTable);

  // PDC Categories based on Sustainable Energy Level Table
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "PDC Categories based on Sustainable Energy Level",
          bold: true,
          color: BRAND_COLOR,
          size: 18,
        }),
      ],
      spacing: { before: 200, after: 200 },
    })
  );

  const pdcTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    },
    rows: [
      // Main header row
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "PDC Categories based on Sustainable Energy Level (Energy Cost) over an 8-hour workday",
                    bold: true,
                    size: 16,
                  }),
                ],
              }),
            ],
            shading: { fill: "FFFF99" },
            colSpan: 2,
          }),
        ],
      }),

      // Subheader row
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "PDC Category", bold: true, size: 16 })],
              }),
            ],
            shading: { fill: "FFFF99" },
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Sustainable Energy Level", bold: true, size: 16 })],
              }),
            ],
            shading: { fill: "FFFF99" },
          }),
        ],
      }),

      // Data rows
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Sedentary", size: 14 })], verticalAlign: VerticalAlign.CENTER, })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "< 1.7 Kcal/min", size: 14 })], verticalAlign: VerticalAlign.CENTER, })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Light", size: 14 })], verticalAlign: VerticalAlign.CENTER, })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "1.7 to 3.2 Kcal/min", size: 14 })], verticalAlign: VerticalAlign.CENTER, })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Medium", size: 14 })], verticalAlign: VerticalAlign.CENTER, })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "3.3 to 5.7 Kcal/min", size: 14 })], verticalAlign: VerticalAlign.CENTER, })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Heavy", size: 14 })], verticalAlign: VerticalAlign.CENTER, })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "5.8 to 8.2 Kcal/min", size: 14 })], verticalAlign: VerticalAlign.CENTER, })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "Very Heavy", size: 14 })], verticalAlign: VerticalAlign.CENTER, })],
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "8.3 or more Kcal/min", size: 14 })], verticalAlign: VerticalAlign.CENTER, })],
          }),
        ],
      }),
    ],
  });

  children.push(pdcTable);


  // General Patterns of Activity Descriptors
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "General Patterns of Activity Descriptors",
          bold: true,
          color: BRAND_COLOR,
          size: 18,
        }),
      ],
      spacing: { before: 400, after: 200 },
    })
  );

  // Activity descriptors
  const descriptors = [
    {
      title: "(S) Sedentary Work",
      description: "Exerting up to 10 lbs of force occasionally and/or a negligible amount of force frequently to lift, carry, push, pull, or otherwise move objects, including the human body. Sedentary work involves sitting most of the time but may involve walking or standing for brief periods of time. Jobs are sedentary if walking and standing are required occasionally and all other sedentary criteria are met."
    },
    {
      title: "(L) Light Work",
      description: "Exerting up to 20 lb of force occasionally, and/or up to 10 lb of force frequently, and/or a negligible amount of force constantly to move objects. Physical demand requirements are in excess of those for sedentary work. Even though the weight lifted may be only negligible, a job should be rated Light Work: (1) when it requires walking or standing to a significant degree; or (2) when it requires sitting most of the time but entails pushing and/or pulling of arm or leg controls; and/or (3) when the job requires working at a production rate pace entailing the constant pushing and/or pulling of materials even though the weight of those materials is negligible. The constant stress and strain of maintaining a production rate pace, especially in an industrial setting, can be and is physically exhausting"
    },
    {
      title: "(M) Medium Work",
      description: "Exerting 20 to 50 lbs of force occasionally, and/or 10 to 25 lbs of force frequently, and/or greater than negligible up to 10 lbs of force constantly to move objects.Physical demand requirements are in excess of those for light work."
    },
    {
      title: "(H) Heavy Work",
      description: "Exerting 50 to 100 lbs of force occasionally, and/or 25 to 50 lbs of force frequently, and/or 10 to 20 lbs of force constantly to move objects. Physical demand requirements are in excess of those for medium work."
    }
  ];

  descriptors.forEach(desc => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: desc.title,
            bold: true,
            size: 16,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: desc.description,
            size: 14,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  });

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "'*Occasionally' indicates that an activity or condition exists up to one third of the time; 'frequently' indicates that an activity or condition exists from one third to two thirds of the time; 'constantly' indicates that an activity or condition exists two thirds or more of the time.",
          size: 14,
        }),
      ],
      spacing: { after: 100 },
    })
  );

  // Dynamic Lift Test End Point Conditions Table
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Dynamic Lift Test End Point Conditions",
          bold: true,
          color: BRAND_COLOR,
          size: 18,
        }),
      ],
      spacing: { before: 400, after: 200 },
    })
  );

  const endPointTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    },
    rows: [
      // Main header row
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Test End Point Conditions",
                    bold: true,
                    size: 16,
                  }),
                ],
              }),
            ],
            shading: { fill: "FFFF99" },
            colSpan: 2,
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),

      // Subheader row
      new TableRow({
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "CONDITION", bold: true, size: 16 })],
              }),
            ],
            shading: { fill: "FFFF99" },
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "DESCRIPTION", bold: true, size: 16 })],
              }),
            ],
            shading: { fill: "FFFF99" },
          }),
        ],
      }),

      // Data rows
      new TableRow({
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Psychophysical", size: 14 })],
              }),
            ],
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Voluntary test termination by the claimant based on complaints of fatigue, excessive discomfort, or inability to complete the required number of movements during the testing interval (cycle).",
                    size: 14,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Physiological", size: 14 })],
              }),
            ],
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Achievement of an age-determined target heart rate (based on a percent of claimant's maximal heart rate - normally 85%, or in excess of 75% continuously for one minute).",
                    size: 14,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      new TableRow({
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Safety", size: 14 })],
              }),
            ],
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Achievement of a predetermined anthropometric safe lifting limit based on the claimant's adjusted body weight; or intervention by the FACTS evaluator based upon an evaluation of the claimant's signs & symptoms.",
                    size: 14,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  children.push(endPointTable);

}

async function addDigitalLibraryContent(children, body) {
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Header
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Appendix Two: Digital Library",
          bold: true,
          color: BRAND_COLOR,
          size: 18,
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 50 },
    })
  );

  const savedFiles = body?.digitalLibraryData?.savedFileData || [];
  if (savedFiles.length === 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "No images found.", italics: true })],
      })
    );
    return;
  }

  const imagesPerRow = 6;
  const numRows = Math.ceil(savedFiles.length / imagesPerRow);
  const imageTableRows = [];

  for (let i = 0; i < numRows; i++) {
    const rowChildren = [];

    for (let j = 0; j < imagesPerRow; j++) {
      const index = i * imagesPerRow + j;
      const file = savedFiles[index];

      if (file) {
        // 🔹 Determine image source
        let imageBuffer = null;

        if (file.dataUrl) {
          const base64 = file.dataUrl.split(",")[1];
          imageBuffer = Buffer.from(base64, "base64");
        } else if (file.url || file.path || file.src) {
          imageBuffer = await getImageBuffer(
            file.url || file.path || file.src
          );
        } else if (file.data) {
          imageBuffer = Buffer.from(file.data, "base64");
        }

        rowChildren.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  imageBuffer
                    ? new ImageRun({
                      data: imageBuffer,
                      transformation: { width: 120, height: 120 },
                    })
                    : new TextRun({ text: "[Image Missing]" }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
            borders: noBorders,
            margins: { top: 0, bottom: 0, left: 10, right: 10 },
          })
        );
      } else {
        rowChildren.push(
          new TableCell({
            children: [new Paragraph("")],
            borders: noBorders,
          })
        );
      }
    }

    imageTableRows.push(new TableRow({ children: rowChildren }));
    imageTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("")],
            borders: noBorders,
            columnSpan: imagesPerRow,
          }),
        ],
      })
    );
  }

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: imageTableRows,
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
      },
    })
  );

  children.push(new Paragraph({ children: [new PageBreak()] }));
}

async function addReferralQuestionsContent(children, body) {
  const referralData = body.referralQuestionsData || {};
  const questions = referralData.questions || [];

  // Page break before section
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // Section Header Box
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "FFFF99", type: ShadingType.CLEAR }, // light yellow
              margins: { top: 100, bottom: 100, left: 150, right: 150 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Referral Questions",
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );



  // Helper: remove question numbering like "6a)" or "6b)"
  const cleanQuestion = (q) => q.replace(/^\d+[a-zA-Z]?\)?\s*/, "").trim();

  // Helper: Physical Demand Classification block (from your snippet)
  const map = {
    Sedentary: {
      title: "(S) Sedentary Work",
      description:
        "Exerting up to 10 lbs of force occasionally and/or a negligible amount of force frequently to lift, carry, push, pull, or otherwise move objects, including the human body. Sedentary work involves sitting most of the time but may involve walking or standing for brief periods of time. Jobs are sedentary if walking and standing are required occasionally and all other sedentary criteria are met.",
    },
    Light: {
      title: "(L) Light Work",
      description:
        "Exerting up to 20 lb of force occasionally, and/or up to 10 lb of force frequently, and/or a negligible amount of force constantly to move objects. Physical demand requirements are in excess of those for sedentary work. Even though the weight lifted may be only negligible, a job should be rated 'Light Work': (1) when it requires walking or standing to a significant degree; or (2) when it requires sitting most of the time but entails pushing and/or pulling of arm or leg controls; and/or (3) when the job requires working at a production rate pace entailing the constant pushing and/or pulling of materials even though the weight of those materials is negligible. The constant stress and strain of maintaining a production rate pace, especially in an industrial setting, can be and is physically exhausting.",
    },
    Medium: {
      title: "(M) Medium Work",
      description:
        "Exerting 20 to 50 lbs of force occasionally, and/or 10 to 25 lbs of force frequently, and/or greater than negligible up to 10 lbs of force constantly to move objects. Physical demand requirements are in excess of those for light work.",
    },
    Heavy: {
      title: "(H) Heavy Work",
      description:
        "Exerting 50 to 100 lbs of force occasionally, and/or 25 to 50 lbs of force frequently, and/or 10 to 20 lbs of force constantly to move objects. Physical demand requirements are in excess of those for medium work.",
    },
    "Very Heavy": {
      title: "(VH) Very Heavy Work",
      description:
        "Exerting over 100 lbs of force occasionally, over 50 lbs of force frequently, or over 20 lbs of force constantly to move objects. Physical demand requirements are in excess of those for heavy work.",
    },
  };


  // Loop through all referral questions dynamically
  for (const [index, q] of questions.entries()) {
    let question = q.question || `Question ${index + 1}`;
    const answer = q.answer || "No answer provided.";
    const images = q.savedImageData || [];

    // Clean up numbering like 6a), 6b), etc.
    question = cleanQuestion(question);

    // Skip conclusion questions
    if (question.toLowerCase().includes("conclusion")) continue;

    // Question Title
    children.push(
      new Paragraph({
        children: [new TextRun({ text: question, color: BRAND_COLOR, bold: true, size: 18 })],
        spacing: { before: 300, after: 150 },
      })
    );

    // Handle “Physical Demand Classification” type answer (PDC:)
    if (
      question.toLowerCase().includes("physical demand classification") &&
      answer.startsWith("PDC:")
    ) {
      const level = String(answer).split("|")[0].replace("PDC:", "").trim();
      const comments = String(answer).split("|")[1] || "";
      const info = map[level];

      if (info) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: info.title,
                bold: true,
                color: BRAND_COLOR,
                size: 22,
              }),
            ],
            spacing: { before: 150, after: 50 },
          })
        );

        children.push(
          new Paragraph({
            children: [new TextRun({ text: info.description, size: 20 })],
            spacing: { after: 100 },
          })
        );


        const physicalDemandTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          },
          rows: [
            // Main header row
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Physical Demand Characteristics of Work", bold: true, size: 16 })] })],
                  shading: { fill: "FFFF99" },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  },
                  verticalAlign: AlignmentType.CENTER,
                  colSpan: 4,
                }),
              ],
            }),
            // Subheader row
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Physical Demand Level", bold: true, size: 16 })] })],
                  shading: { fill: "FFFF99" },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  },
                  verticalAlign: AlignmentType.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "OCCASIONAL\n0-33% of the workday", bold: true, size: 16 })] })],
                  shading: { fill: "FFFF99" },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  },
                  verticalAlign: AlignmentType.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "FREQUENT\n34-66% of the workday", bold: true, size: 16 })] })],
                  shading: { fill: "FFFF99" },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  },
                  verticalAlign: AlignmentType.CENTER,
                }),
                new TableCell({
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "CONSTANT\n67-100% of the workday", bold: true, size: 16 })] })],
                  shading: { fill: "FFFF99" },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  },
                  verticalAlign: AlignmentType.CENTER,
                }),
              ],
            }),
            // Data rows
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sedentary", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1-10 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Negligible", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Negligible", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Light", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "11-20 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1-10 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Negligible", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Medium", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "21-50 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "11-25 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1-10 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Heavy", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "51-100 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "26-50 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "11-20 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Very Heavy", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Over 100 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Over 50 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Over 20 lbs.", size: 14 })] })], verticalAlign: AlignmentType.CENTER }),
              ],
            }),
          ],
        });

        children.push(physicalDemandTable);
        if (comments) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Additional Comments: ${comments}`,
                  italics: true,
                  size: 20,
                }),
              ],
              spacing: { after: 100 },
            })
          );
        }
      }


      continue; // skip to next question
    }

    // Add other predefined tables (Lumbar, etc.)
    if (question.toLowerCase().includes("lumbar range of motion")) {
      children.push(generateLumbarMotionTable());
    } else {
      // Default answer
      children.push(
        new Paragraph({
          children: [new TextRun({ text: answer, size: 22 })],
          spacing: { before: 100, after: 150 },
        })
      );
    }

    // Add reference images (if any)
    if (Array.isArray(images) && images.length > 0) {
      const imageCells = [];

      for (const item of images) {
        try {
          let buffer = null;

          // --- Resolve image source ---
          if (typeof item === "string") {
            if (/^data:image\//i.test(item)) {
              const base64 = item.split(",")[1] || item.replace(/^data:image\/\w+;base64,/, "");
              buffer = base64 ? Buffer.from(base64, "base64") : null;
            } else {
              buffer = await getImageBuffer(item);
            }
          } else if (item && typeof item === "object") {
            if (item.dataUrl && /^data:image\//i.test(item.dataUrl)) {
              const base64 = String(item.dataUrl).split(",")[1] || String(item.dataUrl).replace(/^data:image\/\w+;base64,/, "");
              buffer = base64 ? Buffer.from(base64, "base64") : null;
            } else if (item.url || item.path || item.src) {
              buffer = await getImageBuffer(item.url || item.path || item.src);
            } else if (item.data) {
              buffer = Buffer.from(String(item.data), "base64");
            }
          }

          if (!buffer) {
            console.warn("[DOCX] Skipping image; could not resolve buffer");
            continue;
          }

          // --- Create one cell per image ---
          imageCells.push(
            new TableCell({
              borders: noBorders,
              width: { size: 2400, type: WidthType.DXA },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new ImageRun({
                      data: buffer,
                      transformation: { width: 100, height: 80 }, // 👈 smaller size
                    }),
                  ],
                }),
              ],
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
            })
          );

        } catch (e) {
          console.warn("[DOCX] Failed to insert image:", e);
        }
      }

      // --- Add table containing all images in one row ---
      if (imageCells.length > 0) {
        children.push(
          new Table({
            rows: [
              new TableRow({
                children: imageCells,
              }),
            ],
            width: { size: 10000, type: WidthType.DXA },
            alignment: AlignmentType.CENTER,
          })
        );
      }
    }

  }
}


async function addConclusionContent(children, body) {
  const referralData = body.referralQuestionsData || {};
  const questions = referralData.questions || [];


  children.push(
    new Paragraph({
      spacing: { after: 300 },
    })
  );

  // === Conclusions Header Box ===
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "FFFF99", type: ShadingType.CLEAR }, // light yellow
              margins: { top: 100, bottom: 100, left: 150, right: 150 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Conclusions",
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // Small space after header
  children.push(
    new Paragraph({
      children: [],
      spacing: { before: 100, after: 200 },
    })
  );

  // === Find Conclusion Question ===
  const conclusionQuestion = questions.find(
    (q) =>
      q?.question &&
      q.question.toLowerCase().includes("conclusion") &&
      (q.answer || (q.savedImageData && q.savedImageData.length > 0))
  );

  // Show nothing if no conclusion data
  if (!conclusionQuestion) return;

  // === Conclusion Answer ===
  if (conclusionQuestion.answer) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: conclusionQuestion.answer,
            size: 22,
            color: "000000",
          }),
        ],
        spacing: { before: 100, after: 200 },
      })
    );
  }

  // === Conclusion Images (if any) ===
  if (
    Array.isArray(conclusionQuestion.savedImageData) &&
    conclusionQuestion.savedImageData.length > 0
  ) {
    for (const imgData of conclusionQuestion.savedImageData) {
      try {
        const base64Data = imgData.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: buffer,
                transformation: { width: 400, height: 250 },
              }),
            ],
            spacing: { before: 100, after: 100 },
          })
        );
      } catch (e) {
        console.warn("Invalid image data for conclusion section.");
      }
    }
  }

  // === Signature of Evaluator Header ===
  children.push(
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [],
    })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: "FFFF99", type: ShadingType.CLEAR }, // same yellow box
              margins: { top: 100, bottom: 100, left: 150, right: 150 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Signature of Evaluator",
                      bold: true,
                      color: "000000",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  // === Signature Details (Date, Name, License) ===
  children.push(
    new Paragraph({
      text: "__________________________________________",
      spacing: { before: 300, after: 150 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Date: ${currentDate}`, size: 22 }),
      ],
      spacing: { after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: body.evaluatorData.name,
          bold: true,
          size: 22,
        }),
      ],
      spacing: { after: 50 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `License: ${body.evaluatorData.licenseNo}`,
          size: 20,
          color: "444444",
        }),
      ],
    })
  );
}
async function addFunctionalAbilitiesDeterminationContent(children, body) {
  children.push(new Paragraph({ children: [new PageBreak()] }));


  // Define job requirements by test name (mirror client PDF logic)
  const getJobRequirements = (testName) => {
    const testNameLower = (testName || "").toLowerCase();

    // Strength
    if (testNameLower.includes("grip")) {
      return {
        requirement: "Grip strength ≥20 kg (Light work) / ≥30 kg (Medium work)",
        lightWork: 20,
        mediumWork: 30,
        unit: "kg",
        type: "weight",
      };
    }
    if (testNameLower.includes("key") && testNameLower.includes("pinch")) {
      return { requirement: "Key pinch ≥4.3 kg (Light) / ≥7.0 kg (Medium work)", lightWork: 4.3, mediumWork: 7.0, unit: "kg", type: "weight" };
    }
    if (testNameLower.includes("tip") && testNameLower.includes("pinch")) {
      return { requirement: "Tip pinch ≥1.8 kg (Light) / ≥3.7 kg (Medium work)", lightWork: 1.8, mediumWork: 3.7, unit: "kg", type: "weight" };
    }
    if (testNameLower.includes("palmar") && testNameLower.includes("pinch")) {
      return { requirement: "Palmar pinch ≥2.1 kg (Light) / ≥4.3 kg (Medium work)", lightWork: 2.1, mediumWork: 4.3, unit: "kg", type: "weight" };
    }

    // ROM - Cervical
    if (testNameLower.includes("cervical")) {
      if (testNameLower.includes("flexion")) return { requirement: "Cervical flexion ≥45°", norm: 45, functionalMin: 45, unit: "degrees", type: "degrees" };
      if (testNameLower.includes("extension")) return { requirement: "Cervical extension ≥45°", norm: 45, functionalMin: 45, unit: "degrees", type: "degrees" };
      if (testNameLower.includes("lateral")) return { requirement: "Cervical lateral flexion ≥35°", norm: 35, functionalMin: 35, unit: "degrees", type: "degrees" };
    }

    // ROM - Lumbar
    if (testNameLower.includes("lumbar")) {
      if (testNameLower.includes("flexion")) return { requirement: "Lumbar flexion ≥80°", norm: 80, functionalMin: 60, unit: "degrees", type: "degrees" };
      if (testNameLower.includes("extension")) return { requirement: "Lumbar extension ≥20°", norm: 20, functionalMin: 15, unit: "degrees", type: "degrees" };
    }

    // ROM - Shoulder
    if (testNameLower.includes("shoulder")) {
      if (testNameLower.includes("flexion")) return { requirement: "Shoulder flexion ≥150°", norm: 150, functionalMin: 120, unit: "degrees", type: "degrees" };
      if (testNameLower.includes("abduction")) return { requirement: "Shoulder abduction ≥150°", norm: 150, functionalMin: 120, unit: "degrees", type: "degrees" };
      if (testNameLower.includes("extension")) return { requirement: "Shoulder extension ≥45°", norm: 45, functionalMin: 30, unit: "degrees", type: "degrees" };
    }

    // ROM - Hip
    if (testNameLower.includes("hip")) {
      if (testNameLower.includes("flexion")) return { requirement: "Hip flexion ≥90°", norm: 90, functionalMin: 80, unit: "degrees", type: "degrees" };
      if (testNameLower.includes("extension")) return { requirement: "Hip extension ≥20°", norm: 20, functionalMin: 15, unit: "degrees", type: "degrees" };
      if (testNameLower.includes("abduction")) return { requirement: "Hip abduction ≥35°", norm: 35, functionalMin: 25, unit: "degrees", type: "degrees" };
    }

    // Lifting
    if (testNameLower.includes("lift")) {
      return { requirement: "Lifting capacity ≥10 kg (Light) / ≥25 kg (Medium work)", lightWork: 10, mediumWork: 25, unit: "kg", type: "weight" };
    }

    // Cardio
    if (testNameLower.includes("step") || testNameLower.includes("cardio") || testNameLower.includes("treadmill")) {
      return { requirement: "Cardiovascular endurance within normal limits for work demands", norm: null, unit: "bpm", type: "cardio" };
    }

    return { requirement: "Functional capacity within normal work demands", type: "general" };
  };

  // Evaluate Job Match (mirror client PDF logic priorities)
  const evaluateJobMatch = (test) => {
    const jobReq = getJobRequirements(test.testName);
    const leftAvg = calculateAverage(test.leftMeasurements);
    const rightAvg = calculateAverage(test.rightMeasurements);

    // Priority 1: explicit selection
    if (test.jobMatch === "matched") return true;
    if (test.jobMatch === "not_matched") return false;

    // Priority 2: normLevel override
    if (test.normLevel === "yes") return true;
    if (test.normLevel === "no") return false;

    // Priority 3: compare to standards / user target
    if (jobReq.type === "weight") {
      const maxResult = Math.max(leftAvg, rightAvg);
      if (test.valueToBeTestedNumber) {
        const userTarget = parseFloat(test.valueToBeTestedNumber);
        return maxResult >= userTarget;
      }
      if (jobReq.mediumWork) return maxResult >= jobReq.lightWork; // at least Light
      if (jobReq.norm) return maxResult >= jobReq.norm;
    }

    if (jobReq.type === "degrees") {
      const name = (test.testName || "").toLowerCase();
      let testResult;
      if (name.includes("flexion") && name.includes("extension")) {
        testResult = leftAvg; // assume left=Flexion
      } else if (name.includes("flexion")) {
        testResult = Math.max(leftAvg, rightAvg);
      } else if (name.includes("extension")) {
        testResult = Math.max(leftAvg, rightAvg);
      } else if (name.includes("abduction")) {
        testResult = Math.max(leftAvg, rightAvg);
      } else {
        testResult = Math.max(leftAvg, rightAvg);
      }
      if (test.valueToBeTestedNumber) {
        const userTarget = parseFloat(test.valueToBeTestedNumber);
        return testResult >= userTarget;
      }
      if (jobReq.functionalMin) return testResult >= jobReq.functionalMin;
      if (jobReq.norm) return testResult >= jobReq.norm;
    }

    // Priority 4: demonstrated
    if (test.demonstrated === true) return true;

    return false;
  };

  // Build unified test list from multiple sources
  const normalizeNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const gatherTests = () => {
    const list = [];

    // Primary array from testData.tests if provided
    if (Array.isArray(body.testData?.tests) && body.testData.tests.length > 0) {
      // Use the comprehensive test data from client
      body.testData.tests.forEach(test => {
        list.push({
          testName: test.testName || "",
          category: test.category || test.testType || "",
          leftMeasurements: test.leftMeasurements || {},
          rightMeasurements: test.rightMeasurements || {},
          valueToBeTestedNumber: test.valueToBeTestedNumber || test.target || undefined,
          valueToBeTestedUnit: test.valueToBeTestedUnit || "",
          result: test.result || "",
          comments: test.comments || test.description || "",
          normLevel: test.normLevel,
          demonstrated: test.demonstrated,
          perceived: test.perceived,
          jobRequirements: test.jobRequirements || "",
          jobMatch: test.jobMatch,
          jobDemands: test.jobDemands,
          jobDescription: test.jobDescription || "",
          effort: test.effort || "",
          observations: test.observations || [],
          trials: Array.isArray(test.trials) ? test.trials : [],
          unitMeasure: test.unitMeasure || "",
        });
      });
      return list;
    }

    // Fallback: derive from mtmTestData (object or array)
    const mtm = body.mtmTestData || {};
    const mtmValues = Array.isArray(mtm) ? mtm : Object.values(mtm);
    for (const item of mtmValues) {
      if (!item) continue;
      const testName = item.testName || item.name || item.id || "Test";
      const leftMeasurements = item.leftMeasurements || item.measurementsLeft || item.measurements?.left || item.left || {};
      const rightMeasurements = item.rightMeasurements || item.measurementsRight || item.measurements?.right || item.right || {};
      const valueToBeTestedNumber = item.valueToBeTestedNumber || item.target || undefined;
      list.push({
        testName,
        category: item.mtmCategory || item.category || item.testType || "",
        leftMeasurements,
        rightMeasurements,
        valueToBeTestedNumber,
        valueToBeTestedUnit: item.valueToBeTestedUnit || "",
        result: item.result || "",
        comments: item.comments || item.description || "",
        normLevel: item.normLevel,
        demonstrated: item.demonstrated,
        perceived: item.perceived,
        jobRequirements: item.jobRequirements || "",
        jobMatch: item.jobMatch,
        jobDemands: item.jobDemands,
        jobDescription: item.jobDescription || "",
        effort: item.effort || "",
        observations: item.observations || [],
        trials: Array.isArray(item.trials) ? item.trials : [],
        unitMeasure: item.unitMeasure || "",
      });
    }
    return list;
  };

  const unifiedTests = gatherTests();

  // Group tests by category (mirror client)
  const categories = { "Cardio": [], "Strength": [], "ROM Total Spine/Extremity": [], "ROM Hand/Foot": [], "Occupational Tasks": [] };
  for (const test of unifiedTests) {
    const testName = (test.testName || "").toLowerCase();
    const originalCategory = (test.category || test.testType || "").toLowerCase().trim();

    // Prefer exact category names if provided by client
    if (test.category === "ROM Hand/Foot") {
      categories["ROM Hand/Foot"].push(test);
      continue;
    }
    if (test.category === "ROM Total Spine/Extremity") {
      categories["ROM Total Spine/Extremity"].push(test);
      continue;
    }
    if (test.category === "Cardio") {
      categories["Cardio"].push(test);
      continue;
    }
    if (test.category === "Occupational Tasks") {
      categories["Occupational Tasks"].push(test);
      continue;
    }

    // Cardio detection (category or name patterns)
    if (
      originalCategory.includes("cardio") ||
      originalCategory.includes("heart") ||
      originalCategory.includes("aerobic") ||
      testName.includes("step-test") ||
      testName.includes("treadmill") ||
      testName.includes("mcaft") ||
      testName.includes("kasch") ||
      testName.includes("cardio") ||
      testName.includes("cardiovascular") ||
      testName.includes("aerobic")
    ) {
      categories["Cardio"].push(test);
      continue;
    }

    // ROM Hand/Foot detection
    if (
      originalCategory.includes("rom") && (originalCategory.includes("hand") || originalCategory.includes("foot")) ||
      (
        (testName.includes("hand") || testName.includes("foot") || testName.includes("finger") || testName.includes("wrist") || testName.includes("ankle") || testName.includes("thumb")) &&
        (testName.includes("flexion") || testName.includes("extension") || testName.includes("abduction") || testName.includes("adduction"))
      )
    ) {
      categories["ROM Hand/Foot"].push(test);
      continue;
    }

    // ROM Total Spine/Extremity detection
    if (
      originalCategory.includes("rom") ||
      originalCategory.includes("range") ||
      originalCategory.includes("motion") ||
      testName.includes("flexion") ||
      testName.includes("extension") ||
      testName.includes("spine") ||
      testName.includes("cervical") ||
      testName.includes("back") ||
      testName.includes("shoulder")
    ) {
      categories["ROM Total Spine/Extremity"].push(test);
      continue;
    }

    // Occupational tasks
    if (
      originalCategory.includes("occupational") ||
      originalCategory.includes("task") ||
      testName.includes("fingering") ||
      testName.includes("handling") ||
      testName.includes("reach") ||
      testName.includes("climb") ||
      testName.includes("crawl") ||
      testName.includes("stoop") ||
      testName.includes("walk") ||
      testName.includes("push") ||
      testName.includes("pull") ||
      testName.includes("crouch") ||
      testName.includes("carry") ||
      testName.includes("kneel") ||
      testName.includes("ladder") ||
      testName.includes("balance")
    ) {
      categories["Occupational Tasks"].push(test);
      continue;
    }

    // Default to Strength
    categories["Strength"].push(test);
  }

  // Section Header
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Functional Abilities Determination and Job Match Results",
          bold: true,
          color: BRAND_COLOR,
          size: 18,
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 200 },
    })
  );


  // Table Header Row (yellow like other tables) with tighter column widths
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      "Activity Tested",
      "Sit Time",
      "Stand Time",
      "Test Results",
      "Job Description",
      "Job Requirements",
      "Job Match (Yes/No)",
    ].map(
      (text) =>
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text, bold: true })],
            }),
          ],
          shading: { fill: "FFFF99" },
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        })
    ),
  });

  // Initial Client Interview Row
  const rows = [
    headerRow,
    new TableRow({
      children: [
        "Client Interview Test",
        "45 min",
        "",
        "N/A",
        "Initial assessment and history gathering",
        "Basic interview requirements",
        "Yes",
      ].map(
        (text) =>
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: String(text), size: 20 })],
              }),
            ],
            margins: { top: 50, bottom: 50 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          })
      ),
    }),
    // Mirror client: Activity Overview static row
    new TableRow({
      children: [
        "Activity Overview",
        "",
        "5 min",
        "//",
        "General activity overview and preparation",
        "Basic standing and mobility",
        "Yes",
      ].map(
        (text) =>
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: String(text), size: 20 })],
              }),
            ],
            margins: { top: 50, bottom: 50 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          })
      ),
    }),
  ];

  // Add grouped categories
  for (const [category, tests] of Object.entries(categories)) {
    if (tests.length === 0) continue;

    // Category header row
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 7,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: category,
                    bold: true,
                    color: BRAND_COLOR,
                    size: 18,
                  }),
                ],
                alignment: AlignmentType.LEFT,
              })
            ],
            shading: { fill: "DBEAFE" },
            margins: { top: 50, bottom: 50, left: 80 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      })
    );

    // Each test row
    for (const test of tests) {
      const leftAvg = calculateAverage(test.leftMeasurements);
      const rightAvg = calculateAverage(test.rightMeasurements);
      const jobReq = getJobRequirements(test.testName);
      const jobMatch = evaluateJobMatch(test) ? "Yes" : "No";

      // Determine sit/stand based on test name (mirror client)
      const tn = (test.testName || "").toLowerCase();
      const isStandingTest = tn.includes("lumbar") || tn.includes("cervical") || tn.includes("thoracic") || tn.includes("shoulder") || tn.includes("elbow") || tn.includes("wrist") || tn.includes("reach") || tn.includes("crouch") || tn.includes("stoop") || tn.includes("bend") || tn.includes("balance") || tn.includes("climb") || tn.includes("walk") || tn.includes("push") || tn.includes("pull") || tn.includes("carry") || tn.includes("lift") || tn.includes("overhead");
      const sitTime = isStandingTest ? "" : "5 min";
      const standTime = isStandingTest ? "5 min" : "";

      // Job requirements display (mirror client PDF logic exactly)
      const jobRequirementsText = (() => {
        const jobReq = getJobRequirements(test.testName);

        // Show user's specific target only for weight-based tests
        if (test.valueToBeTestedNumber && jobReq.type === "weight") {
          return `Target: ${test.valueToBeTestedNumber} ${test.valueToBeTestedUnit || jobReq.unit}`;
        }

        // Show norm status if user indicated
        if (test.normLevel === "yes") {
          return "Within Normal Limits";
        } else if (test.normLevel === "no") {
          return "Below Normal Limits";
        }

        // Show industry standards based on test type
        if (jobReq.type === "weight") {
          if (jobReq.lightWork && jobReq.mediumWork) {
            return `≥${jobReq.lightWork} ${jobReq.unit} (Light) / ≥${jobReq.mediumWork} ${jobReq.unit} (Medium)`;
          } else if (jobReq.norm) {
            return `≥${jobReq.norm} ${jobReq.unit}`;
          }
        }

        if (jobReq.type === "degrees") {
          if (jobReq.functionalMin && jobReq.norm) {
            return `≥${jobReq.functionalMin}° (Min) / ≥${jobReq.norm}° (Normal)`;
          } else if (jobReq.norm) {
            return `≥${jobReq.norm}°`;
          }
        }

        return "Functional Assessment";
      })();

      // Test results format logic like ReviewReport (mirror client PDF exactly)
      const testResultsText = (() => {
        if (test.result && typeof test.result === "string") return test.result;

        // Cardio matches PDF: show HR pre//post if available, else Norm
        if (category === "Cardio") {
          const leftPreHR = test.leftMeasurements?.preHeartRate || 0;
          const leftPostHR = test.leftMeasurements?.postHeartRate || 0;
          const rightPreHR = test.rightMeasurements?.preHeartRate || 0;
          const rightPostHR = test.rightMeasurements?.postHeartRate || 0;

          const hrData = leftPreHR > 0 || leftPostHR > 0 || rightPreHR > 0 || rightPostHR > 0
            ? `${Math.max(leftPreHR, rightPreHR)}//${Math.max(leftPostHR, rightPostHR)}`
            : "Norm";
          return hrData;
        }

        if (category === "Occupational Tasks") {
          const avgResult = (leftAvg + rightAvg) / 2;
          return `%IS=${avgResult.toFixed(1)}`;
        }

        if (category === "ROM Hand/Foot" || category === "ROM Total Spine/Extremity") {
          const testNameLower = test.testName.toLowerCase();
          if (testNameLower.includes("flexion") && testNameLower.includes("extension")) {
            return `F=${leftAvg.toFixed(2)} E=${rightAvg.toFixed(2)}`;
          }
          if (testNameLower.includes("lateral")) {
            return `L=${leftAvg.toFixed(2)} R=${rightAvg.toFixed(2)}`;
          }
          return `F=${leftAvg.toFixed(2)} E=${rightAvg.toFixed(2)}`;
        }

        if ((test.testName || "").toLowerCase().includes("lift")) {
          const unit = (test.unitMeasure || test.valueToBeTestedUnit || jobReq.unit || "").toLowerCase();
          const baseAvg = leftAvg > 0 ? leftAvg : rightAvg;
          if (baseAvg > 0) {
            const avgWeight = unit === "kg"
              ? Math.round(baseAvg * 2.20462 * 10) / 10
              : Math.round(baseAvg * 10) / 10;
            return `${avgWeight.toFixed(1)} lbs`;
          }
        }

        return `L=${leftAvg.toFixed(1)} R=${rightAvg.toFixed(1)}`;
      })();

      const rowData = [
        test.testName || "",
        sitTime,
        standTime,
        testResultsText,
        test.jobRequirements || "Functional capacity assessment",
        jobRequirementsText,
        jobMatch,
      ];

      rows.push(new TableRow({
        children: rowData.map((text, idx) => new TableCell({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(text), size: 20 })] })],
          margins: { top: 40, bottom: 40 },
          width: idx === 0 ? { size: 22, type: WidthType.PERCENTAGE }
            : idx === 1 ? { size: 8, type: WidthType.PERCENTAGE }
              : idx === 2 ? { size: 8, type: WidthType.PERCENTAGE }
                : idx === 3 ? { size: 12, type: WidthType.PERCENTAGE }
                  : idx === 4 ? { size: 22, type: WidthType.PERCENTAGE }
                    : idx === 5 ? { size: 20, type: WidthType.PERCENTAGE }
                      : { size: 8, type: WidthType.PERCENTAGE }, // Yes/No compact
          borders: { top: { style: BorderStyle.SINGLE, size: 1 }, bottom: { style: BorderStyle.SINGLE, size: 1 }, left: { style: BorderStyle.SINGLE, size: 1 }, right: { style: BorderStyle.SINGLE, size: 1 } },
        })),
      }));
    }
  }

  // Build the DOCX Table
  let finalTotalSitTime = 45;
  let finalTotalStandTime = 5;
  for (const test of unifiedTests) {
    const name = (test.testName || "").toLowerCase();
    const isStandingTest = name.includes("lumbar") || name.includes("cervical") || name.includes("thoracic") || name.includes("shoulder") || name.includes("elbow") || name.includes("wrist") || name.includes("reach") || name.includes("crouch") || name.includes("stoop") || name.includes("bend") || name.includes("balance") || name.includes("climb") || name.includes("walk") || name.includes("push") || name.includes("pull") || name.includes("carry") || name.includes("lift") || name.includes("overhead");
    if (isStandingTest) {
      finalTotalStandTime += 5;
    } else {
      finalTotalSitTime += 5;
    }
  }

  const totalsData = [
    "Total Sit / Stand Time",
    `${finalTotalSitTime} min`,
    `${finalTotalStandTime} min`,
    "",
    "",
    "",
    "",
  ];

  rows.push(
    new TableRow({
      children: totalsData.map((text, idx) =>
        new TableCell({
          children: [
            new Paragraph({
              alignment: idx === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: String(text),
                  bold: idx <= 2 && String(text).length > 0,
                  size: 20,
                }),
              ],
            }),
          ],
          shading: { fill: "FFFF99" },
          margins: { top: 50, bottom: 50 },
          width: idx === 0
            ? { size: 22, type: WidthType.PERCENTAGE }
            : idx === 1
              ? { size: 8, type: WidthType.PERCENTAGE }
              : idx === 2
                ? { size: 8, type: WidthType.PERCENTAGE }
                : idx === 3
                  ? { size: 12, type: WidthType.PERCENTAGE }
                  : idx === 4
                    ? { size: 22, type: WidthType.PERCENTAGE }
                    : idx === 5
                      ? { size: 20, type: WidthType.PERCENTAGE }
                      : { size: 8, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
          },
        })
      ),
    })
  );

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows,
    alignment: AlignmentType.CENTER,
  });

  children.push(table);

  // Legend
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Legend: ",
          bold: true,
          size: 18,
        }),
        new TextRun({
          text: "L=Left, R=Right, F=Flexion, E=Extension, %IS=% Industrial Standard, HR=Heart Rate",
          size: 18,
        }),
      ],
      spacing: { before: 200 },
    })
  );

  // ----------------------------
  // 1️⃣ Consistency Overview Table
  // ----------------------------

  children.push(
    new Paragraph({
      spacing: { after: 200 },
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Consistency Overview",
          bold: true,
          color: BRAND_COLOR,
          size: 18,
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 50 },
    })
  );

  // Calculate actual effort counts from unified tests
  const effortCounts = {
    poor: 0,
    fair: 0,
    good: 0,
    demonstrated: 0,
    notDemonstrated: 0,
  };

  unifiedTests.forEach((test) => {
    // Count demonstrated vs not demonstrated
    if (test.demonstrated) {
      effortCounts.demonstrated++;
    } else {
      effortCounts.notDemonstrated++;
    }

    // Categorize effort based on the effort field
    const effort = test.effort ? test.effort.toLowerCase() : "";
    if (effort === "poor") {
      effortCounts.poor++;
    } else if (
      effort === "fair" ||
      effort === "average" ||
      effort === "fair to average"
    ) {
      effortCounts.fair++;
    } else if (effort === "good") {
      effortCounts.good++;
    } else {
      // Default to fair if no specific effort recorded
      effortCounts.fair++;
    }
  });

  const totalTests = unifiedTests.length;

  const consistencyOverviewTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      // === Header Row ===
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Observed Effort During Testing",
                    bold: true,
                  }),
                ],
              }),
            ],
            shading: { fill: "FFFF99" },
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Total Noted for all Tested Activities",
                    bold: true,
                  }),
                ],
              }),
            ],
            shading: { fill: "FFFF99" },
          }),
        ],
      }),

      // === Body Rows ===
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                text: "Poor effort",
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: `${effortCounts.poor} out of ${totalTests} Tests`,
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                text: "Fair to Average effort",
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: `${effortCounts.fair} out of ${totalTests} Tests`,
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                text: "Good effort",
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                text: `${effortCounts.good} out of ${totalTests} Tests`,
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        ],
      }),
    ],
  });


  children.push(consistencyOverviewTable);

  children.push(
    new Paragraph({
      spacing: { after: 200 },
    })
  );

  const consistentCrosschecksTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [3500, 5500, 800, 800],
    rows: [
      // === Header Row ===
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Consistent Crosschecks", bold: true })],
              }),
            ],
            shading: { fill: "FFFF99" },
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Description", bold: true })],
              }),
            ],
            shading: { fill: "FFFF99" },
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Pass", bold: true })],
              }),
            ],
            shading: { fill: "FFFF99" },
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Fail", bold: true })],
              }),
            ],
            shading: { fill: "FFFF99" },
          }),
        ],
      }),

      // === Body Rows ===
      ...[
        ["Hand grip rapid exchange", "Rapid Exchange Grip was 15% less to equal that of the Std position 2 Hand Grip measure.", "✓", ""],
        ["Hand grip MVE", "Position 1 through 5 displayed a bell curve showing greatest strength in position 2-3.", "✓", ""],
        ["Pinch grip key/tip/palmar ratio", "Key grip was greater than palmar which was greater than tip grip.", "", "✓"],
        ["Dynamic lift HR fluctuation", "Client displayed an increase in heart rate when weight and/or repetitions were increased (any dynamic lift: low, mid, high, or overhead).", "✓", ""],
        ["ROM consistency check", "During total spine ROM, the client provided three consecutive trials between 5 degrees and 10% of each other in a six-trial session.", "", "✓"],
        ["Test/retest trial consistency", "When tests were repeated the client displayed similar values and left/right deficiency.", "✓", ""],
        ["Dominant side monitoring", "It is expected that if the client is Right-Handed, he/she will demonstrate approx.10% greater values on the dominant side – if Left-Handed then the values would be close to the same.", "✓", ""],
        ["Distraction test consistency", "When performing distraction tests for sustained posture the client should demonstrate similar limitations and or abilities.", "", "✓"],
        ["Consistency with diagnosis", "Based on the diagnosis and complaints of the individual it is expected that those issues would relate to a similar function performance pattern during testing.", "✓", ""],
        ["Coefficient of Variation (CV)", "We would expect to see a CV less than 15% for a client that is deemed to be consistent.", "✓", ""],
      ].map(([title, desc, pass, fail]) =>
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: title })],
            }),
            new TableCell({
              children: [new Paragraph({ text: desc })],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: pass,
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: fail,
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          ],
        })
      ),
    ],
  });

  children.push(consistentCrosschecksTable);

}

async function addActivityRatingChart(children, body) {
  // === Add new page ===
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // === Header ===
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Client Perceived Activity Rating Chart",
          bold: true,
          color: BRAND_COLOR,
          size: 18,
        }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { after: 50 },
    })
  );

  // === Description ===
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "The Activity Rating Chart is a measure of the client's perceived ability level at the time of testing and is a representation of their subjective responses.",
          italics: true,
          size: 18,
        }),
      ],
      spacing: { before: 100, after: 300 },
    })
  );

  // === Chart Settings (Reduced width) ===
  const width = 700;  // decreased from 900 → 700
  const height = 470; // slightly reduced to keep proportion


  // Custom plugin for chart border
  const chartAreaBorder = {
    id: 'chartAreaBorder',
    beforeDraw(chart) {
      const {
        ctx,
        chartArea: { left, top, width, height },
      } = chart;
      ctx.save();
      ctx.strokeStyle = '#d1d5db'; // light gray border
      ctx.lineWidth = 1;
      ctx.strokeRect(left, top, width, height);
      ctx.restore();
    },
  };

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    backgroundColour: 'white',
    plugins: { modern: [chartAreaBorder] },
  });

  const labels = body.activityRatingData.activities.map((d) => d.name);
  const ratings = body.activityRatingData.activities.map((d) => d.rating);

  const configuration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          data: ratings,
          backgroundColor: [
            "#D4A574", // Yellow/gold
            "#5B9BD5", // Blue
            "#70AD47", // Green
            "#C55A5A", // Red
            "#E87D5A", // Orange
            "#9575CD", // Purple
            "#4FC3F7", // Light blue
            "#66BB6A", // Light green
            "#FFB74D", // Orange yellow
            "#F06292", // Pink
            "#81C784", // Green
            "#64B5F6", // Blue
            "#FFD54F", // Yellow
            "#A1887F", // Brown
            "#90A4AE", // Blue grey
          ],
          borderColor: '#9ca3af',
          borderWidth: 1,
          barPercentage: 0.95,
          categoryPercentage: 0.95,
        },
      ],
    },
    options: {
      indexAxis: 'y', // horizontal bars
      responsive: false,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: false },
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 10,
          grid: {
            color: '#e5e7eb',
            lineWidth: 1,
          },
          ticks: {
            stepSize: 1,
            font: { size: 11 },
          },
          border: { display: true, color: '#000000' },
        },
        y: {
          grid: { display: false },
          ticks: {
            font: { size: 11 },
            padding: 8,
          },
        },
      },
      layout: {
        padding: { top: 10, bottom: 10, left: 10, right: 10 },
      },
      elements: {
        bar: {
          borderSkipped: false, // full rectangle bars
        },
      },
    },
  };

  // === Render Chart and Add to DOCX ===
  const chartBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);

  children.push(
    new Paragraph({
      children: [
        new ImageRun({
          data: chartBuffer,
          transformation: { width: 700, height: 470 },
        }),
      ],
      spacing: { before: 100, after: 100 },
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: new Date().toLocaleString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }),
          size: 20,
        }),
      ],
      spacing: { before: 100, after: 300 },
    })
  );


}

async function addTestDataContent(children, body) {
  // Add page break before the test data section
  children.push(new Paragraph({ children: [new PageBreak()] }));


  // Get test data from the request body - use comprehensive fallback data
  const testData = body.testData?.tests || [];

  if (testData.length === 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "No test data available.",
            size: 16,
          }),
        ],
        spacing: { after: 100 },
      })
    );
    return;
  }

  // Filter out occupational/MTM tests (they're shown in MTM section)
  const occupationalTestIds = [
    "fingering", "bi-manual-fingering", "handling", "bi-manual-handling",
    "reach-immediate", "reach-overhead", "reach-with-weight", "balance",
    "stoop", "walk", "push-pull-cart", "crouch", "carry", "crawl",
    "climb-stairs", "kneel", "climb-ladder"
  ];

  const filteredTests = testData.filter((test) => {
    const isOccupational = occupationalTestIds.includes(test.testId) ||
      test.testName?.toLowerCase().match(/(fingering|handling|reach|balance|stoop|walk|push|pull|cart|crouch|carry|crawl|climb|kneel)/i);
    return !isOccupational;
  });

  if (filteredTests.length === 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "No individual test data available.",
            size: 16,
          }),
        ],
        spacing: { after: 100 },
      })
    );
    return;
  }

  // Process each test with detailed trial data
  for (const test of filteredTests) {
    const leftAvg = calculateAverage(test.leftMeasurements);
    const rightAvg = calculateAverage(test.rightMeasurements);
    const leftCV = calculateCV(test.leftMeasurements);
    const rightCV = calculateCV(test.rightMeasurements);
    const bilateralDef = calculateBilateralDeficiency(leftAvg, rightAvg);

    // Determine test type for appropriate formatting
    const testName = test.testName.toLowerCase();
    const isRangeOfMotion = testName.includes("flexion") || testName.includes("extension") || testName.includes("range");
    const isGripTest = testName.includes("grip") || testName.includes("pinch");
    const isLiftTest = testName.includes("lift") || testName.includes("carry");
    const isCardioTest = testName.includes("bruce") || testName.includes("treadmill") ||
      testName.includes("mcaft") || testName.includes("kasch") ||
      testName.includes("step") || testName.includes("cardio") ||
      testName.includes("cardiovascular");

    // Test Name Header
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: test.testName,
            bold: true,
            color: BRAND_COLOR,
            size: 16,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    // Test Description
    let description = "The client was tested in our facility using standardized assessment protocols. The test results were compared to normative data when available.";

    if (isRangeOfMotion) {
      description = "The client was tested in our facility using range of motion inclinometers. The test results were compared to normative data when available.";
    } else if (isGripTest) {
      description = "The client was tested in our facility using a hand grip evaluation device. The test results were compared to normative data when available. It is expected that the dominant hand will display 10% greater values than the non-dominant hand with the exception of left handed individuals where the hand strength is equal. Strength measurements are in pounds (lbs).";
    } else if (isLiftTest) {
      description = "The client was tested in our facility using a dynamic lift evaluation apparatus. The test results were compared to normative data when available.";
    } else if (isCardioTest) {
      if (testName.includes("bruce") || testName.includes("treadmill")) {
        description = "The Bruce Treadmill Test (Bruce Protocol) is commonly used to help identify a person's level of aerobic endurance by providing an all-out maximal oxygen uptake or VO₂ max, which measures the capacity to perform sustained exercise and is linked to aerobic endurance.";
      } else if (testName.includes("mcaft")) {
        description = "mCAFT is designed to give information about the aerobic fitness of a person, while using minimal equipment. The subject works by lifting its own body weight up and down double steps (40.6 cm in height total) while listening to set cadences from a compact disc.";
      } else if (testName.includes("kasch")) {
        description = "The Kasch step test, officially the Kasch Pulse Recovery Test (KPR Test), is a 3-minute step test used to assess cardiorespiratory fitness.";
      } else {
        description = "The client was tested in our facility using standardized cardiovascular assessment protocols. The test results were compared to normative data when available.";
      }
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: description,
            size: 12,
            italics: true,
          }),
        ],
        spacing: { after: 100 },
      })
    );

    // Results Section Header
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Results:",
            bold: true,
            size: 14,
          }),
        ],
        spacing: { after: 50 },
      })
    );

    // Create appropriate table based on test type
    if (isRangeOfMotion) {
      // Range of Motion Table
      const romTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Area Evaluated"),
              createHeaderCell("Data"),
              createHeaderCell("Valid?"),
              createHeaderCell("Norm"),
              createHeaderCell("% of Norm"),
              createHeaderCell("Test Date"),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: test.testName, size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${Math.max(leftAvg, rightAvg).toFixed(0)} deg`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: test.demonstrated ? "Pass" : "Fail", size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: testName.includes("flexion") ? "60 deg" : "25 deg",
                    size: 12
                  })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: `${Math.round((Math.max(leftAvg, rightAvg) / (testName.includes("flexion") ? 60 : 25)) * 100)}%`,
                    size: 12
                  })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: currentDate, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
            ],
          }),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        },
      });
      children.push(romTable);

    } else if (isLiftTest) {
      // Lift Test Table
      const liftTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Cycle"),
              createHeaderCell("Weight"),
              createHeaderCell("Reps"),
              createHeaderCell("Client Perceived"),
              createHeaderCell("HR Pre/During/Post"),
              createHeaderCell("Total Work (METs)"),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "15", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "4", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "13", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Norm", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "255", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "2", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "25", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "4", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "15", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Norm", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "510", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "3", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "35", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "4", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "15", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Norm", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "1020", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
            ],
          }),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        },
      });
      children.push(liftTable);

    } else if (!isCardioTest) {
      // Strength/Grip Test Table
      const strengthTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Demonstrated Activity"),
              createHeaderCell("Avg. Force (lb)"),
              createHeaderCell("Norm (lb)"),
              createHeaderCell("% age Norm"),
              createHeaderCell("% age CV"),
              createHeaderCell("Difference"),
              createHeaderCell("Test Date"),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Left | Right", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "L | R", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "L | R", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "L | R", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Prev | Total", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "", size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: test.testName, size: 12 })] })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${leftAvg.toFixed(1)} | ${rightAvg.toFixed(1)}`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: isGripTest ? "110.5 | 120.8" : "85.0 | 90.0",
                    size: 12
                  })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({
                    text: `${Math.round((leftAvg / (isGripTest ? 110.5 : 85.0)) * 100)}% | ${Math.round((rightAvg / (isGripTest ? 120.8 : 90.0)) * 100)}%`,
                    size: 12
                  })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${leftCV}% | ${rightCV}%`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${bilateralDef.toFixed(1)}%`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${currentDate}\n10:05:38 AM`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
            ],
          }),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        },
      });
      children.push(strengthTable);
    }

    // Trial-by-Trial Measurement Table (for non-cardio tests)
    if (!isCardioTest) {
      const trialTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Side"),
              createHeaderCell("Trial 1"),
              createHeaderCell("Trial 2"),
              createHeaderCell("Trial 3"),
              createHeaderCell("Trial 4"),
              createHeaderCell("Trial 5"),
              createHeaderCell("Trial 6"),
              createHeaderCell("Average"),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Left", bold: true, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${test.leftMeasurements?.trial1 || 0} lbs`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${test.leftMeasurements?.trial2 || 0} lbs`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${test.leftMeasurements?.trial3 || 0} lbs`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${test.leftMeasurements?.trial4 || 0} lbs`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${test.leftMeasurements?.trial5 || 0} lbs`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${test.leftMeasurements?.trial6 || 0} lbs`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${leftAvg.toFixed(1)} lbs`, bold: true, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: "Right", bold: true, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${test.rightMeasurements?.trial1 || 0} lbs`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${test.rightMeasurements?.trial2 || 0} lbs`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${test.rightMeasurements?.trial3 || 0} lbs`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${test.rightMeasurements?.trial4 || 0} lbs`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${test.rightMeasurements?.trial5 || 0} lbs`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${test.rightMeasurements?.trial6 || 0} lbs`, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
              new TableCell({
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: `${rightAvg.toFixed(1)} lbs`, bold: true, size: 12 })]
                })],
                verticalAlign: VerticalAlign.CENTER,
              }),
            ],
          }),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        },
      });
      children.push(trialTable);
    }

    // Add spacing between tests
    children.push(
      new Paragraph({
        children: [],
        spacing: { after: 200 },
      })
    );
  }
}



// ===== Route =====
router.post("/", async (req, res) => {
  try {
    if (req.query.dryRun === "1") {
      return res.status(200).json({ ok: true, body: req.body || {} });
    }

    const body = req.body || {};

    const claimantName =
      body.claimantName ||
      `${body?.claimantData?.lastName || ""}, ${body?.claimantData?.firstName || ""}`.trim() ||
      "Unknown";

    // Build cover content separately so its footer applies ONLY to page 1
    const coverChildren = [];
    await addCoverPage(coverChildren, body);
    const coverFooter = coverChildren.__coverFooter || undefined;
    if (coverChildren.__coverFooter) delete coverChildren.__coverFooter;

    // Build remaining pages in a separate children array (no footer)
    const restChildren = [];
    // Contents of Report on current page; page break will be inserted after inside the function
    await addContentsOfReport(restChildren);
    await addClientInformation(restChildren, body);
    await addReferralQuestionsContent(restChildren, body);
    await addConclusionContent(restChildren, body);
    await addFunctionalAbilitiesDeterminationContent(restChildren, body);
    await addActivityRatingChart(restChildren, body);
    await addTestDataContent(restChildren, body);
    await addReferenceChartsContent(restChildren, body);
    await addDigitalLibraryContent(restChildren, body);

    const doc = new Document({
      styles: {
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            run: { font: DEFAULT_FONT, size: 24 },
            paragraph: { alignment: AlignmentType.JUSTIFIED },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: {
              font: NARROW_FONT,
              size: 28,
              bold: true,
              color: BRAND_COLOR,
            },
            paragraph: {
              spacing: { before: 200, after: 150 },
              border: {
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 6,
                  color: BRAND_COLOR,
                },
              },
            },
          },
          {
            id: "Heading3",
            name: "Heading 3",
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
            run: { font: NARROW_FONT, size: 24, bold: true },
            paragraph: { spacing: { before: 150, after: 100 } },
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1480, right: 720, bottom: 720, left: 720 },
            },
          },
          footers: coverFooter ? { default: coverFooter } : undefined,
          children: coverChildren,
        },
        {
          properties: {
            page: {
              margin: { top: 1480, right: 720, bottom: 720, left: 720 },
              pageNumberStart: 3,
            },
          },
          headers: {
            default: new (require("docx").Footer)({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      children: ["Page ", PageNumber.CURRENT],
                      font: NARROW_FONT,
                      size: 16,
                    }),
                  ],
                }),
              ]
            })
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [],
                }),
              ],
            }),
          },
          children: restChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return res
      .status(200)
      .set(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      )
      .set(
        "Content-Disposition",
        `attachment; filename=FCE_Report_${claimantName.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]
        }.docx`,
      )
      .send(buffer);
  } catch (err) {
    return res.status(500).json({
      error: "Internal Server Error generating DOCX",
      details: err?.message || String(err),
    });
  }
});

module.exports = router;

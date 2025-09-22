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

// Branding and font defaults aligned with PDF generation
const DEFAULT_FONT = "Arial";
const NARROW_FONT = "Arial Narrow";
const BRAND_COLOR = "4472C4";

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
            transformation: { width: 70, height: 70 },
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
          size: 32,
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
      indent: { left: 3200 },
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
        }),
      ],
    }),
  );
  if (clinicName)
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: clinicName, bold: true })],
      }),
    );
  if (clinicAddress)
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: clinicAddress })],
      }),
    );
  if (phoneFax)
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: phoneFax })],
      }),
    );

  children.__coverFooter = new (require("docx").Footer)({
    children: footerChildren,
  });
}



// Alternate contents builder for second page usage
function addContentsOfReport() {
  const blue = BRAND_COLOR;

  const makeP = (text, opts = {}) =>
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { before: opts.before || 0, after: opts.after || 80 },
      indent: { left: opts.left || 0 },
      children: [
        new TextRun({ text, bold: !!opts.bold, color: opts.color || undefined }),
      ],
    });

  // Right column content: heading and list
  const content = [
    makeP("Contents of Report:", { bold: true, color: blue, after: 200 }),
    makeP("Client Information"),
    makeP("Pain & Symptom Illustration"),
    makeP("Referral Questions"),
    makeP("Conclusions"),
    makeP("Functional Abilities Determination and Job Match Results"),
    makeP("Test Data:", { before: 80 }),
    makeP("o  Activity Overview", { left: 720 }),
    makeP("o  Extremity Strength", { left: 720 }),
    makeP("o  Occupational Tasks", { left: 720 }),
    makeP("o  Range of Motion (Spine)", { left: 720 }),
    makeP("Appendix One: Reference Charts", { before: 120 }),
    makeP("Appendix Two: Digital Library", { after: 120 }),
  ];

  // Table with a narrow left rule column and the content on the right
  const leftRuleCell = new TableCell({
    width: { size: 400, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.SINGLE, size: 6, color: "404040" },
    },
    children: [new Paragraph("")],
  });

  const contentCell = new TableCell({
    width: { size: 9000, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
    children: content,
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [leftRuleCell, contentCell] })],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
  });

  return [table];
}

async function addClientInformation(children, body) {
  const {
    claimantData = {},
    claimNumber = "",
    reportSummary = {},
  } = body || {};

  children.push(new Paragraph({ pageBreakBefore: true }));
  children.push(headerText("Client Information"));

  if (claimantData.profilePhoto) {
    const claimantImg = await getImageBuffer(claimantData.profilePhoto);
    if (claimantImg) {
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: claimantImg,
              transformation: { width: 120, height: 150 },
            }),
          ],
          spacing: { after: 200 },
        }),
      );
    }
  }

  const infoRowsLeft = [
    [
      "Name",
      `${claimantData.firstName || ""} ${claimantData.lastName || ""}`.trim(),
    ],
    ["Address", claimantData.address || "N/A"],
    ["Home Phone", claimantData.phone || claimantData.phoneNumber || "N/A"],
    ["Work Phone", claimantData.workPhone || "N/A"],
    [
      "Occupation",
      claimantData.occupation || claimantData.currentOccupation || "N/A",
    ],
    ["Employer(SIC)", claimantData.employer || "N/A"],
    ["Insurance", claimantData.insurance || "N/A"],
    ["Physician", claimantData.referredBy || "N/A"],
  ];

  const infoRowsRight = [
    [
      "ID",
      claimNumber || claimantData.claimantId || reportSummary.reportId || "N/A",
    ],
    ["DOB (Age)", `${claimantData.dateOfBirth || "N/A"}`],
    ["Gender", claimantData.gender || "N/A"],
    [
      "Height",
      claimantData.heightValue
        ? `${claimantData.heightValue} ${claimantData.heightUnit || ""}`
        : claimantData.height || "N/A",
    ],
    [
      "Weight",
      claimantData.weightValue
        ? `${claimantData.weightValue} ${claimantData.weightUnit || ""}`
        : claimantData.weight || "N/A",
    ],
    [
      "Dominant Hand",
      claimantData.dominantHand || claimantData.handDominance || "N/A",
    ],
    ["Referred By", claimantData.referredBy || "N/A"],
    [
      "Tested By",
      body?.evaluatorData?.name || reportSummary.evaluatorName || "Evaluator",
    ],
  ];

  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      ...infoRowsLeft.map(
        (row, i) =>
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: row[0] + ":", bold: true })],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({ children: [new TextRun({ text: row[1] })] }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: (infoRowsRight[i]?.[0] || "") + ":",
                        bold: true,
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({ text: infoRowsRight[i]?.[1] || "" }),
                    ],
                  }),
                ],
              }),
            ],
          }),
      ),
    ],
  });
  children.push(infoTable);

  children.push(subHeaderText("Mechanism and History of Injury"));
  const hist =
    claimantData.claimantHistory || claimantData.injuryDescription || "";
  children.push(
    new Paragraph({
      children: [new TextRun({ text: hist, font: DEFAULT_FONT, size: 24 })],
      alignment: AlignmentType.JUSTIFIED,
    }),
  );
}

async function addPainSymptomIllustration(children, body) {
  const { painIllustrationData = {} } = body || {};
  children.push(new Paragraph({ pageBreakBefore: true }));
  children.push(headerText("Pain/Symptom Illustration"));

  if (painIllustrationData?.description) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: painIllustrationData.description })],
        spacing: { after: 120 },
      }),
    );
  }
  if (painIllustrationData?.savedImage) {
    const painImg = await getImageBuffer(painIllustrationData.savedImage);
    if (painImg) {
      children.push(
        new Paragraph({
          children: [
            new ImageRun({
              data: painImg,
              transformation: { width: 300, height: 220 },
            }),
          ],
          spacing: { after: 160 },
        }),
      );
    }
  }
}

function addActivityOverview(children, body) {
  const { activityRatingData = {} } = body || {};
  children.push(headerText("Activity Overview"));
  const activities = activityRatingData?.activities || [];
  if (activities.length) {
    const activityHeader = new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Activity", bold: true })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Rating", bold: true })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Demonstrated", bold: true })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Perceived", bold: true })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Comments", bold: true })],
            }),
          ],
        }),
      ],
    });
    const activityRows = activities.map(
      (a) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(a.name || "")] }),
            new TableCell({
              children: [new Paragraph(String(a.rating ?? ""))],
            }),
            new TableCell({
              children: [new Paragraph(a.demonstrated ? "Yes" : "No")],
            }),
            new TableCell({
              children: [new Paragraph(a.perceived ? "Yes" : "No")],
            }),
            new TableCell({ children: [new Paragraph(a.comments || "")] }),
          ],
        }),
    );
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [activityHeader, ...activityRows],
      }),
    );
  } else {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "No activity ratings provided." })],
      }),
    );
  }
}

async function addReferralQuestions(children, body) {
  const { referralQuestionsData = {} } = body || {};
  children.push(new Paragraph({ pageBreakBefore: true }));
  children.push(headerText("Referral Questions"));
  const questions = referralQuestionsData?.questions || [];
  if (questions.length) {
    let idx = 0;
    for (const q of questions) {
      idx += 1;
      children.push(subHeaderText(`Q${idx}. ${q.question || ""}`));
      children.push(
        new Paragraph({
          children: [new TextRun({ text: q.answer || "" })],
          spacing: { after: 80 },
        }),
      );
      if (Array.isArray(q.savedImageData)) {
        for (const img of q.savedImageData) {
          const buf = await getImageBuffer(img.dataUrl || img.data);
          if (buf)
            children.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: buf,
                    transformation: { width: 300, height: 200 },
                  }),
                ],
                spacing: { after: 60 },
              }),
            );
        }
      }
    }
  } else {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "No referral questions provided." })],
      }),
    );
  }
}

// Add Conclusions section aligned with PDF content
async function addConclusions(children, body) {
  const { referralQuestionsData = {} } = body || {};
  const items = Array.isArray(referralQuestionsData?.questions)
    ? referralQuestionsData.questions
    : [];

  // Find conclusions question
  const conclusionQA = items.find(
    (qa) => qa && qa.question && String(qa.question).toLowerCase().includes("conclusion"),
  );

  if (!conclusionQA || (!conclusionQA.answer && !Array.isArray(conclusionQA.savedImageData))) {
    return;
  }

  children.push(new Paragraph({ pageBreakBefore: true }));
  children.push(headerText("Conclusions"));

  if (conclusionQA.answer) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: String(conclusionQA.answer) })],
        spacing: { after: 200 },
      }),
    );
  }

  // Images grid if present
  const imgs = Array.isArray(conclusionQA.savedImageData)
    ? conclusionQA.savedImageData
    : [];
  if (imgs.length) {
    const imagesPerRow = 4;
    for (let i = 0; i < imgs.length; i += imagesPerRow) {
      const cells = [];
      for (let j = 0; j < imagesPerRow; j++) {
        const img = imgs[i + j];
        if (img) {
          const src = img.dataUrl || img.data || img.url;
          const buf = await getImageBuffer(src);
          cells.push(
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: buf
                    ? [
                      new ImageRun({
                        data: buf,
                        transformation: { width: 140, height: 90 },
                      }),
                    ]
                    : [new TextRun("")],
                }),
              ],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
          );
        } else {
          cells.push(
            new TableCell({
              children: [new Paragraph("")],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
          );
        }
      }
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [new TableRow({ children: cells })],
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
        }),
      );
    }
  }
}

// Signature section similar to PDF flow
function addEvaluatorSignature(children, body) {
  const name = body?.evaluatorData?.name || body?.evaluatorName || "";
  const license = body?.evaluatorData?.licenseNo || "";
  const date = body?.evaluationDate || new Date().toISOString().split("T")[0];

  children.push(new Paragraph({ pageBreakBefore: true }));
  children.push(headerText("Signature of Evaluator"));

  const rows = [
    new TableRow({
      children: [
        borderlessCell("Evaluator Name:", true),
        borderlessCell(name || ""),
      ],
    }),
    new TableRow({
      children: [
        borderlessCell("License #:", true),
        borderlessCell(license || ""),
      ],
    }),
    new TableRow({
      children: [
        borderlessCell("Date:", true),
        borderlessCell(date),
      ],
    }),
  ];

  children.push(
    new Table({
      width: { size: 60, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.LEFT,
      rows,
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
    }),
  );
}

function addProtocolAndSelectedTests(children, body) {
  const { protocolTestsData = {} } = body || {};
  children.push(headerText("Protocol & Selected Tests"));
  const protoName =
    protocolTestsData?.selectedProtocol || "Standard FCE Protocol";
  children.push(labelValueRow("Protocol", protoName));
  const selectedTests = protocolTestsData?.selectedTests || [];
  if (selectedTests.length) {
    selectedTests.forEach((t) =>
      children.push(
        new Paragraph({ children: [new TextRun({ text: `• ${t}` })] }),
      ),
    );
  }
}

async function addMTMSection(children, body) {
  const mtm =
    body?.mtmTestData && typeof body.mtmTestData === "object"
      ? body.mtmTestData
      : {};
  if (!Object.keys(mtm).length) return;
  children.push(new Paragraph({ pageBreakBefore: true }));
  children.push(headerText("Occupational Tasks - MTM Analysis"));
  for (const [testKey, data] of Object.entries(mtm)) {
    const trials = Array.isArray(data.trials) ? data.trials : [];
    children.push(subHeaderText(`${data.testName || testKey}`));
    const header = new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph(new TextRun({ text: "Trial", bold: true }))],
        }),
        new TableCell({
          children: [new Paragraph(new TextRun({ text: "Side", bold: true }))],
        }),
        new TableCell({
          children: [
            new Paragraph(new TextRun({ text: "Weight/Plane", bold: true })),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph(
              new TextRun({ text: "Distance/Posture", bold: true }),
            ),
          ],
        }),
        new TableCell({
          children: [new Paragraph(new TextRun({ text: "Reps", bold: true }))],
        }),
        new TableCell({
          children: [
            new Paragraph(new TextRun({ text: "Time (sec)", bold: true })),
          ],
        }),
        new TableCell({
          children: [new Paragraph(new TextRun({ text: "%IS", bold: true }))],
        }),
        new TableCell({
          children: [
            new Paragraph(
              new TextRun({ text: "Time Set Completed", bold: true }),
            ),
          ],
        }),
      ],
    });
    let rows;
    if (trials.length) {
      rows = trials.map(
        (t, i) =>
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph(String(t.trial || i + 1))],
              }),
              new TableCell({ children: [new Paragraph(t.side || "Both")] }),
              new TableCell({
                children: [
                  new Paragraph(String(t.weight || t.plane || "Immediate")),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph(String(t.distance || t.position || "Standing")),
                ],
              }),
              new TableCell({ children: [new Paragraph(String(t.reps ?? 1))] }),
              new TableCell({
                children: [
                  new Paragraph(
                    (() => {
                      const timeNum = Number(t.testTime);
                      return String(
                        Number.isFinite(timeNum) ? timeNum.toFixed(1) : "0",
                      );
                    })(),
                  ),
                ],
              }),
              new TableCell({
                children: [
                  new Paragraph(
                    (() => {
                      const percentNum = Number(t.percentIS);
                      return String(
                        Number.isFinite(percentNum)
                          ? percentNum.toFixed(1)
                          : "0",
                      );
                    })(),
                  ),
                ],
              }),
              // Per-trial Time Set Completed left blank per request
              new TableCell({ children: [new Paragraph("")] }),
            ],
          }),
      );

      // compute total sum for Time Set Completed across trials
      const totalSum = trials.reduce((sum, tt) => {
        const totalCompletedNum =
          tt.totalCompleted !== undefined && tt.totalCompleted !== null
            ? Number(tt.totalCompleted)
            : undefined;
        const testTimeNum = Number(tt.testTime);
        const percentNum = Number(tt.percentIS);
        let val = 0;
        if (Number.isFinite(totalCompletedNum)) {
          val = totalCompletedNum;
        } else if (Number.isFinite(testTimeNum) && Number.isFinite(percentNum)) {
          val = testTimeNum * (percentNum / 100);
        } else if (Number.isFinite(testTimeNum)) {
          val = testTimeNum;
        }
        return sum + val;
      }, 0);

      // append totals row (last row showing total time)
      rows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({ children: [new Paragraph("")] }),
            new TableCell({
              children: [
                new Paragraph(String(Number(totalSum || 0).toFixed(1)), {
                  bold: true,
                }),
              ],
            }),
          ],
        }),
      );
    } else {
      rows = [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 8,
              children: [new Paragraph("No trial data")],
            }),
          ],
        }),
      ];
    }
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [header, ...rows],
      }),
    );

    if (Array.isArray(data.savedImageData) && data.savedImageData.length) {
      for (const img of data.savedImageData) {
        const b = await getImageBuffer(img.dataUrl || img.data);
        if (b)
          children.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: b,
                  transformation: { width: 250, height: 160 },
                }),
              ],
              spacing: { after: 60 },
            }),
          );
      }
    }
  }
}

function addFunctionalTests(children, body) {
  const tests = Array.isArray(body?.testData?.tests) ? body.testData.tests : [];
  children.push(new Paragraph({ pageBreakBefore: true }));
  children.push(headerText("Functional Tests"));
  if (tests.length) {
    for (const t of tests) {
      children.push(subHeaderText(t.testName || "Test"));
      if (t.result) children.push(labelValueRow("Result", t.result));
      if (t.effort) children.push(labelValueRow("Effort", t.effort));
      if (t.consistency)
        children.push(labelValueRow("Consistency", t.consistency));

      if (t.measurements && Object.keys(t.measurements).length) {
        const measHeader = new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph(new TextRun({ text: "Trial", bold: true })),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph(new TextRun({ text: "Value", bold: true })),
              ],
            }),
          ],
        });
        const measRows = Object.entries(t.measurements)
          .filter(([k]) => /^trial\d+$/i.test(k))
          .map(
            ([k, v]) =>
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph(k)] }),
                  new TableCell({ children: [new Paragraph(String(v))] }),
                ],
              }),
          );
        const avg = calcAverage(t.measurements);
        children.push(
          new Table({
            width: { size: 60, type: WidthType.PERCENTAGE },
            rows: [measHeader, ...measRows],
          }),
        );
        children.push(labelValueRow("Average", String(avg)));
        if (t.unit) children.push(labelValueRow("Unit", t.unit));
      }

      if (t.limitations)
        children.push(labelValueRow("Limitations", t.limitations));
      if (t.jobRequirements)
        children.push(labelValueRow("Job Requirements", t.jobRequirements));
      if (t.comments)
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Comments: ${t.comments}` })],
            spacing: { after: 120 },
          }),
        );
    }
  } else {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "No test data provided." })],
      }),
    );
  }
}

async function addDigitalLibrary(children, body) {
  children.push(new Paragraph({ pageBreakBefore: true }));
  children.push(headerText("Appendix Two: Digital Library"));
  const files = Array.isArray(body?.digitalLibraryData?.savedFileData)
    ? body.digitalLibraryData.savedFileData
    : [];

  const imageItems = files.filter((f) => {
    const type = String(f?.type || "").toLowerCase();
    const src = f?.dataUrl || f?.data || f?.url || "";
    return (
      type.startsWith("image/") ||
      (typeof src === "string" && /^(data:image\/|https?:\/\/)/i.test(src))
    );
  });

  if (!imageItems.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "No digital library images." })],
      }),
    );
    return;
  }

  const imagesPerRow = 4;
  const rows = [];
  for (let i = 0; i < imageItems.length; i += imagesPerRow) {
    const cells = [];
    for (let j = 0; j < imagesPerRow; j++) {
      const item = imageItems[i + j];
      if (item) {
        const src = item.dataUrl || item.data || item.url;
        const buf = await getImageBuffer(src);
        if (buf) {
          cells.push(
            new TableCell({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new ImageRun({
                      data: buf,
                      transformation: { width: 160, height: 120 },
                    }),
                  ],
                }),
              ],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
          );
        } else {
          cells.push(
            new TableCell({
              children: [new Paragraph("")],
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
              },
            }),
          );
        }
      } else {
        cells.push(
          new TableCell({
            children: [new Paragraph("")],
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
            },
          }),
        );
      }
    }
    rows.push(new TableRow({ children: cells }));
  }

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows,
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
    }),
  );
}
function addAppendixOne(children) {
  children.push(new Paragraph({ pageBreakBefore: true }));
  children.push(headerText("Appendix One: Reference Charts"));
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Reference charts and norms used during evaluation are available upon request and were consulted to interpret the client performance across tests.",
        }),
      ],
    }),
  );
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
    // Dedicated second page with Contents of Report
    restChildren.push(new Paragraph({ pageBreakBefore: true }));
    addContentsOfReport().forEach((n) => restChildren.push(n));
    await addClientInformation(restChildren, body);
    await addPainSymptomIllustration(restChildren, body);
    addActivityOverview(restChildren, body);
    await addReferralQuestions(restChildren, body);
    await addConclusions(restChildren, body);
    addEvaluatorSignature(restChildren, body);
    addProtocolAndSelectedTests(restChildren, body);
    await addMTMSection(restChildren, body);
    addFunctionalTests(restChildren, body);
    addAppendixOne(restChildren);
    addDigitalLibrary(restChildren, body);

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
            },
          },
          // Explicitly clear footer so it doesn't inherit from section 1
          footers: { default: new (require("docx").Footer)({ children: [] }) },
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

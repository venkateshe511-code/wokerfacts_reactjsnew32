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
} = require("docx");

const router = express.Router();


// Helper to create a truly borderless cell
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


// Helper to load logo from data URL, HTTP(S) URL, or local path
const getLogoBuffer = async (src) => {
  if (!src || typeof src !== "string") return null;
  try {
    console.log("🔎 Logo source received:", src.slice(0, 100));
    // log only first 100 chars to avoid dumping entire base64

    let buffer = null;

    // Data URL
    if (/^data:image\//i.test(src)) {
      const mime = src.substring(5, src.indexOf(";"));
      if (!/image\/(png|jpeg|jpg)/i.test(mime)) return null;
      const base64 = (src.split(",")[1] || "").replace(/\s/g, "");
      if (!base64) return null;
      buffer = Buffer.from(base64, "base64");
    }

    // HTTP(S) URL
    else if (/^https?:\/\//i.test(src)) {
      const resp = await fetch(src);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const ct = resp.headers.get("content-type") || "";
      if (!/image\/(png|jpeg|jpg)/i.test(ct)) return null;
      const arr = await resp.arrayBuffer();
      buffer = Buffer.from(arr);
    }

    // Local path
    else {
      const abs = path.isAbsolute(src) ? src : path.resolve(src);
      if (fs.existsSync(abs)) {
        if (!/(\.png|\.jpg|\.jpeg)$/i.test(abs)) return null;
        buffer = fs.readFileSync(abs);
      }
    }

    if (buffer) {
      console.log("✅ Logo buffer loaded, size:", buffer.length, "bytes");

      // 🔽 Write a copy to tmp folder for inspection
      const tmpPath = path.join(os.tmpdir(), "debug_logo.png");
      fs.writeFileSync(tmpPath, buffer);
      console.log("🖼️ Debug logo written to:", tmpPath);
    }

    return buffer;
  } catch (e) {
    console.error("Logo load error:", e.message);
  }
  return null;
};


router.post("/", async (req, res) => {
  try {
    // Allow payload inspection if needed
    if (req.query.dryRun === "1") {
      return res.status(200).json({ ok: true, body: req.body || {} });
    }

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
    } = req.body || {};

    const nameDisplay =
      claimantName || `${claimantData?.lastName || ""}, ${claimantData?.firstName || ""}`.trim() || "Unknown";

    const children = [];

    // Logo or clinic name
    const logoSrc =
      logoPath ||
      req.body?.evaluatorData?.clinicLogo;
    const imageBuffer = await getLogoBuffer(logoSrc);

    children.push(
      new Paragraph({
        children: [],
        spacing: { after: 2000 },
      })
    );
    children.push(
      new Paragraph({
        children: [],
        spacing: { after: 2000 }, 
      })
    );

    if (imageBuffer) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({ data: imageBuffer, transformation: { width: 120, height: 60 } }),
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

    // Title (left-aligned block as per reference)
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        indent: { left: 2880 },
        children: [
          new TextRun({
            text: "Functional Abilities Determination",
            bold: true,
            color: "4472C4",
            size: 28,
          }),
        ],
        spacing: { after: 200 },
      })
    );

    // Cover info table (completely borderless)
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
        new TableRow({
          children: [borderlessCell("Claimant Name:", true), borderlessCell(nameDisplay)],
        }),
        new TableRow({
          children: [borderlessCell("Claimant #:", true), borderlessCell(claimNumber || "N/A")],
        }),
        new TableRow({
          children: [borderlessCell("Date of Evaluation(s):", true), borderlessCell(evaluationDate || "")],
        }),
      ],
    });


    children.push(coverInfoTable);

    // Footer (push toward bottom, centered)
    if (clinicName || clinicAddress || clinicPhone || clinicFax) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 2400, after: 120 },
          children: [
            new TextRun({ text: "CONFIDENTIAL INFORMATION ENCLOSED", bold: true, size: 18 }),
          ],
        })
      );
      if (clinicName) {
        children.push(
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: clinicName, bold: true, size: 16 })] })
        );
      }
      if (clinicAddress) {
        children.push(
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: clinicAddress, size: 16 })] })
        );
      }
      const phoneFax = `Phone: ${clinicPhone || ""}${clinicPhone && clinicFax ? "    " : ""}${clinicFax ? `Fax: ${clinicFax}` : ""}`.trim();
      if (phoneFax) {
        children.push(
          new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: phoneFax, size: 16 })] })
        );
      }
    }

    // Build and send DOCX
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1480,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        }, children
      }]
    });
    const buffer = await Packer.toBuffer(doc);

    return res
      .status(200)
      .set(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
      .set(
        "Content-Disposition",
        `attachment; filename=FCE_Report_${nameDisplay.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date()
          .toISOString()
          .split("T")[0]}.docx`
      )
      .send(buffer);
  } catch (err) {
    console.error("DOCX generation failed:", err);
    return res.status(500).json({ error: "Internal Server Error generating DOCX", details: err.message });
  }
});

module.exports = router;

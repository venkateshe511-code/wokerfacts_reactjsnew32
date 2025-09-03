const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
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


// Helper to create a borderless cell
const borderlessCell = (text, bold = false) =>
  new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold })],
      }),
    ],
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
    },
  });

// Helper to load logo from data URL, HTTP(S) URL, or local path
const getLogoBuffer = async (src) => {
  if (!src || typeof src !== "string") return null;
  try {
    // Data URL
    if (/^data:image\//i.test(src)) {
      const mime = src.substring(5, src.indexOf(";")); // e.g., data:image/png
      if (!/image\/(png|jpeg|jpg)/i.test(mime)) return null; // skip svg/webp
      const base64 = src.split(",")[1] || "";
      if (!base64) return null;
      return Buffer.from(base64, "base64");
    }
    // HTTP(S) URL
    if (/^https?:\/\//i.test(src)) {
      const resp = await fetch(src);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const ct = resp.headers.get("content-type") || "";
      if (!/image\/(png|jpeg|jpg)/i.test(ct)) return null; // skip unsupported
      const arr = await resp.arrayBuffer();
      return Buffer.from(arr);
    }
    // Local path
    const abs = path.isAbsolute(src) ? src : path.resolve(src);
    if (fs.existsSync(abs)) {
      // Best effort: only accept png/jpg by extension
      if (!/(\.png|\.jpg|\.jpeg)$/i.test(abs)) return null;
      return fs.readFileSync(abs);
    }
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
      req.body?.clinicLogo ||
      req.body?.logo ||
      claimantData?.clinicLogo ||
      req.body?.evaluatorData?.clinicLogo;
    const imageBuffer = await getLogoBuffer(logoSrc);
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

    // Cover info table (borderless, centered block with comfortable padding)
    const coverInfoTable = new Table({
      width: { size: 60, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER,
      borders: {
        top: { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left: { style: BorderStyle.NONE, size: 0 },
        right: { style: BorderStyle.NONE, size: 0 },
        insideH: { style: BorderStyle.NONE, size: 0 },
        insideV: { style: BorderStyle.NONE, size: 0 },
      },
      rows: [
        new TableRow({
          children: [
            borderlessCell("Claimant Name:", true),
            borderlessCell(nameDisplay, true),
          ],
        }),
        new TableRow({
          children: [
            borderlessCell("Claimant #:", true),
            borderlessCell(claimNumber || "N/A"),
          ],
        }),
        new TableRow({
          children: [
            borderlessCell("Date of Evaluation(s):", true),
            borderlessCell(evaluationDate || ""),
          ],
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
    const doc = new Document({ sections: [{ properties: {}, children }] });
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

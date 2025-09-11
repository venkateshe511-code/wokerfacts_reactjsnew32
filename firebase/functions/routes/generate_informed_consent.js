const express = require("express");
const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  AlignmentType,
  PageBreak,
} = require("docx");

async function fetchImageBuffer(url) {
  try {
    if (!url) return null;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const ab = await resp.arrayBuffer();
    return Buffer.from(ab);
  } catch (e) {
    return null;
  }
}

const router = express.Router();
router.use(express.json({ limit: "10mb" }));

// POST /informed-consent
// body: { clientProfile: { logo, clinicName, address, phone, email, website, evaluatorName }, images: [url,...] }
router.post("/informed-consent", async (req, res) => {
  try {
    const { clientProfile = {}, images = [] } = req.body || {};

    const doc = new Document({ sections: [] });
    const children = [];

    // Add logo if present
    if (clientProfile.logo) {
      const logoBuf = await fetchImageBuffer(clientProfile.logo);
      if (logoBuf) {
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: logoBuf,
                transformation: { width: 120, height: 60 },
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        );
      }
    }

    // Title
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Functional Abilities Determination",
            bold: true,
            size: 28,
          }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Informed Consent", bold: true, size: 24 }),
        ],
        alignment: AlignmentType.CENTER,
      }),
    );

    // Body sample text (shortened) - you can expand as needed
    const bodyText = `You have been asked to participate in a Functional Abilities Determination. This is often called a Functional Capacity Evaluation (FCE), a Return-to-Work Evaluation (RTW) or a Fit for Work Exam. The evaluation includes tasks such as medical history, physical exam, cognitive assessment, range of motion and strength testing, and cardiorespiratory tasks. Each test is voluntary and you may refuse any test if you feel unable to perform it.`;

    children.push(
      new Paragraph({
        children: [new TextRun({ text: bodyText, size: 22 })],
        spacing: { after: 200 },
      }),
    );

    // Insert any supplemental images provided
    for (const imgUrl of images.slice(0, 3)) {
      const buf = await fetchImageBuffer(imgUrl);
      if (buf) {
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: buf,
                transformation: { width: 300, height: 180 },
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        );
      }
    }

    // Signature lines
    children.push(new Paragraph({ children: [new PageBreak()] }));
    const signLine = (label) =>
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: false, size: 22 }),
          new TextRun({
            text: "____________________________________",
            size: 22,
          }),
        ],
        spacing: { after: 200 },
      });

    children.push(signLine("Client (sign)"));
    children.push(signLine("Date"));
    children.push(signLine("Client (print)"));
    children.push(signLine("Evaluator"));
    children.push(signLine("Date"));

    // Clinic contact info (from profile)
    const clinicInfo = [];
    if (clientProfile.clinicName) clinicInfo.push(clientProfile.clinicName);
    if (clientProfile.address) clinicInfo.push(clientProfile.address);
    if (clientProfile.phone) clinicInfo.push(`Phone: ${clientProfile.phone}`);
    if (clientProfile.email) clinicInfo.push(`Email: ${clientProfile.email}`);
    if (clientProfile.website) clinicInfo.push(clientProfile.website);

    if (clinicInfo.length) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
      clinicInfo.forEach((line) =>
        children.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: 20 })],
            alignment: AlignmentType.CENTER,
          }),
        ),
      );
    }

    // Add section and compile
    doc.addSection({ children });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="WF FCE Client Informed Consent.docx"`,
    );
    res.send(buffer);
  } catch (err) {
    console.error("Error generating informed consent doc:", err);
    res.status(500).json({ error: "Failed to generate document" });
  }
});

module.exports = router;

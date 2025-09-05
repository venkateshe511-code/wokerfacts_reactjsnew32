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
  WidthType,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  ImageRun,
  Header,
  Footer,
  PageBreak,
  TableLayoutType,
  ShadingType,
  convertInchesToTwip,
  PageNumber,
  TabStopType,
  TabStopPosition,
  UnderlineType,
} = require("docx");

const DEFAULT_FONT = "Calibri";
const BRAND_BLUE = "337FE5";

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

let globalSampleImageBuffer = null;
async function getSampleImageBuffer() {
  if (!globalSampleImageBuffer) {
    globalSampleImageBuffer = await fetchImageBuffer(
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWK1bi8ireVtN4jstd8ciOgk1AhSSeuB5lkw&s"
    );
  }
  return globalSampleImageBuffer;
}

function createTableCellForPain(text, bold = false, background = "") {
  return new TableCell({
    children: [new Paragraph({ children: [new TextRun({ text, bold })] })],
    shading: background ? { type: "clear", fill: background } : undefined,
  });
}

function createColoredSymbolCell(text) {
  const [symbol, ...rest] = String(text || "").trim().split(" ");
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: symbol + " ", color: "FF0000", bold: true }),
          new TextRun({ text: rest.join(" ") }),
        ],
      }),
    ],
  });
}

async function addCoverPageContent(children, claimantData, clientProfileData) {
  const buffer = await fetchImageBuffer(clientProfileData.logo);
  if (buffer) {
    children.push(
      new Paragraph({
        children: [new ImageRun({ data: buffer, transformation: { width: 60, height: 60 } })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 3500, after: 200 },
      })
    );
  }
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Functional Abilities Determination",
          bold: true,
          size: 48,
          font: DEFAULT_FONT,
          color: BRAND_BLUE,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );
  children.push(
    new Table({
      width: { size: 40, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Claimant Name:", underline: {} })] })], borders: {} }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: claimantData.fullName || "John", bold: true })] })], borders: {} }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Claimant #:", underline: {} })] })], borders: {} }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: claimantData.claimantID || "1234", bold: true })] })], borders: {} }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date of Evaluation(s):", underline: {} })] })], borders: {} }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "2025-01-01", bold: true })] })], borders: {} }),
          ],
        }),
      ],
      alignment: AlignmentType.CENTER,
      layout: TableLayoutType.AUTOFIT,
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
      spacing: { after: 400 },
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "CONFIDENTIAL INFORMATION ENCLOSED", size: 20, font: DEFAULT_FONT, color: "888888" })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 5000, after: 200 },
    })
  );
  children.push(new Paragraph({ children: [new TextRun({ text: "MedSource", size: 18, font: DEFAULT_FONT })], alignment: AlignmentType.CENTER }));
  children.push(
    new Paragraph({ children: [new TextRun({ text: "490-5A Quarterpath Road #242, Williamsburg, VA 23185", size: 18, font: DEFAULT_FONT })], alignment: AlignmentType.CENTER })
  );
  children.push(
    new Paragraph({ children: [new TextRun({ text: "Phone: 757-220-5051 Fax: 757-273-6198", size: 18, font: DEFAULT_FONT })], alignment: AlignmentType.CENTER })
  );
  children.push(new Paragraph({ children: [new PageBreak()] }));
}

async function addContentsPageContent(children) {
  const contentParagraphs = [];
  contentParagraphs.push(
    new Paragraph({
      children: [new TextRun({ text: "Contents of Report:", bold: true, size: 24, font: DEFAULT_FONT, color: BRAND_BLUE })],
      spacing: { after: 200 },
      indent: { left: 720 },
    })
  );
  const mainSectionStyle = { size: 20, font: DEFAULT_FONT };
  [
    "Client Information",
    "Mechanism and History of Injury",
    "Pain & Symptom Illustration",
    "Referral Questions",
    "Conclusions",
    "Functional Abilities Determination and Job Match Results",
    "Test Data:",
  ].forEach((t) => contentParagraphs.push(new Paragraph({ children: [new TextRun({ text: t, ...mainSectionStyle })], spacing: { after: 100 }, indent: { left: 720 } })));
  const bullets = [
    "Activity Overview",
    "Extremity Strength",
    "Occupational Tasks",
    "Range of Motion (Spine)",
    "Whole Body Strength",
  ];
  bullets.forEach((b) => contentParagraphs.push(new Paragraph({ children: [new TextRun({ text: "\u25E6 " + b, size: 20, font: DEFAULT_FONT })], spacing: { after: 50 }, indent: { left: 1440, firstLine: 0 } })));
  contentParagraphs.push(new Paragraph({ children: [new TextRun({ text: "Appendix One: Reference Charts", ...mainSectionStyle })], spacing: { after: 100 }, indent: { left: 720 } }));
  contentParagraphs.push(new Paragraph({ children: [new TextRun({ text: "Appendix Two: Digital Library", ...mainSectionStyle })], indent: { left: 720 } }));

  const verticalLineTable = new Table({
    margins: { left: 1200, top: 200 },
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
        children: [
          new TableCell({ width: { size: 2, type: WidthType.PERCENTAGE }, borders: { right: { style: BorderStyle.SINGLE, size: 1, color: "000000" } }, children: [new Paragraph("")] }),
          new TableCell({ width: { size: 98, type: WidthType.PERCENTAGE }, children: contentParagraphs, margins: { left: 300 } }),
        ],
      }),
    ],
  });
  children.push(verticalLineTable);
  children.push(new Paragraph({ children: [new PageBreak()] }));
}

async function addClientInformationContent(children, tests, claimantData, clientProfileData) {
  const headerLines = [
    "Functional Abilities Determination",
    "MedSource",
    "1490-5A Quarterpath Road #242, Williamsburg, VA 23185",
    "Phone: 757-220-5051 Fax: 757-273-6198",
  ];
  const clientInfoRowsData = [
    ["Name", "Adam, Keith Strain", "ID", "65712"],
    ["Address", "P.O. Box 255", "DOB (Age)", "12/01/1983 (27)"],
    ["", "Barhamsville, VA 23011-0255", "Gender", "M"],
    ["Home Phone", "804-832-1912", "Height", "71 in"],
    ["Work Phone", "n/a", "Weight", "200 lb"],
    ["Occupation", "Selector/Resort/Carton Assembly", "Dominant Hand", "R"],
    ["Employer(SIC)", "Owens Illinois", "Referred By", "Owens Illinois"],
    ["Insurance", "Employer Directed", "Resting Pulse", "Norm"],
    ["Physician", "Dr. M. Levine / Dr. Moore", "BP Sitting", "Norm"],
    ["", "", "Tested By", "R.Gagne,EET,NADEP"],
  ];

  const buffer = await fetchImageBuffer(clientProfileData.logo);
  if (buffer) {
    children.push(
      new Paragraph({ children: [new ImageRun({ data: buffer, transformation: { width: 60, height: 60 } })], alignment: AlignmentType.CENTER, spacing: { after: 0 } })
    );
  }
  headerLines.forEach((line, idx) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: line, bold: true, color: line.startsWith("Functional") ? BRAND_BLUE : "000000", size: idx === 0 ? 24 : idx === 1 ? 20 : 18 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: idx === headerLines.length - 1 ? 10 : 5 },
      })
    );
  });

  const noBorders = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  };

  const bodyImageUrl = "https://images.pexels.com/photos/5155762/pexels-photo-5155762.jpeg?auto=compress&cs=tinysrgb&w=600";
  const bodyDiagramBackBuffer = await fetchImageBuffer(bodyImageUrl);

  const legendTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: [createTableCellForPain("Area of Primary Concern", true, "FFFF99")] }),
      new TableRow({ children: [createColoredSymbolCell("P1    Primary")] }),
      new TableRow({ children: [createColoredSymbolCell("P2    Secondary")] }),
      new TableRow({ children: [createTableCellForPain("Pain Indicator", true, "FFFF99")] }),
      new TableRow({ children: [createColoredSymbolCell("~    Primary")] }),
      new TableRow({ children: [createColoredSymbolCell("/    Shooting")] }),
      new TableRow({ children: [createColoredSymbolCell("x    Burning")] }),
      new TableRow({ children: [createColoredSymbolCell("•    Pins and Needles")] }),
      new TableRow({ children: [createColoredSymbolCell("o    Numbness")] }),
      new TableRow({ children: [createTableCellForPain("General", true, "FFFF99")] }),
      new TableRow({ children: [createColoredSymbolCell("T    Temperature")] }),
      new TableRow({ children: [createColoredSymbolCell("SW   Swelling")] }),
      new TableRow({ children: [createColoredSymbolCell("S    Scar")] }),
      new TableRow({ children: [createColoredSymbolCell("C    Crepitus")] }),
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

  const clientInfoTable = new Table({
    borders: noBorders,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: clientInfoRowsData.map(
      (row) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row[0], bold: true, size: 20 })] })], borders: noBorders }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row[1], size: 20 })] })], borders: noBorders }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row[2], bold: true, size: 20 })] })], borders: noBorders }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row[3], size: 20 })] })], borders: noBorders }),
          ],
        })
    ),
    layout: TableLayoutType.AUTOFIT,
    borders: { ...noBorders, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
    spacing: { after: 0 },
  });

  const sampleImageBuffer = await getSampleImageBuffer();

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 20, type: WidthType.PERCENTAGE },
              borders: noBorders,
              children: [
                new Paragraph({ children: [new TextRun({ text: "Report Date: 11/3/2011", bold: true })], alignment: AlignmentType.LEFT, spacing: { after: 20 } }),
                sampleImageBuffer
                  ? new Paragraph({ children: [new ImageRun({ data: sampleImageBuffer, transformation: { width: 100, height: 100 } })], alignment: AlignmentType.START, spacing: { after: 10 } })
                  : new Paragraph({ children: [new TextRun({ text: "[Photo Placeholder]" })], alignment: AlignmentType.START, spacing: { after: 10 } }),
                new Paragraph({ children: [new TextRun({ text: "Adam, Keith Strain" })], alignment: AlignmentType.START }),
              ],
              verticalAlign: "top",
            }),
            new TableCell({
              width: { size: 80, type: WidthType.PERCENTAGE },
              verticalAlign: "top",
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.NONE } },
              margins: { left: 100, top: 0, bottom: 0, right: 0 },
              children: [
                new Paragraph({ children: [new TextRun({ text: "Client Information", bold: true, color: BRAND_BLUE, size: 20 })] }),
                clientInfoTable,
                new Paragraph({ children: [new TextRun({ text: "Mechanism and History of Injury", bold: true, color: BRAND_BLUE, size: 20 })] }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: noBorders,
                  rows: [
                    new TableRow({ children: [new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true, size: 20 })] })], borders: noBorders }), new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "Description", bold: true, size: 20 })] })], borders: noBorders })] }),
                    new TableRow({ children: [new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "04/2011", size: 20 })] })], borders: noBorders }), new TableCell({ width: { size: 80, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: "While working in Cartons assembly area, client noted groin pain and subsequently was diagnosed with a hernia – PT – 4-5 wks – back to work – continued to have pain – lumbar area – cortisone injection (had three injections total) – Sept 10th out of work again – to date no return to duties – last injection was Oct 4th/2011.", size: 20 })] })], borders: noBorders })] }),
                  ],
                }),
                new Paragraph({ children: [new TextRun({ text: "Pain/Symptom Illustration", bold: true, color: BRAND_BLUE, size: 20 })] }),
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: noBorders,
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 50, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: bodyDiagramBackBuffer ? [new ImageRun({ data: bodyDiagramBackBuffer, transformation: { width: 200, height: 300 } })] : [new TextRun({ text: "[Body Diagram Placeholder]", size: 20 })],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          borders: noBorders,
                        }),
                        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, children: [legendTable], borders: noBorders }),
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
  children.push(new Paragraph({ children: [new PageBreak()] }));
}

async function addReferralQuestionsContent(children) {
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "  Referral Questions", bold: true, color: "000000" })],
      alignment: AlignmentType.LEFT,
      spacing: { after: 100 },
      shading: { type: ShadingType.FILL, fill: "FFFF99" },
    })
  );

  children.push(
    new Paragraph({ children: [new TextRun({ text: "What is the present lumbar range of motion noted for the client?", bold: true })], alignment: AlignmentType.LEFT, spacing: { before: 200, after: 100 } })
  );
  const lumbarData = [
    ["Lumbar Flexion", "49 deg", "Pass", "60 deg", "82%"],
    ["Lumbar Extension", "28 deg", "Pass", "25 deg", "112%"],
    ["Lumbar Lateral Flexion - Left", "27 deg", "Pass", "25 deg", "108%"],
    ["Lumbar Lateral Flexion - Right", "29 deg", "Pass", "25 deg", "116%"],
  ];
  children.push(
    new Table({
      width: { size: 90, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER,
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Area Evaluated:", bold: true })] })], borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 1, color: "000000" } }, shading: { fill: "FFFF99" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Data:", bold: true })] })], borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 1, color: "000000" } }, shading: { fill: "FFFF99" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Valid?", bold: true })] })], borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 1, color: "000000" } }, shading: { fill: "FFFF99" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Norm:", bold: true })] })], borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 1, color: "000000" } }, shading: { fill: "FFFF99" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "% of Norm:", bold: true })] })], borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 1, color: "000000" } }, shading: { fill: "FFFF99" } }),
          ],
        }),
        ...lumbarData.map((rowData) => new TableRow({ children: rowData.map((cellData) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cellData })] })], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 1, color: "000000" } } })) })),
      ],
      borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" } },
    })
  );

  children.push(new Paragraph({ children: [new TextRun({ text: "*Slight decrease in flexion but not a limitation to return to duties.", italics: true })], alignment: AlignmentType.LEFT, spacing: { before: 50, after: 200 } }));

  const lumbarImageUrls = [
    "https://images.pexels.com/photos/5155762/pexels-photo-5155762.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/5155762/pexels-photo-5155762.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/5155762/pexels-photo-5155762.jpeg?auto=compress&cs=tinysrgb&w=300",
    "https://images.pexels.com/photos/5155762/pexels-photo-5155762.jpeg?auto=compress&cs=tinysrgb&w=300",
  ];
  const lumbarImageBuffers = await Promise.all(lumbarImageUrls.map((url) => fetchImageBuffer(url)));
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
      rows: [
        new TableRow({
          children: lumbarImageBuffers.map((buffer) =>
            new TableCell({
              children: [
                buffer
                  ? new Paragraph({ children: [new ImageRun({ data: buffer, transformation: { width: 120, height: 120 } })], alignment: AlignmentType.CENTER })
                  : new Paragraph({ children: [new TextRun({ text: "[Image Placeholder]" })], alignment: AlignmentType.CENTER }),
              ],
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              margins: { top: 0, bottom: 0, left: 10, right: 10 },
            })
          ),
        }),
      ],
    })
  );

  children.push(
    new Paragraph({ children: [new TextRun({ text: "What are the present limitations to returning to full duties as a Selector / Resorter or Carton Assembly position?", bold: true })], alignment: AlignmentType.LEFT, spacing: { before: 200, after: 100 } })
  );
  children.push(
    new Paragraph({ children: [new TextRun({ text: "Client demonstrated the ability to bi-manual handle, had above average pinch and hand grip, client had average total spine and norm extremity range of motion, had ability to balance, sit and stand in more than 60 minute intervals, walk and stair climb at a competitive pace and demonstrated the ability to dynamically lift from the floor to waist at a level of 35lbs and from the waist to the shoulder height at 35lbs both at an Occasional Level. Furthermore the client demonstrated that he could carry 35lbs over distance at an average competitive rate. The client was able to perform pick and place extended sustained reach activities (with weight to simulate bottle transfer and sorting) as well as bend and rise to full extension with a 25lb weight. The client displayed the ability to push / pull 50 to 80lbs statically and to perform simulated duties lifting above shoulder height with weights to 35lbs. Client did complain of a mild discomfort post activities, but this was not a hindrance in completing the set tasks." })], alignment: AlignmentType.LEFT, spacing: { after: 100 } })
  );
  children.push(
    new Paragraph({ children: [new TextRun({ text: "The tasks that included extended sustained and repetitive reaching created the most discomfort for the client and this function is primarily in the Carton Assembly where the separation inserts are placed in the boxes. If possible this task could be avoided to ensure full recovery. The other two job positions; Selector and Resort station have no limitations." })], alignment: AlignmentType.LEFT, spacing: { after: 100 } })
  );
  children.push(new Paragraph({ children: [new TextRun({ text: "*Refer to Digital Library at end of report.", italics: true })], alignment: AlignmentType.LEFT, spacing: { before: 50, after: 200 } }));
  children.push(
    new Paragraph({ children: [new TextRun({ text: "What accommodations could be made to the workplace to provide increased abilities/comfort to the client in his present condition?", bold: true })], alignment: AlignmentType.LEFT, spacing: { before: 200, after: 100 } })
  );
  children.push(new Paragraph({ children: [new TextRun({ text: "No accommodations for Presort or Selector positions only accommodation is frequent breaks for placement of separation inserts during Carton Assembly position to prevent discomfort." })], alignment: AlignmentType.LEFT, spacing: { after: 100 } }));
  children.push(
    new Paragraph({ children: [new TextRun({ text: "What would be the Physical Demand Classification for this client?", bold: true })], alignment: AlignmentType.LEFT, spacing: { before: 200, after: 100 } })
  );
  children.push(new Paragraph({ children: [new TextRun({ text: "*Medium which is in line with full return to duties.", italics: true })], alignment: AlignmentType.LEFT, spacing: { before: 50, after: 200 } }));
  children.push(new Paragraph({ children: [new TextRun({ text: "*Scroll down to view the Physical Demand Classification Chart.", italics: true })], alignment: AlignmentType.LEFT, spacing: { before: 50, after: 200 } }));
  children.push(new Paragraph({ children: [new PageBreak()] }));
}

async function addConclusionsContent(children) {
  children.push(
    new Paragraph({ children: [new TextRun({ text: "  Conclusions", bold: true })], alignment: AlignmentType.LEFT, shading: { type: ShadingType.FILL, fill: "FFFF99" }, spacing: { before: 100, after: 50 } })
  );
  const paras = [
    "Client has displayed all necessary abilities for a full return to duties. The client was consistent in performance and provided reliable effort throughout the tasks. The client participated in all tasks necessary for the job testing requirement. The client is able to work at a Medium Duty Level which is rated at that required for full return to work for the Selector and Presorter positions based on ONET/DOT and client reported essential duties as well as the provided job demands analysis. The only limitation is noted for the Carton Assembly position which may require frequent breaks when placing the individual separators in the boxes.",
    "Client has by omission not actively participated ion any at home exercise program for the back and therefore a standard protocol has been attached for Employer review and direction",
    "Client has displayed all necessary abilities for a full return to duties. The client was consistent in performance and provided reliable effort throughout the tasks. The client participated in all tasks necessary for the job testing requirement. The client is able to work at a Medium Duty Level which is rated at that required for full return to work for the Selector and Presorter positions based on ONET/DOT and client reported essential duties as well as the provided job demands analysis. The only limitation is noted for the Carton Assembly position which may require frequent breaks when placing the individual separators in the boxes.",
    "Client has displayed all necessary abilities for a full return to duties. The client was consistent in performance and provided reliable effort throughout the tasks. The client participated in all tasks necessary for the job testing requirement. The client is able to work at a Medium Duty Level which is rated at that required for full return to work for the Selector and Presorter positions based on ONET/DOT and client reported essential duties as well as the provided job demands analysis. The only limitation is noted for the Carton Assembly position which may require frequent breaks when placing the individual separators in the boxes.",
  ];
  paras.forEach((t) => children.push(new Paragraph({ children: [new TextRun({ text: t, size: 18 })], alignment: AlignmentType.LEFT, spacing: { after: 50 } })));
  children.push(
    new Paragraph({ children: [new TextRun({ text: "  Signature of Evaluator", bold: true })], alignment: AlignmentType.LEFT, shading: { type: ShadingType.FILL, fill: "FFFF99" }, spacing: { before: 100, after: 200 } })
  );
  children.push(new Paragraph({ children: [new TextRun({ text: "___________________________", underline: { type: UnderlineType.SINGLE } })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "Date: Nov. 03/2011", size: 18 })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "Ray Gagne, EET, CFE, NADEP", size: 18 })] }));
  children.push(new Paragraph({ children: [new PageBreak()] }));
}

async function addTestResultsContent(children) {
  children.push(new Paragraph({ children: [new TextRun({ text: "Functional Abilities Determination and Job Match Results", bold: true, color: BRAND_BLUE, size: 28 })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "Test Results:", bold: true, size: 24 })] }));
  const testResultsData = [
    { category: "", data: [["Client Interview Test", "N/A", "", "45 min", "", "", ""], ["Activity Overview", "11/3/2011", "", "", "5 min", "", ""]] },
    { category: "Extremity Strength", data: [["Hand Grip Standard, Position 2", "11/3/2011", "L=127.33 R=119.67", "5 min", "", "", ""], ["Hand Grip Rapid Exchange", "11/3/2011", "L=122.83 R=119.67", "5 min", "", "", ""], ["Pinch Key", "11/3/2011", "L=27.67 R=29.67", "5 min", "", "", ""], ["Pinch Tip", "11/3/2011", "L=16.33 R=15.67", "5 min", "", "", ""], ["Pinch Palmar", "11/3/2011", "L=23.67 R=28.33", "5 min", "", "", ""]] },
    { category: "Occupational Tasks", data: [["Balance", "11/3/2011", "%IS=113.8", "", "5 min", "", ""], ["Walk", "11/3/2011", "%IS=125.93", "", "5 min", "", ""], ["Bi-Manual Handling", "11/3/2011", "%IS=116.73", "", "5 min", "", ""], ["Carry (35lbs)", "11/3/2011", "%IS=104.93", "", "5 min", "", ""], ["Stair Climb", "11/3/2011", "%IS=100.90", "", "5 min", "", ""]] },
    { category: "Range of Motion (Spine)", data: [["Lumbar Flexion/Extension", "11/3/2011", "F=48.67 E=28.33", "", "5 min", "", ""], ["Lumbar Lateral Flexion", "11/3/2011", "L=26.67 R=28.67", "", "5 min", "", ""]] },
    { category: "Whole Body Strength", data: [["Static Low Lift", "11/3/2011", "92.67 lbs", "", "5 min", "", ""], ["Static Push", "11/3/2011", "82.67 lbs", "", "5 min", "", ""], ["Static Pull", "11/3/2011", "56.67 lbs", "", "5 min", "", ""], ["Static Mid Lift", "11/3/2011", "82.33 lbs", "", "5 min", "", ""], ["Static High Lift", "11/3/2011", "135.67 lbs", "", "5 min", "", ""], ["Dynamic Lift, Low", "11/3/2011", "35 lbs Frequent", "", "5 min", "", ""], ["Dynamic Lift, Medium", "11/3/2011", "35 lbs Frequent", "", "5 min", "", ""], ["Dynamic Lift, Overhead", "11/3/2011", "35 lbs Frequent", "", "5 min", "", ""]] },
  ];
  let totalSit = 0;
  let totalStand = 0;
  for (const section of testResultsData) {
    for (const row of section.data) {
      const sit = parseFloat(row[3]) || 0;
      const stand = parseFloat(row[4]) || 0;
      totalSit += sit;
      totalStand += stand;
    }
  }
  const rows = [];
  rows.push(
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Activity Tested", bold: true, size: 18 })] })], shading: { fill: "FFFF99" } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Date/Time", bold: true, size: 18 })] })], shading: { fill: "FFFF99" } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Test Results", bold: true, size: 18 })] })], shading: { fill: "FFFF99" } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Sit Time", bold: true, size: 18 })] })], shading: { fill: "FFFF99" } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Stand Time", bold: true, size: 18 })] })], shading: { fill: "FFFF99" } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Job Demands", bold: true, size: 18 })] })], shading: { fill: "FFFF99" } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Job Match", bold: true, size: 18 })] })], shading: { fill: "FFFF99" } }),
      ],
    })
  );
  for (const section of testResultsData) {
    if (section.category.trim() !== "") {
      rows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: section.category, bold: true, size: 18 })] })], columnSpan: 7, shading: { fill: "D0E7FF" } })] }));
    }
    for (const rowData of section.data) {
      rows.push(new TableRow({ children: rowData.map((cell) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 18 })] })] })) }));
    }
  }
  rows.push(
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true, size: 18 })] })], columnSpan: 3, shading: { fill: "DDDDDD" } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${totalSit.toFixed(0)} min`, bold: true, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${totalStand.toFixed(0)} min`, bold: true, size: 18 })] })] }),
        new TableCell({ children: [new Paragraph({})] }),
        new TableCell({ children: [new Paragraph({})] }),
      ],
    })
  );
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
  children.push(new Paragraph({ children: [new TextRun({ text: "Legend: L=Left, R=Right, F=Flexion, E=Extension, %IS=% Industrial Standard, JD=Job Demands, JM=Job Match", size: 16 })] }));
  children.push(new Paragraph({ children: [new PageBreak()] }));
}

async function addAppendixReferenceChartsContent(children) {
  children.push(new Paragraph({ children: [new TextRun({ text: "Appendix One- Reference Charts", bold: true, color: BRAND_BLUE, size: 28 })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "Perceived Exertion and Pain Scales", bold: true, size: 24 })] }));
  const perceivedExertionData = [["no exertion at all", "6", "69", "77", "91"], ["extremely light", "7", "76", "85", "101"], ["", "8", "83", "93", "111"], ["very light", "9", "89", "101", "122"], ["", "10", "96", "110", "132"], ["light", "11", "103", "118", "142"], ["", "12", "110", "126", "153"], ["somewhat hard", "13", "116", "135", "163"], ["", "14", "123", "143", "173"], ["hard (heavy)", "15", "130", "151", "184"], ["", "16", "137", "159", "194"], ["very hard", "17", "143", "168", "204"], ["", "18", "150", "176", "215"], ["extremely hard", "19", "157", "184", "225"], ["maximal exertion", "20", "164", "193", "235" ]];
  const rows = [];
  rows.push(new TableRow({ children: ["Perceived Exertion", "Rating (RPE)", "Minimal Heart Rate", "Mean Heart Rate", "Maximal Heart Rate"].map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18 })] })], shading: { fill: "FFFF99" } })) }));
  perceivedExertionData.forEach((r) => rows.push(new TableRow({ children: r.map((c) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, size: 18 })] })] })) })));
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
  children.push(new Paragraph({ children: [new TextRun({ text: "*Borg G. Borg's Perceived Exertion and Pain Scales. Human Kinetics. 1998.", size: 14, italics: true })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "Physical Demand Characteristics of Work", bold: true, color: BRAND_BLUE, size: 24 })] }));
  const pdc = [["Sedentary", "1 - 10 lbs.", "Negligible", "Negligible"], ["Light", "11 - 20 lbs.", "1 - 10 lbs.", "Negligible"], ["Medium", "21 - 50 lbs.", "11 - 25 lbs.", "1 - 10 lbs."], ["Heavy", "51 - 100 lbs.", "26 - 50 lbs.", "11 - 20 lbs."], ["Very Heavy", "Over 100 lbs.", "Over 50 lbs.", "Over 20 lbs."]];
  const rows2 = [];
  rows2.push(new TableRow({ children: ["Physical Demand Level", "OCCASIONAL\n0-33% of the workday", "FREQUENT\n34-66% of the workday", "CONSTANT\n67-100% of the workday"].map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18 })] })], shading: { fill: "FFFF99" } })) }));
  pdc.forEach((r) => rows2.push(new TableRow({ children: r.map((c) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, size: 18 })] })] })) })));
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows2 }));
  children.push(new Paragraph({ children: [new PageBreak()] }));
}

async function addPDCAndDynamicLiftContent(children) {
  children.push(new Paragraph({ children: [new TextRun({ text: "PDC Categories based on Sustainable Energy Level", bold: true, color: BRAND_BLUE, size: 28 })] }));
  const pdcCategoriesData = [["Sedentary", "< 1.7 Kcal/min"], ["Light", "1.7 to 3.2 Kcal/min"], ["Medium", "3.3 to 5.7 Kcal/min"], ["Heavy", "5.8 to 8.2 Kcal/min"], ["Very Heavy", "8.3 or more Kcal/min"]];
  const rows = [];
  rows.push(new TableRow({ children: ["PDC Category", "Sustainable Energy Level"].map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18 })] })], shading: { fill: "FFFF99" } })) }));
  pdcCategoriesData.forEach((r) => rows.push(new TableRow({ children: r.map((c) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, size: 18 })] })] })) })));
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
  children.push(new Paragraph({ children: [new TextRun({ text: "General Patterns of Activity Descriptors", bold: true, color: BRAND_BLUE, size: 24 })] }));
  const descs = [
    ["(S) Sedentary Work", " Exerting up to 10 lb of force occasionally and/or a negligible amount of force frequently to lift, carry, push, pull, or otherwise move objects, including the human body. Sedentary work involves sitting most of the time but may involve walking or standing for brief periods of time. Jobs are sedentary if walking and standing are required only occasionally and all other sedentary criteria are met."],
    ["(L) Light Work", " Exerting up to 20 lb of force occasionally, and/or up to 10 lb of force frequently and/or a negligible amount of force constantly to move objects. Physical demand requirements are in excess of those for sedentary work. Even though the weight lifted may be only negligible, a job should be rated light work: (1) when it requires walking or standing to a significant degree; or (2) when it requires sitting most of the time but entails pushing and/or pulling of arm or leg controls; and/or (3) when the job requires working at a production rate pace entailing the constant pushing and/or pulling of materials even though the weight of those materials is negligible. Note: The constant stress and strain of maintaining a production rate pace, especially in an industrial setting, is physically exhausting."],
    ["(M) Medium Work", " Exerting 20 to 50 lb of force occasionally, and/or 10 to 25 lb of force frequently, and/or greater than negligible up to 10 lb of force constantly to move objects. Physical demand requirements are in excess of those for light work."],
    ["(H) Heavy Work", " Exerting 50 to 100 lb of force occasionally, and/or 25 to 50 lb of force frequently, and/or 10 to 20 lb of force constantly to move objects, physical demand requirements are in excess of those for medium work."],
  ];
  for (const [t, d] of descs) {
    children.push(new Paragraph({ children: [new TextRun({ text: t, bold: true, size: 18 }), new TextRun({ text: d, size: 18 })] }));
  }
  children.push(new Paragraph({ children: [new TextRun({ text: '"***Occasionally" indicates that an activity or condition exists up to one third of the time; "frequently" indicates that an activity or condition exists from one third to two thirds of the time; "constantly" indicates that an activity or condition exists two thirds or more of the time.', size: 14, italics: true })] }));
  children.push(new Paragraph({ children: [new TextRun({ text: "Dynamic Lift Test End Point Conditions", bold: true, color: BRAND_BLUE, size: 24 })] }));
  const dynamicLiftData = [
    ["Psychophysical", "Voluntary test termination by the claimant based on complaints of fatigue, excessive discomfort, or inability to complete the required number of movements during the testing interval (cycle)."],
    ["Physiological", "Achievement of an age-determined target heart rate (based on a percent of claimant's maximal heart rate - normally 85%, or in excess of 75% continuously for one minute)."],
    ["Safety", "Achievement of a predetermined anthropometric safe lifting limit based on the claimant's adjusted body weight; or intervention by the FACTS evaluator based upon an evaluation of the claimant's signs & symptoms."],
  ];
  const rows3 = [];
  rows3.push(new TableRow({ children: ["CONDITION", "DESCRIPTION"].map((h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18 })] })], shading: { fill: "FFFF99" } })) }));
  dynamicLiftData.forEach((r) => rows3.push(new TableRow({ children: r.map((c) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, size: 18 })] })] })) })));
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: rows3 }));
  children.push(new Paragraph({ children: [new PageBreak()] }));
}

async function addDigitalLibraryContent(children) {
  children.push(new Paragraph({ children: [new TextRun({ text: "Appendix Two: Digital Library", bold: true, color: BRAND_BLUE, size: 28 })] }));
  const imageUrl = "https://images.pexels.com/photos/5155762/pexels-photo-5155762.jpeg?auto=compress&cs=tinysrgb&w=300";
  const imageBuffer = await fetchImageBuffer(imageUrl);
  const imageNames = [];
  for (let i = 1673; i <= 1696; i++) imageNames.push(`SDC${i}.JPG`);
  const imagesPerRow = 6;
  const totalImages = imageNames.length;
  const numRows = Math.ceil(totalImages / imagesPerRow);
  const imageTableRows = [];
  for (let i = 0; i < numRows; i++) {
    const rowChildren = [];
    for (let j = 0; j < imagesPerRow; j++) {
      const idx = i * imagesPerRow + j;
      rowChildren.push(
        idx < totalImages
          ? new TableCell({
              children: [
                new Paragraph({ children: [imageBuffer ? new ImageRun({ data: imageBuffer, transformation: { width: 80, height: 80 } }) : new TextRun({ text: "[Image Placeholder]" })], alignment: AlignmentType.CENTER }),
                new Paragraph({ children: [new TextRun({ text: imageNames[idx], size: 16 })], alignment: AlignmentType.CENTER, spacing: { after: 10 } }),
              ],
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              margins: { left: 10, right: 10 },
            })
          : new TableCell({ children: [new Paragraph("")], borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } })
      );
    }
    imageTableRows.push(new TableRow({ children: rowChildren }));
  }
  children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: imageTableRows, borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } } }));
  children.push(new Paragraph({ children: [new PageBreak()] }));
}
const router = express.Router();

router.post("/", async(claimantData, clientProfileData, tests)=> {
  if (!Array.isArray(tests)) throw new Error("Invalid or missing 'tests' array.");
  const children = [];
  await addCoverPageContent(children, claimantData, clientProfileData);
  await addContentsPageContent(children);
  await addClientInformationContent(children, tests, claimantData, clientProfileData);
  await addReferralQuestionsContent(children);
  await addConclusionsContent(children);
  await addTestResultsContent(children);
  await addAppendixReferenceChartsContent(children);
  await addPDCAndDynamicLiftContent(children);
  await addDigitalLibraryContent(children);
  const doc = new Document({
    title: "Functional Abilities Determination",
    description: "Patient Report with Test Results",
    sections: [
      {
        properties: {
          page: {
            margin: { top: convertInchesToTwip(1.0), right: convertInchesToTwip(1.0), bottom: convertInchesToTwip(1.0), left: convertInchesToTwip(1.0) },
            size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11.0) },
          },
        },
        children,
      },
    ],
  });
  return await Packer.toBuffer(doc);
});

module.exports = router;

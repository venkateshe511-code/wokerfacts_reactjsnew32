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
  VerticalAlign,
  TableLayoutType,
  PageBreak,
  HeadingLevel,
} = require("docx");

const router = express.Router();

router.use(cors({
  origin: "*",
  methods: ["POST"],
  allowedHeaders: ["Content-Type"]
}));

router.post("/", async (req, res) => {
  const {
    claimantName = "Anonymous",
    claimNumber = "CLM000000",
    evaluationDate = "01/01/2025",
    logoPath = null,
    clinicName = "MedSource",
    clinicAddress = "1490-5A Quarterpath Road #242, Williamsburg, VA  23185",
    clinicPhone = "757-220-5051",
    clinicFax = "757-273-6198",
    claimantData = {},
    painIllustrationData = {},
    activityRatingData = {},
    referralQuestionsData = {},
    protocolTestsData = {},
    testData = {},
    digitalLibraryData = {},
    paymentData = {},
    reportSummary = {}
  } = req.body;

  try {
    console.log("=== CLOUD FUNCTION DEBUG START ===");
    console.log("Received claimantName:", claimantName);
    console.log("Received testData:", JSON.stringify(testData, null, 2));
    console.log("Test data length:", testData.tests?.length || 0);
    console.log("Activity data length:", activityRatingData.activities?.length || 0);
    console.log("Referral questions length:", referralQuestionsData.questions?.length || 0);
    console.log("Protocol tests length:", protocolTestsData.selectedTests?.length || 0);
    console.log("Digital library length:", digitalLibraryData.savedFileData?.length || 0);

    const children = [];

    // Helper functions
    const calculateAge = (birthDate) => {
      if (!birthDate) return 0;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const getPhysicalDemandLevel = (activities) => {
      if (!activities || activities.length === 0) return "Medium";
      const avgRating = activities.reduce((sum, activity) => sum + (activity.rating || 0), 0) / activities.length;
      if (avgRating >= 8) return "Heavy";
      if (avgRating >= 6) return "Medium";
      if (avgRating >= 4) return "Light";
      return "Sedentary";
    };

    // Create blue header style
    const createBlueHeader = (text) => new Paragraph({
      children: [
        new TextRun({
          text: text,
          bold: true,
          color: "4472C4",
          size: 24,
        }),
      ],
      spacing: { before: 240, after: 240 },
    });

    // Create borderless table cell
    const createBorderlessCell = (text, bold = false) => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: text, bold: bold })],
      })],
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE }
      },
    });

    // ----- COVER PAGE -----
    if (logoPath && fs.existsSync(logoPath)) {
      const imageBuffer = fs.readFileSync(path.resolve(logoPath));
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({ data: imageBuffer, transformation: { width: 120, height: 60 } })],
        })
      );
    } else {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: clinicName,
              bold: true,
              color: "4472C4",
              size: 32,
            }),
          ],
        })
      );
    }

    children.push(
      new Paragraph({
        spacing: { before: 200, after: 200 },
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "Functional Abilities Determination",
            bold: true,
            color: "4472C4",
            size: 28,
          }),
        ],
      })
    );

    // Claimant Information Table (Cover Page)
    const coverInfoTable = new Table({
      rows: [
        new TableRow({
          children: [
            createBorderlessCell("Claimant Name:", true),
            createBorderlessCell(`${claimantData.lastName || ""}, ${claimantData.firstName || ""}`, true),
          ],
        }),
        new TableRow({
          children: [
            createBorderlessCell("Claimant #:", true),
            createBorderlessCell(claimNumber),
          ],
        }),
        new TableRow({
          children: [
            createBorderlessCell("Date of Evaluation(s):", true),
            createBorderlessCell(evaluationDate),
          ],
        }),
      ],
      width: { size: 100, type: WidthType.PERCENTAGE },
      alignment: AlignmentType.CENTER,
    });

    children.push(coverInfoTable);

    // Footer Information
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 120 },
        children: [
          new TextRun({
            text: "CONFIDENTIAL INFORMATION ENCLOSED",
            bold: true,
            size: 18,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: clinicName,
            bold: true,
            size: 16,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: clinicAddress,
            size: 16,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: `Phone: ${clinicPhone}    Fax: ${clinicFax}`,
            size: 16,
          }),
        ],
      })
    );

    children.push(new PageBreak());

    // ----- TABLE OF CONTENTS -----
    children.push(
      createBlueHeader("Contents of Report"),
      new Paragraph({
        children: [new TextRun({ text: "Claimant Information", size: 20 })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Pain Illustration", size: 20 })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Functional Activity Rating", size: 20 })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Referral Questions", size: 20 })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Protocol & Tests", size: 20 })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Test Data & Results", size: 20 })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Comments Demonstrated Perceived", size: 20 })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Comments Job Requirements", size: 20 })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Tested Activities", size: 20 })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Individual Test Results", size: 20 })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Appendix One: Reference Charts", size: 20 })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: "Appendix Two: Digital Library", size: 20 })],
        spacing: { after: 120 },
      })
    );

    children.push(new PageBreak());

    // ----- DETAILED CLAIMANT INFORMATION -----
    children.push(createBlueHeader("Claimant Information"));

    const detailedInfoTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "First Name:", bold: true })] })],
              width: { size: 30, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: claimantData.firstName || "N/A" })] })],
              width: { size: 70, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Last Name:", bold: true })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: claimantData.lastName || "N/A" })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Date of Birth:", bold: true })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: claimantData.dateOfBirth || "N/A" })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Age:", bold: true })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: calculateAge(claimantData.dateOfBirth).toString() + " years" })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Gender:", bold: true })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: claimantData.gender || "N/A" })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Height:", bold: true })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: claimantData.height || "N/A" })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Weight:", bold: true })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: claimantData.weight || "N/A" })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Occupation:", bold: true })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: claimantData.occupation || "N/A" })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Education:", bold: true })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: claimantData.education || "N/A" })] })],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: "Hand Dominance:", bold: true })] })],
            }),
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: claimantData.handDominance || "Right" })] })],
            }),
          ],
        }),
      ],
    });

    children.push(detailedInfoTable);

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Claimant History:",
            bold: true,
            size: 22,
          }),
        ],
        spacing: { before: 240, after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: claimantData.claimantHistory || "While working in assembly area, client noted pain and was subsequently diagnosed with work-related injury. Client reports ongoing symptoms affecting work capacity and daily activities. FCE requested to determine current functional abilities and return-to-work status.",
            size: 20,
          }),
        ],
        spacing: { after: 240 },
      })
    );

    children.push(new PageBreak());

    // ----- PAIN ILLUSTRATION -----
    if (painIllustrationData.painLevel || painIllustrationData.description) {
      children.push(
        createBlueHeader("Pain Illustration"),
        new Paragraph({
          children: [
            new TextRun({
              text: "The claimant was asked to mark areas of pain and discomfort on the body diagram below:",
              size: 20,
            }),
          ],
          spacing: { after: 240 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Pain Level: ${painIllustrationData.painLevel || "Not specified"}`,
              bold: true,
              size: 20,
            }),
          ],
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Description: ${painIllustrationData.description || "No description provided"}`,
              size: 20,
            }),
          ],
          spacing: { after: 240 },
        })
      );

      children.push(new PageBreak());
    }

    // ----- FUNCTIONAL ACTIVITY RATING -----
    if (activityRatingData.activities && activityRatingData.activities.length > 0) {
      children.push(
        createBlueHeader("Functional Activity Rating"),
        new Paragraph({
          children: [
            new TextRun({
              text: "The following activities were rated by the claimant on a scale of 1-10 (1 = No difficulty, 10 = Unable to perform):",
              size: 20,
            }),
          ],
          spacing: { after: 240 },
        })
      );

      const activityTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Activity", bold: true })] })],
                width: { size: 70, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Rating", bold: true })] })],
                width: { size: 30, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
          ...activityRatingData.activities.map((activity) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: activity.name || "Unknown Activity" })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: activity.rating?.toString() || "Not rated" })] })],
                }),
              ],
            })
          ),
        ],
      });

      children.push(
        activityTable,
        new Paragraph({
          children: [
            new TextRun({
              text: `Physical Demand Level Assessment: ${getPhysicalDemandLevel(activityRatingData.activities)}`,
              bold: true,
              size: 20,
            }),
          ],
          spacing: { before: 240, after: 240 },
        })
      );

      children.push(new PageBreak());
    }

    // ----- REFERRAL QUESTIONS -----
    if (referralQuestionsData.questions && referralQuestionsData.questions.length > 0) {
      children.push(createBlueHeader("Referral Questions"));

      referralQuestionsData.questions.forEach((question, index) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${index + 1}. ${question.question || ""}`,
                bold: true,
                size: 20,
              }),
            ],
            spacing: { before: 240, after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: question.answer || "No answer provided",
                size: 18,
              }),
            ],
            spacing: { after: 240 },
          })
        );
      });

      children.push(new PageBreak());
    }

    // ----- PROTOCOL & TESTS -----
    if (protocolTestsData.selectedTests && protocolTestsData.selectedTests.length > 0) {
      children.push(
        createBlueHeader("Protocol & Tests"),
        new Paragraph({
          children: [
            new TextRun({
              text: "The following tests and protocols were administered during the evaluation:",
              size: 20,
            }),
          ],
          spacing: { after: 240 },
        })
      );

      protocolTestsData.selectedTests.forEach((test) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${test}`,
                size: 18,
              }),
            ],
            spacing: { after: 120 },
          })
        );
      });

      children.push(new PageBreak());
    }

    // ----- TEST DATA & RESULTS -----
    console.log("Checking TEST DATA section:", testData.tests?.length || 0, "tests");
    if (testData.tests && testData.tests.length > 0) {
      console.log("✓ Generating TEST DATA & RESULTS section");
      children.push(
        createBlueHeader("Test Data & Results"),
        new Paragraph({
          children: [
            new TextRun({
              text: "Individual Test Results:",
              bold: true,
              size: 20,
            }),
          ],
          spacing: { before: 240, after: 120 },
        })
      );

      testData.tests.forEach((test, index) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${index + 1}. ${test.testName || "Unknown Test"}`,
                bold: true,
                size: 18,
              }),
            ],
            spacing: { before: 240, after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Result: ${test.result || "No result recorded"}`,
                size: 16,
              }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Comments: ${test.comments || "No comments"}`,
                size: 16,
              }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Effort: ${test.effort || "Not specified"}`,
                size: 16,
              }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Demonstrated: ${test.demonstrated ? "Yes" : "No"}`,
                size: 16,
              }),
            ],
            spacing: { after: 120 },
          })
        );
      });

      children.push(new PageBreak());
    }

    // ----- COMMENTS DEMONSTRATED PERCEIVED -----
    console.log("Checking COMMENTS DEMONSTRATED section:", testData.tests?.length || 0, "tests");
    if (testData.tests && testData.tests.length > 0) {
      console.log("✓ Generating COMMENTS DEMONSTRATED PERCEIVED section");
      const testsWithComments = testData.tests.filter((test) => test.comments && test.comments.trim());

      children.push(
        createBlueHeader("Comments Demonstrated Perceived"),
        new Paragraph({
          children: [
            new TextRun({
              text: "Additional comments and observations from the evaluation process:",
              size: 20,
            }),
          ],
          spacing: { after: 240 },
        })
      );

      if (testsWithComments.length > 0) {
        testsWithComments.forEach((test) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${test.testName} - Comments:`,
                  bold: true,
                  size: 18,
                }),
              ],
              spacing: { before: 180, after: 120 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: test.comments,
                  size: 16,
                }),
              ],
              spacing: { after: 180 },
            })
          );
        });
      } else {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "No additional test-specific comments were recorded during the evaluation process.",
                italic: true,
                size: 16,
              }),
            ],
            spacing: { after: 240 },
          })
        );
      }

      children.push(new PageBreak());
    }

    // ----- COMMENTS JOB REQUIREMENTS -----
    console.log("Checking JOB REQUIREMENTS section:", testData.tests?.length || 0, "tests");
    if (testData.tests && testData.tests.length > 0) {
      console.log("✓ Generating COMMENTS JOB REQUIREMENTS section");
      const testsWithJobRequirements = testData.tests.filter((test) => test.jobRequirements && test.jobRequirements.trim());

      children.push(
        createBlueHeader("Comments Job Requirements"),
        new Paragraph({
          children: [
            new TextRun({
              text: "Job requirements analysis and matching assessment:",
              size: 20,
            }),
          ],
          spacing: { after: 240 },
        })
      );

      if (testsWithJobRequirements.length > 0) {
        testsWithJobRequirements.forEach((test) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${test.testName} - Job Requirements:`,
                  bold: true,
                  size: 18,
                }),
              ],
              spacing: { before: 180, after: 120 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: test.jobRequirements,
                  size: 16,
                }),
              ],
              spacing: { after: 120 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Test Status: ${test.demonstrated ? "Successfully Demonstrated" : "Not Demonstrated"}`,
                  bold: true,
                  size: 16,
                }),
              ],
              spacing: { after: 180 },
            })
          );
        });
      } else {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "No specific job requirements analysis was recorded for the evaluated activities.",
                italic: true,
                size: 16,
              }),
            ],
            spacing: { after: 240 },
          })
        );
      }

      children.push(new PageBreak());
    }

    // ----- TESTED ACTIVITIES -----
    if (testData.tests && testData.tests.length > 0) {
      children.push(
        createBlueHeader("Tested Activities"),
        new Paragraph({
          children: [
            new TextRun({
              text: "Summary of all activities tested during the evaluation:",
              size: 20,
            }),
          ],
          spacing: { after: 240 },
        })
      );

      const testedActivitiesTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Tested Activities", bold: true })] })],
                width: { size: 60, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Pass", bold: true })] })],
                width: { size: 10, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Fail", bold: true })] })],
                width: { size: 10, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "N/A", bold: true })] })],
                width: { size: 10, type: WidthType.PERCENTAGE },
              }),
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: "Comments", bold: true })] })],
                width: { size: 10, type: WidthType.PERCENTAGE },
              }),
            ],
          }),
          ...testData.tests.map((test) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: test.testName || "Unknown Test" })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: test.demonstrated ? "✓" : "" })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: test.demonstrated ? "" : "✗" })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: test.demonstrated === null ? "N/A" : "" })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: test.comments ? "Yes" : "No" })] })],
                }),
              ],
            })
          ),
        ],
      });

      children.push(testedActivitiesTable);

      // Test Summary Statistics
      const demonstratedCount = testData.tests.filter((test) => test.demonstrated).length;
      const notDemonstratedCount = testData.tests.filter((test) => !test.demonstrated).length;
      const successRate = Math.round((demonstratedCount / testData.tests.length) * 100);

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Test Summary:",
              bold: true,
              size: 20,
            }),
          ],
          spacing: { before: 240, after: 120 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Total Tests Administered: ${testData.tests.length}`,
              size: 18,
            }),
          ],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Tests Successfully Demonstrated: ${demonstratedCount}`,
              size: 18,
            }),
          ],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Tests Not Demonstrated: ${notDemonstratedCount}`,
              size: 18,
            }),
          ],
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Success Rate: ${successRate}%`,
              bold: true,
              size: 18,
            }),
          ],
          spacing: { after: 240 },
        })
      );

      children.push(new PageBreak());
    }

    // ----- INDIVIDUAL TEST RESULTS -----
    if (testData.tests && testData.tests.length > 0) {
      children.push(
        createBlueHeader("Individual Test Results"),
        new Paragraph({
          children: [
            new TextRun({
              text: "Detailed results for each individual test performed:",
              size: 20,
            }),
          ],
          spacing: { after: 240 },
        })
      );

      testData.tests.forEach((test, index) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${index + 1}. ${test.testName || "Unknown Test"}`,
                bold: true,
                size: 20,
              }),
            ],
            spacing: { before: 240, after: 120 },
          })
        );

        const individualTestTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Test Result:", bold: true })] })],
                  width: { size: 30, type: WidthType.PERCENTAGE },
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: test.result || "No result recorded" })] })],
                  width: { size: 70, type: WidthType.PERCENTAGE },
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Effort Level:", bold: true })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: test.effort || "Not specified" })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Demonstrated:", bold: true })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: test.demonstrated ? "Yes" : "No" })] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: "Comments:", bold: true })] })],
                }),
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: test.comments || "No comments" })] })],
                }),
              ],
            }),
          ],
        });

        children.push(individualTestTable);
      });

      children.push(new PageBreak());
    }

    // ----- APPENDIX ONE: REFERENCE CHARTS -----
    children.push(
      createBlueHeader("Appendix One: Reference Charts"),
      new Paragraph({
        children: [
          new TextRun({
            text: "Reference charts and normative data used in this evaluation:",
            size: 20,
          }),
        ],
        spacing: { after: 240 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "• Department of Labor Physical Demands Chart",
            size: 18,
          }),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "• Standardized measurement protocols",
            size: 18,
          }),
        ],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "• Normative data tables for functional capacity",
            size: 18,
          }),
        ],
        spacing: { after: 240 },
      })
    );

    children.push(new PageBreak());

    // ----- APPENDIX TWO: DIGITAL LIBRARY -----
    children.push(
      createBlueHeader("Appendix Two: Digital Library"),
      new Paragraph({
        children: [
          new TextRun({
            text: "Images and documentation from the evaluation process:",
            size: 20,
          }),
        ],
        spacing: { after: 240 },
      })
    );

    if (digitalLibraryData.savedFileData && digitalLibraryData.savedFileData.length > 0) {
      digitalLibraryData.savedFileData.forEach((file) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${file.name || "Image"} (${file.type || "Unknown type"})`,
                size: 18,
              }),
            ],
            spacing: { after: 120 },
          })
        );
      });
    } else {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "No digital files were saved during this evaluation.",
              italic: true,
              size: 16,
            }),
          ],
          spacing: { after: 240 },
        })
      );
    }

    // ----- BUILD AND SEND DOCX -----
    console.log("Total sections added to document:", children.length);
    console.log("Creating DOCX document...");
    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    console.log("Generated DOCX buffer size:", buffer.length, "bytes");
    console.log("=== CLOUD FUNCTION DEBUG END ===");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename=FCE_Report_${claimantName.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`);
    // res.send(buffer);
    

    if (!buffer || buffer.length < 2000) { // DOCX usually > 2KB
  console.error("Generated DOCX seems too small or empty, aborting send.");
  return res.status(500).json({ error: "DOCX generation failed or empty." });
}

res.setHeader(
  "Content-Type",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
);
res.setHeader(
  "Content-Disposition",
  `attachment; filename=FCE_Report_${claimantName.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`
);

// Binary-safe send
res.end(buffer);

  } catch (error) {
    console.error("DOCX generation failed:", error);
    res.status(500).json({ error: "Internal Server Error generating DOCX", details: error.message });
  }
});

module.exports = router;

export interface Reference {
  author: string;
  title: string;
  journal?: string;
  year: number;
  volume?: string;
  pages?: string;
  publisher?: string;
}

export interface TestCategoryReferences {
  [key: string]: Reference[];
}

export const testReferences: TestCategoryReferences = {
  // Static Lift Strength
  "static-lift": [
    {
      author: "William M. Keyserling",
      title:
        "Isometric Strength Testing in Selecting Workers for Strenuous Jobs",
      journal: "University of Michigan",
      year: 1979,
    },
    {
      author: "Don B. Chaffin, PhD.",
      title: "Pre-employment Strength Testing: An Updated Position",
      journal: "Journal of Occupational Medicine",
      year: 1978,
      volume: "Vol. 20 No. 6",
      pages: "June 1978",
    },
    {
      author: "Donald Badges PhD.",
      title: "Work Practices Guide to Manual Lifting",
      publisher: "NIOSH",
      year: 1981,
    },
    {
      author: "Don Chaffin, PhD.",
      title: "Ergonomics Guide for the Assessment of Human Static Strength",
      journal: "American Industrial Hygiene Association Journal",
      year: 1975,
      pages: "July 1975",
    },
    {
      author: "Harber & SooHoo",
      title:
        "Static Ergonomic Strength Testing in Evaluating Occupational Back Pain",
      journal: "Journal of Occupational Medicine",
      year: 1984,
      volume: "Vol. 26 No. 12",
      pages: "Dec 1984",
    },
  ],

  // Dynamic Lift Strength
  "dynamic-lift": [
    {
      author: "Mayer et al.",
      title:
        "Progressive Iso-inertial Lifting Evaluation: A Standardized Protocol and Normative Database",
      journal: "Spine",
      year: 1988,
      volume: "Volume 13 Num. 9",
      pages: "pp. 993",
    },
  ],

  // Hand Dynamometer and Pinch Grip
  "hand-strength": [
    {
      author: "V. Mathiowetz et al.",
      title: "Grip and Pinch Strength: Normative Data for Adults",
      journal: "Arch Pys Med Rehab",
      year: 1985,
      volume: "Vol. 66",
      pages: "pp. 69 (Feb 1985)",
    },
    {
      author: "H. Stokes",
      title: "The Seriously Uninjured Hand-Weakness of Grip",
      journal: "Journal of Occupational Medicine",
      year: 1983,
      pages: "pp. 683-684 (Sep 1983)",
    },
    {
      author: "L. Matheson, et al.",
      title:
        "Grip Strength in a Disabled Sample: Reliability and Normative Standards",
      journal: "Industrial Rehabilitation Quarterly",
      year: 1988,
      volume: "Vol. 1, no. 3",
      pages: "Fall 1988",
    },
    {
      author: "Hildreth et al.",
      title: "Detection of Submaximal effort by use of the rapid exchange grip",
      journal: "Journal of Hand Surgery",
      year: 1989,
      pages: "pp. 742 (Jul 1989)",
    },
  ],

  // Pinch Strength
  "pinch-strength": [
    {
      author: "V. Mathiowetz et al.",
      title: "Grip and Pinch Strength: Normative Data for Adults",
      journal: "Arch Pys Med Rehab",
      year: 1985,
      volume: "Vol. 66",
      pages: "pp. 69 (Feb 1985)",
    },
    {
      author: "H. Stokes",
      title: "The Seriously Uninjured Hand-Weakness of Grip",
      journal: "Journal of Occupational Medicine",
      year: 1983,
      pages: "pp. 683-684 (Sep 1983)",
    },
    {
      author: "L. Matheson, et al.",
      title:
        "Grip Strength in a Disabled Sample: Reliability and Normative Standards",
      journal: "Industrial Rehabilitation Quarterly",
      year: 1988,
      volume: "Vol. 1, no. 3",
      pages: "Fall 1988",
    },
    {
      author: "Hildreth et al.",
      title: "Detection of Submaximal effort by use of the rapid exchange grip",
      journal: "Journal of Hand Surgery",
      year: 1989,
      pages: "pp. 742 (Jul 1989)",
    },
  ],

  // Range of Motion
  "range-of-motion": [
    {
      author: "American Medical Association",
      title: "Guides to the Evaluation of Permanent Impairment",
      year: 1993,
      publisher: "4th ed.",
      pages: "pp. 112-135",
    },
    {
      author: "American Medical Association",
      title: "Guides to the Evaluation of Permanent Impairment",
      year: 1990,
      publisher: "3rd ed.",
      pages: "pp. 81-102",
    },
  ],

  // Goniometers
  goniometers: [
    {
      author: "American Medical Association",
      title: "Guides to the Evaluation of Permanent Impairment",
      year: 1993,
      publisher: "4th ed.",
      pages: "pp. 90-92",
    },
    {
      author: "American Medical Association",
      title: "Guides to the Evaluation of Permanent Impairment",
      year: 1990,
      publisher: "3rd ed.",
      pages: "pp. 20-38, 101",
    },
  ],

  // Manual Muscle Tester
  "muscle-test": [
    {
      author: "A.W. Andrews",
      title: "Hand-held Dynamometry for Measuring Muscle Strength",
      journal: "Journal of Human Muscle Performance",
      year: 1991,
      pages: "pp. 35 (Jun 1991)",
    },
  ],

  // Horizontal Validity
  "horizontal-validity": [
    {
      author: "Berryhill et al",
      title:
        "Horizontal Strength Changes: An Ergometric Measure for Determining Validity of Effort in Impairment Evaluations-A Preliminary Report",
      journal: "Journal of Disability",
      year: 1993,
      volume: "Vol. 3, Num. 14",
      pages: "pp. 143, (Jul 1993)",
    },
    {
      author: "L. A. Owens",
      title:
        "Assessing Reliability of Performance in the Functional Capacity Assessment",
      journal: "Journal of Disability",
      year: 1993,
      volume: "Vol. 3, Num. 14",
      pages: "pp. 149, (Jul 1993)",
    },
  ],

  // Method Time Measurement (MTM)
  mtm: [
    {
      author: "Anderson, D.S. and Edstrom D.P.",
      title:
        "MTM Personnel Selection Tests; Validation at a Northwestern National Life Insurance Company",
      journal: "Journal of Methods-Time Measurement",
      year: 1975,
      volume: "15, (3)",
    },
    {
      author: "Birdsong, J.H. and Chyatte, S.B.",
      title: "Further medical applications of methods-time measurement",
      journal: "Journal of Methods-Time Measurement",
      year: 1970,
      volume: "15",
      pages: "19-27",
    },
    {
      author: "Brickey",
      title: "MTM in a Sheltered Workshop",
      journal: "Journal of Methods-Time Measurement",
      year: 1975,
      volume: "8, (3)",
      pages: "2-7",
    },
    {
      author: "Chyatte, S.B. and Birdsong, J.H.",
      title: "Methods time measurement in assessment of motor performance",
      journal: "Archives of Physical Medicine and Rehabilitation",
      year: 1972,
      volume: "53",
      pages: "38-44",
    },
    {
      author: "Foulke, J.A.",
      title: "Estimating Individual Operator Performance",
      journal: "Journal of Methods-Time Measurement",
      year: 1975,
      volume: "15, (1)",
      pages: "18-23",
    },
    {
      author: "Grant, G.W.B., Moores, B. and Whelan, E.",
      title:
        "Applications of Methods-time measurement in training centers for the mentally handicapped",
      journal: "Journal of Methods-Time Measurement",
      year: 1975,
      volume: "11",
      pages: "23-30",
    },
  ],

  // Bruce Treadmill Test
  "bruce-treadmill": [
    {
      author: "Bruce AM, Lawson D, Wasser TE, Raber-Baer D",
      title:
        "Comparison of Bruce treadmill exercise test protocols: Is ramped Bruce equal or superior to standard bruce in producing clinically valid studies for patients presenting for evaluation of cardiac ischemia or arrhythmia with body mass index equal to or greater than 30?",
      journal: "J Nucl Med Technol",
      year: 2013,
      volume: "41(4)",
      pages: "274-8",
    },
    {
      author: "Poehlman CP, Llewellyn TL",
      title:
        "The Effects of Submaximal and Maximal Exercise on Heart Rate Variability",
      journal: "Int J Exerc Sci",
      year: 2019,
      volume: "12(9)",
      pages: "9-14",
    },
  ],

  // mCAFT Test
  mcaft: [
    {
      author: "Canadian Society for Exercise Physiology",
      title: "mCAFT: modified Canadian Aerobic Fitness Test",
      journal: "Health Canada",
      year: 2003,
    },
  ],

  // Kasch Step Test
  kasch: [
    {
      author: "Davis JA, Wilmore JH",
      title:
        "Validation of a bench stepping test for cardiorespiratory fitness classification of emergency service personnel",
      journal: "Journal of Occupational Medicine",
      year: 1979,
      pages: "PMID: 5014456",
    },
  ],
};

// Helper function to get references for a specific test type
export const getReferencesForTest = (testId: string): Reference[] => {
  // Map test IDs to reference categories
  const testToCategory: { [key: string]: string } = {
    // Static Lift Tests
    "static-lift-low": "static-lift",
    "static-lift-mid": "static-lift",
    "static-lift-high": "static-lift",

    // Dynamic Lift Tests
    "dynamic-lift-low": "dynamic-lift",
    "dynamic-lift-mid": "dynamic-lift",
    "dynamic-lift-high": "dynamic-lift",
    "dynamic-lift-overhead": "dynamic-lift",
    "dynamic-lift-frequent": "dynamic-lift",

    // Hand Strength Tests
    "hand-strength-standard": "hand-strength",
    "hand-strength-rapid-exchange": "hand-strength",
    "hand-strength-mve": "hand-strength",
    "hand-strength-mmve": "hand-strength",
    "grip-strength": "hand-strength",

    // Pinch Strength Tests
    "pinch-strength-key": "pinch-strength",
    "pinch-strength-tip": "pinch-strength",
    "pinch-strength-palmar": "pinch-strength",
    "pinch-strength-grasp": "pinch-strength",
    "key-pinch": "pinch-strength",
    "tip-pinch": "pinch-strength",
    "palmar-pinch": "pinch-strength",

    // Range of Motion Tests (Cervical, Lumbar, etc.)
    "cervical-flexion-extension": "range-of-motion",
    "cervical-lateral-flexion": "range-of-motion",
    "cervical-30-rotation": "range-of-motion",
    "cervical-60-rotation": "range-of-motion",
    "cervical-spine-flexion-extension": "range-of-motion",
    "cervical-spine-lateral-flexion": "range-of-motion",
    "cervical-spine-rotation": "range-of-motion",
    "lumbar-spine-flexion-extension": "range-of-motion",
    "lumbar-spine-lateral-flexion": "range-of-motion",
    "lumbar-spine-straight-leg-raise": "range-of-motion",
    "thoracic-spine-flexion": "range-of-motion",
    "thoracic-spine-rotation": "range-of-motion",
    "shoulder-rom-flexion-extension": "range-of-motion",
    "shoulder-rom-internal-external-rotation": "range-of-motion",
    "shoulder-rom-abduction-adduction": "range-of-motion",
    "hip-rom-flexion-extension": "range-of-motion",
    "hip-rom-internal-external-rotation": "range-of-motion",
    "hip-rom-abduction-adduction": "range-of-motion",
    "knee-rom-flexion-extension": "range-of-motion",
    "ankle-rom-dorsi-plantar-flexion": "range-of-motion",
    "ankle-rom-inversion-eversion": "range-of-motion",
    "elbow-rom-flexion-extension": "range-of-motion",
    "elbow-rom-supination-pronation": "range-of-motion",
    "wrist-rom-flexion-extension": "range-of-motion",
    "wrist-rom-radial-ulnar-deviation": "range-of-motion",

    // Hand/Foot ROM (uses goniometers)
    "thumb-ip-flexion-extension": "goniometers",
    "thumb-mp-flexion-extension": "goniometers",
    "thumb-abduction": "goniometers",
    "index-dip-flexion-extension": "goniometers",
    "index-pip-flexion-extension": "goniometers",
    "index-mp-flexion-extension": "goniometers",
    "middle-dip-flexion-extension": "goniometers",
    "middle-pip-flexion-extension": "goniometers",
    "middle-mp-flexion-extension": "goniometers",
    "ring-dip-flexion-extension": "goniometers",
    "ring-pip-flexion-extension": "goniometers",
    "ring-mp-flexion-extension": "goniometers",
    "little-dip-flexion-extension": "goniometers",
    "little-pip-flexion-extension": "goniometers",
    "little-mp-flexion-extension": "goniometers",
    "great-toe-ip-flexion": "goniometers",
    "great-toe-mp-dorsi-plantar-flexion": "goniometers",
    "2nd-toe-mp-dorsi-plantar-flexion": "goniometers",
    "3rd-toe-mp-dorsi-plantar-flexion": "goniometers",
    "4th-toe-mp-dorsi-plantar-flexion": "goniometers",
    "5th-toe-mp-dorsi-plantar-flexion": "goniometers",

    // Muscle Tests
    "hip-muscle-flexion": "muscle-test",
    "hip-muscle-extension": "muscle-test",
    "hip-muscle-abduction": "muscle-test",
    "hip-muscle-adduction": "muscle-test",
    "hip-muscle-external-rotation": "muscle-test",
    "hip-muscle-internal-rotation": "muscle-test",
    "shoulder-muscle-flexion": "muscle-test",
    "shoulder-muscle-extension": "muscle-test",
    "shoulder-muscle-abduction": "muscle-test",
    "shoulder-muscle-adduction": "muscle-test",
    "shoulder-muscle-internal-rotation": "muscle-test",
    "shoulder-muscle-external-rotation": "muscle-test",
    "wrist-muscle-flexion": "muscle-test",
    "wrist-muscle-extension": "muscle-test",
    "wrist-muscle-radial-deviation": "muscle-test",
    "wrist-muscle-ulnar-deviation": "muscle-test",
    "ankle-muscle-dorsiflexion": "muscle-test",
    "ankle-muscle-plantar-flexion": "muscle-test",
    "ankle-muscle-eversion": "muscle-test",
    "ankle-muscle-inversion": "muscle-test",
    "knee-muscle-flexion": "muscle-test",
    "knee-muscle-extension": "muscle-test",
    "elbow-muscle-flexion": "muscle-test",
    "elbow-muscle-extension": "muscle-test",

    // MTM/Occupational Tests
    fingering: "mtm",
    "bi-manual-fingering": "mtm",
    handling: "mtm",
    "bi-manual-handling": "mtm",
    "reach-immediate": "mtm",
    "reach-overhead": "mtm",
    "reach-with-weight": "mtm",

    // Cardio Tests
    "bruce-treadmill": "bruce-treadmill",
    "treadmill-test": "bruce-treadmill",
    "bruce-test": "bruce-treadmill",
    mcaft: "mcaft",
    "mcaft-test": "mcaft",
    "step-test": "mcaft",
    kasch: "kasch",
    "kasch-test": "kasch",
    "kasch-step": "kasch",
  };

  const category = testToCategory[testId];
  return category ? testReferences[category] || [] : [];
};

// Helper function to format a reference
export const formatReference = (reference: Reference): string => {
  let formatted = `${reference.title}, ${reference.author}`;

  if (reference.journal) {
    formatted += `, ${reference.journal}`;
  }

  if (reference.volume) {
    formatted += `, ${reference.volume}`;
  }

  if (reference.pages) {
    formatted += `, ${reference.pages}`;
  } else if (reference.year) {
    formatted += ` (${reference.year})`;
  }

  if (reference.publisher && !reference.journal) {
    formatted += `, ${reference.publisher}`;
  }

  return formatted + ".";
};

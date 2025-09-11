import React, { useEffect, useState } from "react";
import FlexibleOccupationalTest from "./FlexibleOccupationalTest";

interface TestParameter {
  id: string;
  label: string;
  type: "dropdown" | "number" | "valueWithUnit" | "dropdownWithManual";
  options?: string[];
  unitOptions?: string[];
  required?: boolean;
}

interface OccupationalTestConfig {
  testName: string;
  testType: string;
  parameters: TestParameter[];
  minTrials: number;
  maxTrials: number;
  defaultTrials: number;
}

interface OccupationalTestConfiguratorProps {
  testType: string;
  onSave: (data: any) => void;
  onBack: () => void;
  embeddedMode?: boolean;
}

const testConfigurations: Record<string, OccupationalTestConfig> = {
  // Weight-based tests
  carrying: {
    testName: "Carrying",
    testType: "carrying",
    parameters: [
      {
        id: "side",
        label: "Side",
        type: "dropdown",
        options: ["Both", "Left", "Right"],
        required: true,
      },
      {
        id: "weight",
        label: "Weight/Plane",
        type: "dropdownWithManual",
        options: [
          "Immediate",
          "Light",
          "Medium",
          "Heavy",
          "Front",
          "Side",
          "Across",
        ],
        required: true,
      },
      {
        id: "position",
        label: "Distance/Posture",
        type: "dropdownWithManual",
        options: [
          "Standing",
          "Sitting",
          "Walking",
          "Climbing",
          "Crawling",
          "Kneeling",
          "Squatting",
        ],
        required: true,
      },
      {
        id: "reps",
        label: "Reps",
        type: "number",
        required: true,
      },
      {
        id: "time",
        label: "Time (sec)",
        type: "number",
        required: true,
      },
      {
        id: "percentIS",
        label: "% IS",
        type: "number",
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Time-based tests
  fingering: {
    testName: "Fingering",
    testType: "fingering",
    parameters: [
      {
        id: "side",
        label: "Side",
        type: "dropdown",
        options: ["LEFT", "RIGHT", "BOTH"],
        required: true,
      },
      {
        id: "weight",
        label: "Weight/Plane",
        type: "dropdownWithManual",
        options: ["IMMEDIATE", "FRONT", "SIDE", "ACROSS"],
        required: true,
      },
      {
        id: "position",
        label: "Distance/Posture",
        type: "dropdownWithManual",
        options: ["SITTING", "STANDING"],
        required: true,
      },
      {
        id: "reps",
        label: "Reps",
        type: "number",
        required: true,
      },
      {
        id: "time",
        label: "Time",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "percentIS",
        label: "% IS",
        type: "number",
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  handling: {
    testName: "Handling",
    testType: "handling",
    parameters: [
      {
        id: "side",
        label: "Side",
        type: "dropdown",
        options: ["LEFT", "RIGHT", "BOTH"],
        required: true,
      },
      {
        id: "weight",
        label: "Weight/Plane",
        type: "dropdownWithManual",
        options: ["IMMEDIATE", "FRONT", "SIDE", "ACROSS"],
        required: true,
      },
      {
        id: "position",
        label: "Distance/Posture",
        type: "dropdownWithManual",
        options: ["SITTING", "STANDING"],
        required: true,
      },
      {
        id: "reps",
        label: "Reps",
        type: "number",
        required: true,
      },
      {
        id: "time",
        label: "Time",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "percentIS",
        label: "% IS",
        type: "number",
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Distance-based tests
  "reach-immediate": {
    testName: "Reach Immediate",
    testType: "reach-immediate",
    parameters: [
      {
        id: "side",
        label: "Side",
        type: "dropdown",
        options: ["LEFT", "RIGHT", "BOTH"],
        required: true,
      },
      {
        id: "direction",
        label: "Direction",
        type: "dropdown",
        options: ["IMMEDIATE", "OVERHEAD", "SIDE", "ACROSS"],
        required: true,
      },
      {
        id: "distance",
        label: "Distance",
        type: "valueWithUnit",
        unitOptions: ["in", "cm", "ft", "m"],
        required: true,
      },
      {
        id: "reps",
        label: "Reps",
        type: "number",
        required: true,
      },
      {
        id: "time",
        label: "Time",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "percentIS",
        label: "% IS",
        type: "number",
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Balance tests
  balance: {
    testName: "Balance",
    testType: "balance",
    parameters: [
      {
        id: "position",
        label: "Position",
        type: "dropdown",
        options: ["STANDING", "SINGLE LEG", "EYES CLOSED", "TANDEM", "DYNAMIC"],
        required: true,
      },
      {
        id: "surface",
        label: "Surface",
        type: "dropdown",
        options: ["FIRM", "FOAM", "UNEVEN", "MOVING"],
        required: true,
      },
      {
        id: "time",
        label: "Time Held",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "attempts",
        label: "Attempts",
        type: "number",
        required: true,
      },
      {
        id: "success",
        label: "Success",
        type: "dropdown",
        options: ["YES", "NO", "PARTIAL"],
        required: true,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Walking tests
  walk: {
    testName: "Walk",
    testType: "walk",
    parameters: [
      {
        id: "distance",
        label: "Distance",
        type: "valueWithUnit",
        unitOptions: ["ft", "m", "km"],
        required: true,
      },
      {
        id: "time",
        label: "Time",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "speed",
        label: "Speed",
        type: "dropdown",
        options: ["SLOW", "NORMAL", "FAST", "VARIABLE"],
        required: true,
      },
      {
        id: "terrain",
        label: "Terrain",
        type: "dropdown",
        options: ["LEVEL", "INCLINE", "DECLINE", "STAIRS", "UNEVEN"],
        required: true,
      },
      {
        id: "assistiveDevice",
        label: "Assistive Device",
        type: "dropdown",
        options: ["NONE", "CANE", "WALKER", "CRUTCHES"],
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Climbing tests
  "climb-stairs": {
    testName: "Climb Stairs",
    testType: "climb-stairs",
    parameters: [
      {
        id: "steps",
        label: "Number of Steps",
        type: "number",
        required: true,
      },
      {
        id: "direction",
        label: "Direction",
        type: "dropdown",
        options: ["UP", "DOWN", "UP & DOWN"],
        required: true,
      },
      {
        id: "time",
        label: "Time",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "handrail",
        label: "Handrail Use",
        type: "dropdown",
        options: ["NONE", "ONE HAND", "BOTH HANDS", "AS NEEDED"],
        required: true,
      },
      {
        id: "exertion",
        label: "Perceived Exertion",
        type: "number",
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Bi-manual fingering test
  "bi-manual-fingering": {
    testName: "Bi-Manual Fingering",
    testType: "bi-manual-fingering",
    parameters: [
      {
        id: "side",
        label: "Side",
        type: "dropdown",
        options: ["BOTH", "LEFT", "RIGHT"],
        required: true,
      },
      {
        id: "weight",
        label: "Weight/Plane",
        type: "dropdownWithManual",
        options: ["IMMEDIATE", "FRONT", "SIDE", "ACROSS"],
        required: true,
      },
      {
        id: "position",
        label: "Distance/Posture",
        type: "dropdownWithManual",
        options: ["SITTING", "STANDING"],
        required: true,
      },
      {
        id: "reps",
        label: "Reps",
        type: "number",
        required: true,
      },
      {
        id: "time",
        label: "Time",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "percentIS",
        label: "% IS",
        type: "number",
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Bi-manual handling test
  "bi-manual-handling": {
    testName: "Bi-Manual Handling",
    testType: "bi-manual-handling",
    parameters: [
      {
        id: "side",
        label: "Side",
        type: "dropdown",
        options: ["BOTH", "LEFT", "RIGHT"],
        required: true,
      },
      {
        id: "weight",
        label: "Weight/Plane",
        type: "dropdownWithManual",
        options: ["IMMEDIATE", "FRONT", "SIDE", "ACROSS"],
        required: true,
      },
      {
        id: "position",
        label: "Distance/Posture",
        type: "dropdownWithManual",
        options: ["SITTING", "STANDING"],
        required: true,
      },
      {
        id: "reps",
        label: "Reps",
        type: "number",
        required: true,
      },
      {
        id: "time",
        label: "Time",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "percentIS",
        label: "% IS",
        type: "number",
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Reach overhead test
  "reach-overhead": {
    testName: "Reach Overhead",
    testType: "reach-overhead",
    parameters: [
      {
        id: "side",
        label: "Side",
        type: "dropdown",
        options: ["LEFT", "RIGHT", "BOTH"],
        required: true,
      },
      {
        id: "direction",
        label: "Direction",
        type: "dropdown",
        options: ["OVERHEAD", "ABOVE", "HIGH"],
        required: true,
      },
      {
        id: "distance",
        label: "Distance",
        type: "valueWithUnit",
        unitOptions: ["in", "cm", "ft", "m"],
        required: true,
      },
      {
        id: "reps",
        label: "Reps",
        type: "number",
        required: true,
      },
      {
        id: "time",
        label: "Time",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "percentIS",
        label: "% IS",
        type: "number",
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Reach with weight test
  "reach-with-weight": {
    testName: "Reach With Weight",
    testType: "reach-with-weight",
    parameters: [
      {
        id: "side",
        label: "Side",
        type: "dropdown",
        options: ["LEFT", "RIGHT", "BOTH"],
        required: true,
      },
      {
        id: "weight",
        label: "Weight",
        type: "valueWithUnit",
        unitOptions: ["lbs", "kg"],
        required: true,
      },
      {
        id: "direction",
        label: "Direction",
        type: "dropdown",
        options: ["IMMEDIATE", "OVERHEAD", "SIDE", "ACROSS"],
        required: true,
      },
      {
        id: "distance",
        label: "Distance",
        type: "valueWithUnit",
        unitOptions: ["in", "cm", "ft", "m"],
        required: true,
      },
      {
        id: "reps",
        label: "Reps",
        type: "number",
        required: true,
      },
      {
        id: "time",
        label: "Time",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Stoop test
  stoop: {
    testName: "Stoop",
    testType: "stoop",
    parameters: [
      {
        id: "position",
        label: "Position",
        type: "dropdown",
        options: ["FORWARD", "DEEP", "PARTIAL"],
        required: true,
      },
      {
        id: "duration",
        label: "Duration",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "repetitions",
        label: "Repetitions",
        type: "number",
        required: true,
      },
      {
        id: "recovery",
        label: "Recovery Time",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Push pull cart test
  "push-pull-cart": {
    testName: "Push Pull Cart",
    testType: "push-pull-cart",
    parameters: [
      {
        id: "action",
        label: "Action",
        type: "dropdown",
        options: ["PUSH", "PULL", "BOTH"],
        required: true,
      },
      {
        id: "weight",
        label: "Weight",
        type: "valueWithUnit",
        unitOptions: ["lbs", "kg"],
        required: true,
      },
      {
        id: "distance",
        label: "Distance",
        type: "valueWithUnit",
        unitOptions: ["ft", "m"],
        required: true,
      },
      {
        id: "time",
        label: "Time",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "surface",
        label: "Surface",
        type: "dropdown",
        options: ["SMOOTH", "ROUGH", "CARPET", "GRAVEL"],
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Crouch test
  crouch: {
    testName: "Crouch",
    testType: "crouch",
    parameters: [
      {
        id: "position",
        label: "Position",
        type: "dropdown",
        options: ["FULL", "PARTIAL", "DEEP"],
        required: true,
      },
      {
        id: "duration",
        label: "Duration",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "repetitions",
        label: "Repetitions",
        type: "number",
        required: true,
      },
      {
        id: "support",
        label: "Support Used",
        type: "dropdown",
        options: ["NONE", "HANDS", "WALL", "RAIL"],
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Carry test (different from carrying)
  carry: {
    testName: "Carry",
    testType: "carry",
    parameters: [
      {
        id: "weight",
        label: "Weight",
        type: "valueWithUnit",
        unitOptions: ["lbs", "kg"],
        required: true,
      },
      {
        id: "distance",
        label: "Distance",
        type: "valueWithUnit",
        unitOptions: ["ft", "m"],
        required: true,
      },
      {
        id: "position",
        label: "Carry Position",
        type: "dropdown",
        options: ["FRONT", "SIDE", "BACK", "OVERHEAD"],
        required: true,
      },
      {
        id: "time",
        label: "Time",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "grip",
        label: "Grip Type",
        type: "dropdown",
        options: ["ONE HAND", "TWO HANDS", "HANDLES", "NO HANDLES"],
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Crawl test
  crawl: {
    testName: "Crawl",
    testType: "crawl",
    parameters: [
      {
        id: "style",
        label: "Crawl Style",
        type: "dropdown",
        options: ["HANDS_KNEES", "ARMY", "BEAR", "CRAB"],
        required: true,
      },
      {
        id: "distance",
        label: "Distance",
        type: "valueWithUnit",
        unitOptions: ["ft", "m"],
        required: true,
      },
      {
        id: "time",
        label: "Time",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "surface",
        label: "Surface",
        type: "dropdown",
        options: ["CARPET", "HARD", "GRASS", "ROUGH"],
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Kneel test
  kneel: {
    testName: "Kneel",
    testType: "kneel",
    parameters: [
      {
        id: "position",
        label: "Kneel Position",
        type: "dropdown",
        options: ["ONE_KNEE", "BOTH_KNEES", "KNEELING_WALK"],
        required: true,
      },
      {
        id: "duration",
        label: "Duration",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "surface",
        label: "Surface",
        type: "dropdown",
        options: ["HARD", "PADDED", "CARPET", "ROUGH"],
        required: false,
      },
      {
        id: "support",
        label: "Support Used",
        type: "dropdown",
        options: ["NONE", "HANDS", "RAIL", "WALL"],
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },

  // Climb ladder test
  "climb-ladder": {
    testName: "Climb Ladder",
    testType: "climb-ladder",
    parameters: [
      {
        id: "rungs",
        label: "Number of Rungs",
        type: "number",
        required: true,
      },
      {
        id: "direction",
        label: "Direction",
        type: "dropdown",
        options: ["UP", "DOWN", "UP_DOWN"],
        required: true,
      },
      {
        id: "time",
        label: "Time",
        type: "valueWithUnit",
        unitOptions: ["sec", "min"],
        required: true,
      },
      {
        id: "ladderType",
        label: "Ladder Type",
        type: "dropdown",
        options: ["STEP", "EXTENSION", "PLATFORM", "FIXED"],
        required: false,
      },
      {
        id: "handholds",
        label: "Hand Holds",
        type: "dropdown",
        options: ["BOTH", "ONE", "ALTERNATING", "RAIL_ONLY"],
        required: false,
      },
    ],
    minTrials: 3,
    maxTrials: 8,
    defaultTrials: 3,
  },
};

export default function OccupationalTestConfigurator({
  testType,
  onSave,
  onBack,
  embeddedMode = false,
}: OccupationalTestConfiguratorProps) {
  const [existingData, setExistingData] = useState<any>(null);
  const config = testConfigurations[testType];

  // Load existing MTM data from localStorage when component mounts
  useEffect(() => {
    const savedMtmData = localStorage.getItem("mtmTestData");
    if (savedMtmData) {
      try {
        const mtmData = JSON.parse(savedMtmData);
        if (mtmData[testType]) {
          setExistingData(mtmData[testType]);
        }
      } catch (error) {
        console.error("Error loading existing MTM data:", error);
      }
    }
  }, [testType]);

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Test Configuration Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The test type "{testType}" is not configured yet.
          </p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <FlexibleOccupationalTest
      testName={config.testName}
      testType={config.testType}
      parameters={config.parameters}
      minTrials={config.minTrials}
      maxTrials={config.maxTrials}
      defaultTrials={config.defaultTrials}
      onSave={onSave}
      onBack={embeddedMode ? () => {} : onBack}
      existingData={existingData}
      showBackButton={!embeddedMode}
    />
  );
}

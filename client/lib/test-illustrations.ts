export type Illustration = {
  src: string;
  label: string;
  yPercent?: number | null;
};

// Return sample illustration(s) for a given test (Strength/ROM only)
// Images are located in public/sampe_illustration (folder name as in repo)
export function getSampleIllustrations(testIdOrName: string): Illustration[] {
  const key = (testIdOrName || "").toLowerCase();

  // Determine type buckets (only handle ROM/Strength here)
  const isROM =
    key.includes("flexion") ||
    key.includes("extension") ||
    key.includes("rotation") ||
    key.includes("range") ||
    key.includes("abduction") ||
    key.includes("adduction") ||
    key.includes("deviation") ||
    key.includes("supination") ||
    key.includes("pronation") ||
    key.includes("dorsi") ||
    key.includes("plantar") ||
    key.includes("inversion") ||
    key.includes("eversion");

  const isStrength =
    key.includes("grip") ||
    key.includes("pinch") ||
    key.includes("strength") ||
    key.includes("force") ||
    key.includes("lift") ||
    key.includes("push") ||
    key.includes("pull") ||
    key.includes("static") ||
    key.includes("dynamic");

  // Ignore non-ROM/Strength categories
  if (!isROM && !isStrength) return [];

  // Strength mappings
  if (isStrength) {
    // Hand Grip (detect position, rapid exchange, etc.)
    if (key.includes("grip")) {
      // Rapid exchange
      if (key.includes("rapid") || key.includes("exchange")) {
        return [
          {
            src: "/sampe_illustration/Hand_Strength_Rapid_Exchange.jpg",
            label: "Rapid Exchange Grip",
          },
        ];
      }

      // Positions 1-5 (use a standard grip illustration; positions are conceptually similar here)
      const posMatch =
        key.match(/position\s*[#-:]?\s*(\d)/) || key.match(/\bp\s*(\d)\b/);
      if (posMatch) {
        const pos = parseInt(posMatch[1], 10);
        if (pos >= 1 && pos <= 5) {
          return [
            {
              src: "/sampe_illustration/Hand_Strength_Standard.jpg",
              label: `Grip Position ${pos}`,
            },
          ];
        }
      }

      // Default hand grip
      return [
        { src: "/sampe_illustration/Hand_Strength_MVE.jpg", label: "Grip Strength" },
      ];
    }

    // Pinch types
    if (key.includes("pinch") && key.includes("key")) {
      return [
        { src: "/sampe_illustration/Pinch_Strength_Key.jpg", label: "Key Pinch" },
      ];
    }
    if (key.includes("pinch") && key.includes("tip")) {
      return [
        { src: "/sampe_illustration/Pinch_Strength_Tip.jpg", label: "Tip Pinch" },
      ];
    }
    if (key.includes("pinch") && (key.includes("palmar") || key.includes("palmer"))) {
      return [
        { src: "/sampe_illustration/Pinch_Strength_Palmar.jpg", label: "Palmar Pinch" },
      ];
    }
    if (key.includes("pinch") || key.includes("grasp")) {
      return [
        { src: "/sampe_illustration/Pinch_Strength_Grasp.jpg", label: "Pinch" },
      ];
    }

    // Static lifts
    if (key.includes("static") && key.includes("lift")) {
      if (key.includes("high") || key.includes("overhead")) {
        return [
          { src: "/sampe_illustration/Static_Lift_High.jpg", label: "Static High Lift" },
        ];
      }
      if (key.includes("mid") || key.includes("waist") || key.includes("standing")) {
        return [
          { src: "/sampe_illustration/Static_Lift_Mid.jpg", label: "Static Mid Lift" },
        ];
      }
      if (key.includes("low") || key.includes("squat")) {
        return [
          { src: "/sampe_illustration/Static_Lift_Low.jpg", label: "Static Low Lift" },
        ];
      }
      return [
        { src: "/sampe_illustration/Static_Lift_Mid.jpg", label: "Static Lift" },
      ];
    }

    // Dynamic lifts
    if (key.includes("dynamic") && key.includes("lift")) {
      if (key.includes("full") || key.includes("sequence") || key.includes("overhead")) {
        return [
          { src: "/sampe_illustration/Dynamic_Lift_Overhead.jpg", label: "Dynamic Overhead Lift" },
        ];
      }
      if (key.includes("mid") || key.includes("waist") || key.includes("standing")) {
        return [
          { src: "/sampe_illustration/Dynamic_Lift_Mid.jpg", label: "Dynamic Mid Lift" },
        ];
      }
      if (key.includes("low") || key.includes("squat")) {
        return [
          { src: "/sampe_illustration/Dynamic_Lift_Low.jpg", label: "Dynamic Low Lift" },
        ];
      }
      return [
        { src: "/sampe_illustration/Dynamic_Lift_High.jpg", label: "Dynamic Lift" },
      ];
    }

    // Push/Pull (fallback using MTM cart push/pull image)
    if ((key.includes("push") || key.includes("pull")) && !key.includes("static") && !key.includes("dynamic")) {
      return [
        { src: "/sampe_illustration/MTM_Test_Battery_Push_Pull_Cart.jpg", label: "Push/Pull" },
      ];
    }

    // Generic strength fallback
    return [
      { src: "/sampe_illustration/Hand_Strength_Standard.jpg", label: "Strength" },
    ];
  }

  // ROM mappings
  // Cervical
  if (key.includes("cervical") && (key.includes("flexion") || key.includes("extension") || key.includes("range"))) {
    return [
      { src: "/sampe_illustration/Cervical_Total_Spine_Flexion_Extension.jpg", label: "Cervical Flex/Ext" },
    ];
  }
  if (key.includes("cervical") && (key.includes("lateral") || key.includes("oblique"))) {
    return [
      { src: "/sampe_illustration/Cervical_Total_Spine_Lateral_Flexion.jpg", label: "Cervical Lateral Flexion" },
    ];
  }
  if (key.includes("cervical") && key.includes("rotation")) {
    return [
      { src: "/sampe_illustration/Cervical_Total_Spine_Rotation.jpg", label: "Cervical Rotation" },
    ];
  }

  // Thoracic
  if (key.includes("thoracic") && key.includes("flexion")) {
    return [
      { src: "/sampe_illustration/Thoracic_Total_Spine_Flexion.jpg", label: "Thoracic Flexion" },
    ];
  }
  if (key.includes("thoracic") && key.includes("rotation")) {
    return [
      { src: "/sampe_illustration/Thoracic_Total_Spine_Rotation.jpg", label: "Thoracic Rotation" },
    ];
  }

  // Lumbar
  if (key.includes("lumbar") && (key.includes("flexion") || key.includes("extension") || key.includes("range"))) {
    return [
      { src: "/sampe_illustration/Lumbar_Total_Spine_Flexion_Extension.jpg", label: "Lumbar Flex/Ext" },
    ];
  }
  if (key.includes("lumbar") && key.includes("lateral")) {
    return [
      { src: "/sampe_illustration/Lumbar_Total_Spine_Lateral_Flexion.jpg", label: "Lumbar Lateral Flexion" },
    ];
  }

  // Shoulder
  if (key.includes("shoulder") && (key.includes("flexion") || key.includes("extension"))) {
    return [
      { src: "/sampe_illustration/Extremity_Shoulder_Flexion_Extension.jpg", label: key.includes("extension") ? "Shoulder Extension" : "Shoulder Flexion" },
    ];
  }
  if (key.includes("shoulder") && (key.includes("internal") || key.includes("external"))) {
    return [
      { src: "/sampe_illustration/Extremity_Shoulder_Internal_External_Rotation.jpg", label: "Shoulder Int/Ext Rotation" },
    ];
  }
  if (key.includes("shoulder") && (key.includes("abduction") || key.includes("adduction"))) {
    return [
      { src: "/sampe_illustration/Extremity_Shoulder_Abduction_Adduction.jpg", label: "Shoulder Abd/Add" },
    ];
  }

  // Elbow
  if (key.includes("elbow") && (key.includes("flexion") || key.includes("extension"))) {
    return [
      { src: "/sampe_illustration/Extremity_Elbow_Flexion_Extension.jpg", label: "Elbow Flex/Ext" },
    ];
  }
  if (key.includes("elbow") && (key.includes("supination") || key.includes("pronation"))) {
    return [
      { src: "/sampe_illustration/Extremity_Elbow_Supination_Pronation.jpg", label: "Elbow Sup/Pro" },
    ];
  }

  // Wrist
  if (key.includes("wrist") && (key.includes("flexion") || key.includes("extension"))) {
    return [
      { src: "/sampe_illustration/Extremity_Wrist_Flexion_Extension.jpg", label: "Wrist Flex/Ext" },
    ];
  }
  if (key.includes("wrist") && (key.includes("radial") || key.includes("ulnar") || key.includes("deviation"))) {
    return [
      { src: "/sampe_illustration/Extremity_Wrist_Radial_Ulunar_Deviation.jpg", label: "Wrist Radial/Ulnar Deviation" },
    ];
  }
  if (key.includes("wrist") && key.includes("dorsiflexion")) {
    return [
      { src: "/sampe_illustration/Wrist_Muscle_Test_Dorsiflexion.jpg", label: "Wrist Dorsiflexion" },
    ];
  }
  if (key.includes("wrist") && key.includes("palmar")) {
    return [
      { src: "/sampe_illustration/Wrist_Muscle_Test_Palmar_Flexion.jpg", label: "Wrist Palmar Flexion" },
    ];
  }

  // Thumb & Fingers
  if (key.includes("thumb") && key.includes("ip")) {
    return [
      { src: "/sampe_illustration/Thumb_IP_Flexion_Extension.jpg", label: "Thumb IP Flex/Ext" },
    ];
  }
  if (key.includes("thumb") && key.includes("mp")) {
    return [
      { src: "/sampe_illustration/Thumb_MP_Flexion_Extension.jpg", label: "Thumb MP Flex/Ext" },
    ];
  }
  if (key.includes("thumb") && (key.includes("abduction") || key.includes("radial"))) {
    return [
      { src: "/sampe_illustration/Thumb_Thumb_Abduction.jpg", label: "Thumb Abduction" },
    ];
  }

  const fingerMap: {
    pattern: RegExp;
    dip: string;
    pip: string;
    mp: string;
    labelBase: string;
  }[] = [
    {
      pattern: /(index|1st)/,
      dip: "/sampe_illustration/Index_Finger_DIP_Flexion_Extension.jpg",
      pip: "/sampe_illustration/Index_Finger_PIP_Flexion_Extension.jpg",
      mp: "/sampe_illustration/Index_Finger_MP_Flexion_Extension.jpg",
      labelBase: "Index",
    },
    {
      pattern: /(middle|2nd)/,
      dip: "/sampe_illustration/Middle_Finger_DIP_Flexion_Extension.jpg",
      pip: "/sampe_illustration/Middle_Finger_PIP_Flexion_Extension.jpg",
      mp: "/sampe_illustration/Middle_Finger_MP_Flexion_Extension.jpg",
      labelBase: "Middle",
    },
    {
      pattern: /(ring|3rd)/,
      dip: "/sampe_illustration/Ring_Finger_DIP_Flexion_Extension.jpg",
      pip: "/sampe_illustration/Ring_Finger_PIP_Flexion_Extension.jpg",
      mp: "/sampe_illustration/Ring_Finger_MP_Flexion_Extension.jpg",
      labelBase: "Ring",
    },
  ];

  for (const f of fingerMap) {
    if (f.pattern.test(key)) {
      if (key.includes("dip")) return [{ src: f.dip, label: `${f.labelBase} DIP Flex/Ext` }];
      if (key.includes("pip")) return [{ src: f.pip, label: `${f.labelBase} PIP Flex/Ext` }];
      if (key.includes("mp")) return [{ src: f.mp, label: `${f.labelBase} MP Flex/Ext` }];
      // default to PIP if joint unspecified
      return [{ src: f.pip, label: `${f.labelBase} PIP Flex/Ext` }];
    }
  }

  // Hip
  if (key.includes("hip")) {
    const images: Illustration[] = [];
    if (
      key.includes("flexion") ||
      key.includes("extension") ||
      key.includes("internal") ||
      key.includes("external") ||
      key.includes("abduction") ||
      key.includes("adduction")
    ) {
      // Provide multiple panels for comprehensive hip ROM
      images.push({
        src: "/sampe_illustration/Extremity_Hip_Flexion_Extension_Internal_External_Rotation_Abduction_Adduction_1.jpg",
        label: "Hip ROM (1)",
      });
      images.push({
        src: "/sampe_illustration/Extremity_Hip_Flexion_Extension_Internal_External_Rotation_Abduction_Adduction_2.jpg",
        label: "Hip ROM (2)",
      });
      return images;
    }
  }

  // Knee
  if (key.includes("knee") && (key.includes("flexion") || key.includes("extension"))) {
    // Prefer ROM chart when available; muscle tests if explicitly stated
    if (key.includes("muscle")) {
      return [
        { src: "/sampe_illustration/Knee_Muscle_Test_Flexion.jpg", label: "Knee Muscle Flexion" },
        { src: "/sampe_illustration/Knee_Muscle_Test_Extension.jpg", label: "Knee Muscle Extension" },
      ];
    }
    return [
      { src: "/sampe_illustration/Extremity_ Knee_Flexion_Extension.jpg", label: "Knee Flex/Ext" },
    ];
  }

  // Ankle
  if (key.includes("ankle") && (key.includes("dorsi") || key.includes("plantar"))) {
    if (key.includes("dorsi") && key.includes("plantar")) {
      return [
        { src: "/sampe_illustration/Extremity_Ankle_Dorsi_Plantar_Flexion.jpg", label: "Ankle Dorsi/Plantar" },
      ];
    }
    if (key.includes("dorsi")) {
      return [
        { src: "/sampe_illustration/Ankle_Muscle_Test_Dorsiflexion.jpg", label: "Ankle Dorsiflexion" },
      ];
    }
    return [
      { src: "/sampe_illustration/Ankle_Muscle_Test_Plantar_Flexion.jpg", label: "Ankle Plantar Flexion" },
    ];
  }
  if (key.includes("ankle") && (key.includes("inversion") || key.includes("eversion"))) {
    return [
      { src: "/sampe_illustration/Extremity_Ankle_Inversion_Eversion.jpg", label: "Ankle Inversion/Eversion" },
    ];
  }

  // Straight Leg Raise
  if (
    (key.includes("lumbar") && key.includes("straight") && key.includes("leg") && key.includes("raise")) ||
    key.includes("straight-leg-raise") ||
    key.includes("slr")
  ) {
    return [
      { src: "/sampe_illustration/Lumbar_Total_Spine_Straight_Leg_Raise.jpg", label: "Lumbar Straight Leg Raise" },
    ];
  }

  // Fallbacks
  if (isROM) {
    return [
      { src: "/sampe_illustration/Lumbar_Total_Spine_Flexion_Extension.jpg", label: "ROM" },
    ];
  }
  if (isStrength) {
    return [
      { src: "/sampe_illustration/Hand_Strength_MVE.jpg", label: "Strength" },
    ];
  }

  return [];
}

// Convert illustrations to inline HTML snippet (used in DownloadReport)
export function illustrationsToHtml(illos: Illustration[], sizePx = 72): string {
  if (!illos || illos.length === 0) return "";
  const items = illos
    .map((ill) => {
      if (ill.yPercent === undefined || ill.yPercent === null) {
        return `\n<div style="text-align: left;">\n  <img src="${ill.src}" alt="${ill.label}" style="width: ${sizePx}px; height: auto; border: 1px solid #333; border-radius: 4px;" />\n  <p style="font-size: 7px; color: #555; margin: 1px 0 0 0; text-align: left;">${ill.label}</p>\n</div>`;
      }
      return `\n<div style="text-align: left;">\n  <div style="width: ${sizePx}px; height: ${Math.round((sizePx * 5) / 4)}px; border: 1px solid #333; border-radius: 4px; background-image: url('${ill.src}'); background-repeat: no-repeat; background-size: 100% auto; background-position: center ${ill.yPercent}%;"></div>\n  <p style="font-size: 7px; color: #555; margin: 1px 0 0 0; text-align: left;">${ill.label}</p>\n</div>`;
    })
    .join("\n");

  return `\n<div style="display: flex; flex-direction: column; gap: 4px;">${items}\n</div>`;
}

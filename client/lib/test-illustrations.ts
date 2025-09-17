export type Illustration = {
  src: string;
  label: string;
  yPercent?: number | null;
};

// Helper kept for backward-compatibility with existing consumers
const sliceY = (slices: number, index: number) => {
  if (slices <= 1) return 0;
  const pct = (index / (slices - 1)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
};

// Return exactly ONE sample illustration for a given test (Strength/ROM only)
// Images come from public/sampe_illustration or other local public assets
export function getSampleIllustrations(testIdOrName: string): Illustration[] {
  const key = (testIdOrName || "").toLowerCase();

  // Decide test type (only Strength/ROM handled)
  const isROM =
    key.includes("flexion") ||
    key.includes("extension") ||
    key.includes("rotation") ||
    key.includes("range") ||
    key.includes("abduction") ||
    key.includes("adduction") ||
    key.includes("deviation") ||
    key.includes("supination") ||
    key.includes("pronation");

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

  // If not Strength/ROM, return empty (don't touch MTM/Occupational/Cardio)
  if (!isROM && !isStrength) return [];

  // Strength mappings
  if (isStrength) {
    // Grip (by position if present)
    if (key.includes("grip")) {
      if (/position\s*1|pos\s*1|p1/.test(key)) {
        return [
          {
            src: "/sampe_illustration/Hand_grip_mvve_mve_position1.png",
            label: "Grip Position 1",
          },
        ];
      }
      if (/position\s*2|pos\s*2|p2/.test(key)) {
        return [
          {
            src: "/sampe_illustration/Hand_grip_mvve_mve_position2.png",
            label: "Grip Position 2",
          },
        ];
      }
      if (/position\s*3|pos\s*3|p3/.test(key)) {
        return [
          {
            src: "/sampe_illustration/Hand_grip_mvve_mve_position3.png",
            label: "Grip Position 3",
          },
        ];
      }
      if (/position\s*4|pos\s*4|p4/.test(key)) {
        return [
          {
            src: "/sampe_illustration/Hand_grip_mvve_mve_position4.png",
            label: "Grip Position 4",
          },
        ];
      }
      if (/position\s*5|pos\s*5|p5/.test(key)) {
        return [
          {
            src: "/sampe_illustration/Hand_grip_mvve_mve_position5.png",
            label: "Grip Position 5",
          },
        ];
      }
      if (key.includes("rapid")) {
        return [
          {
            src: "/sampe_illustration/Hand_grip_rapid_exchange.png",
            label: "Rapid Exchange Grip",
          },
        ];
      }
      // Default grip illustration
      return [
        {
          src: "/sampe_illustration/Hand_grip_mvve_mve_position2.png",
          label: "Grip Strength",
        },
      ];
    }

    // Pinch types
    if (key.includes("pinch") && key.includes("key")) {
      return [
        { src: "/sampe_illustration/Pinch_grip_key.png", label: "Key Pinch" },
      ];
    }
    if (key.includes("pinch") && key.includes("tip")) {
      return [
        { src: "/sampe_illustration/Pinch_grip_tip.png", label: "Tip Pinch" },
      ];
    }
    if (
      key.includes("pinch") &&
      (key.includes("palmar") || key.includes("palmer"))
    ) {
      return [
        {
          src: "/sampe_illustration/Pinch_grip_palmer.png",
          label: "Palmar Pinch",
        },
      ];
    }
    if (key.includes("pinch")) {
      return [
        { src: "/sampe_illustration/Pinch_grip_tip.png", label: "Pinch" },
      ];
    }

    // Lifts
    if (key.includes("lift")) {
      if (key.includes("static")) {
        if (key.includes("high") || key.includes("overhead")) {
          return [
            { src: "/sampe_illustration/static_high_lift.png", label: "Static High Lift" },
          ];
        }
        if (key.includes("mid") || key.includes("waist") || key.includes("standing")) {
          return [
            { src: "/sampe_illustration/static_mid_lift.png", label: "Static Mid Lift" },
          ];
        }
        if (key.includes("low") || key.includes("squat")) {
          return [
            { src: "/sampe_illustration/static_low_lift.png", label: "Static Low Lift" },
          ];
        }
        return [
          { src: "/sampe_illustration/static_mid_lift.png", label: "Static Lift" },
        ];
      }
      // dynamic lifts
      if (key.includes("dynamic")) {
        if (key.includes("full") || key.includes("sequence")) {
          return [
            { src: "/sampe_illustration/full_lift.png", label: "Dynamic Full Lift" },
          ];
        }
        if (key.includes("mid") || key.includes("waist") || key.includes("standing")) {
          return [
            { src: "/sampe_illustration/mid_lift.png", label: "Dynamic Mid Lift" },
          ];
        }
        if (key.includes("low") || key.includes("squat")) {
          return [
            { src: "/sampe_illustration/low_lift.png", label: "Dynamic Low Lift" },
          ];
        }
        return [
          { src: "/sampe_illustration/full_lift.png", label: "Dynamic Lift" },
        ];
      }
      // generic lift
      return [
        { src: "/sampe_illustration/full_lift.png", label: "Lift" },
      ];
    }

    // Static push/pull strength
    if (key.includes("static") && key.includes("pull")) {
      return [
        { src: "/sampe_illustration/static_pull.png", label: "Static Pull" },
      ];
    }
    if (key.includes("static") && key.includes("push")) {
      return [
        { src: "/sampe_illustration/static_push.png", label: "Static Push" },
      ];
    }

    // Generic strength fallback
    return [
      { src: "/sampe_illustration/Overhead.png", label: "Strength" },
    ];
  }

  // ROM mappings (by area/joint and motion)
  // Cervical
  if (key.includes("cervical") && (key.includes("flexion") || key.includes("extension"))) {
    return [
      {
        src: "/sampe_illustration/cervical_Flexion_Extension.png",
        label: "Cervical Flex/Ext",
      },
    ];
  }
  if (key.includes("cervical") && (key.includes("lateral") || key.includes("oblique"))) {
    return [
      {
        src: "/sampe_illustration/cervical_lateral_flexion.png",
        label: "Cervical Lateral/Oblique",
      },
    ];
  }
  if (key.includes("cervical") && key.includes("rotation")) {
    return [
      { src: "/sampe_illustration/cervical_rotation.png", label: "Cervical Rotation" },
    ];
  }

  // Lumbar
  if (key.includes("lumbar") && (key.includes("flexion") || key.includes("extension"))) {
    return [
      {
        src: "/sampe_illustration/Lumbar_flexion_extension.png",
        label: "Lumbar Flex/Ext",
      },
    ];
  }
  if (key.includes("lumbar") && key.includes("lateral")) {
    return [
      {
        src: "/sampe_illustration/Lumbar_lateral_flexion.png",
        label: "Lumbar Lateral Flexion",
      },
    ];
  }

  // Shoulder
  if (key.includes("shoulder") && (key.includes("flexion") || key.includes("extension"))) {
    // Prefer specific single images if available
    if (key.includes("extension")) {
      return [
        { src: "/sampe_illustration/Shoulder_extension.png", label: "Shoulder Extension" },
      ];
    }
    return [
      { src: "/sampe_illustration/Shoulder_flexion.png", label: "Shoulder Flexion" },
    ];
  }
  if (key.includes("shoulder") && (key.includes("internal") || key.includes("external"))) {
    return [
      {
        src: "/sampe_illustration/Shoulder_internal_external_rotation.png",
        label: "Shoulder Int/Ext Rotation",
      },
    ];
  }
  if (key.includes("shoulder") && (key.includes("abduction") || key.includes("adduction"))) {
    return [
      {
        src: "/sampe_illustration/Shoulder_abduction_adduction.png",
        label: "Shoulder Abd/Add",
      },
    ];
  }

  // Elbow
  if (key.includes("elbow") && (key.includes("flexion") || key.includes("extension"))) {
    return [
      { src: "/sampe_illustration/Elbow_flexion_extension.png", label: "Elbow Flex/Ext" },
    ];
  }
  if (key.includes("elbow") && (key.includes("supination") || key.includes("pronation"))) {
    return [
      { src: "/sampe_illustration/Elbow_supination_pronation.png", label: "Elbow Sup/Pro" },
    ];
  }

  // Wrist
  if (key.includes("wrist") && (key.includes("flexion") || key.includes("extension"))) {
    return [
      { src: "/sampe_illustration/Wrist_flexion_extension.png", label: "Wrist Flex/Ext" },
    ];
  }
  if (
    key.includes("wrist") &&
    (key.includes("radial") || key.includes("ulnar") || key.includes("deviation"))
  ) {
    return [
      {
        src: "/sampe_illustration/Wrist_radial_ulnar_deviation.png",
        label: "Wrist Radial/Ulnar Deviation",
      },
    ];
  }
  if (key.includes("wrist") && key.includes("dorsiflexion")) {
    return [
      { src: "/sampe_illustration/Wrist_dorsiflexion.png", label: "Wrist Dorsiflexion" },
    ];
  }
  if (key.includes("wrist") && key.includes("palmar")) {
    return [
      { src: "/sampe_illustration/Wrist_palmar_flexion.png", label: "Wrist Palmar Flexion" },
    ];
  }

  // Thumb & Fingers
  if (key.includes("thumb") && key.includes("ip")) {
    return [
      { src: "/sampe_illustration/Hand_thumb_ip_flexion_extension.png", label: "Thumb IP Flex/Ext" },
    ];
  }
  if (key.includes("thumb") && key.includes("mp")) {
    return [
      { src: "/sampe_illustration/Hand_thumb_mp_flextion_extesion.png", label: "Thumb MP Flex/Ext" },
    ];
  }
  if (key.includes("thumb") && (key.includes("abduction") || key.includes("radial"))) {
    return [
      { src: "/sampe_illustration/Hand_thumb_radial_abduction.png", label: "Thumb Radial Abduction" },
    ];
  }

  const fingerMap: { pattern: RegExp; dip: string; pip: string; mp: string; labelBase: string }[] = [
    {
      pattern: /(index|1st)/,
      dip: "/sampe_illustration/Hand_index_finger_dip_flexion_extesion.png",
      pip: "/sampe_illustration/Hand_index_finger_pip_flexion_extension.png",
      mp: "/sampe_illustration/Hand_index_finger_mp_flexion_extension.png",
      labelBase: "Index",
    },
    {
      pattern: /(middle|2nd)/,
      dip: "/sampe_illustration/Hand_middle_finger_dip_flexion_extension.png",
      pip: "/sampe_illustration/Hand_middle_finger_pip_flexion_extension.png",
      mp: "/sampe_illustration/Hand_middle_finger_mp_flexion_extension.png",
      labelBase: "Middle",
    },
    {
      pattern: /(ring|3rd)/,
      dip: "/sampe_illustration/Hand_ring_finger_dip_flexion_extension.png",
      pip: "/sampe_illustration/Hand_ring_finger_pip_flexion_extension.png",
      mp: "/sampe_illustration/Hand_ring_finger_mp_flexion_extension.png",
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

  // Ankle
  if (key.includes("ankle") && (key.includes("dorsi") || key.includes("plantar"))) {
    // Prefer combined if mentioned
    if (key.includes("dorsi") && key.includes("plantar")) {
      return [
        {
          src: "/sampe_illustration/Ankle_dorst_plantar_flexion.png",
          label: "Ankle Dorsi/Plantar Flexion",
        },
      ];
    }
    if (key.includes("dorsi")) {
      return [
        { src: "/sampe_illustration/Ankle_dorsiflexion.png", label: "Ankle Dorsiflexion" },
      ];
    }
    return [
      { src: "/sampe_illustration/Ankle_plantar_flexion.png", label: "Ankle Plantar Flexion" },
    ];
  }
  if (key.includes("ankle") && (key.includes("inversion") || key.includes("eversion"))) {
    return [
      { src: "/sampe_illustration/Ankle_inversion_eversion.png", label: "Ankle Inversion/Eversion" },
    ];
  }
  // Handle muscle strength wording
  if (key.includes("ankle") && key.includes("muscle") && (key.includes("inversion") || key.includes("eversion"))) {
    return [
      { src: "/sampe_illustration/Ankle_inversion_eversion.png", label: "Ankle Muscle Inversion/Eversion" },
    ];
  }

  // Lumbar SLR mapping
  if (
    (key.includes("lumbar") && key.includes("straight") && key.includes("leg") && key.includes("raise")) ||
    key.includes("straight-leg-raise") ||
    key.includes("slr")
  ) {
    return [
      { src: "/sampe_illustration/Lumbar_flexion_extension.png", label: "Lumbar Straight Leg Raise" },
    ];
  }

  // Fallbacks by type
  if (isROM) {
    return [
      {
        src: "/sampe_illustration/Lumbar_flexion_extension.png",
        label: "ROM",
      },
    ];
  }
  if (isStrength) {
    return [
      { src: "/sampe_illustration/Hand_grip_mvve_mve_position2.png", label: "Strength" },
    ];
  }

  return [];
}

// Render small HTML snippet for DownloadReport using inline styles (works for PDF/print)
export function illustrationsToHtml(
  illos: Illustration[],
  sizePx = 72,
): string {
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

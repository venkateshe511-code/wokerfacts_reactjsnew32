export type Illustration = {
  src: string;
  label: string;
  // Percentage for background-position-y to crop tall composite images (0 top, 50 middle, 100 bottom)
  yPercent?: number | null;
};

// Helper to compute y percent for N equal vertical slices
const sliceY = (slices: number, index: number) => {
  if (slices <= 1) return 0;
  const pct = (index / (slices - 1)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
};

// Central mapping from test id/name (case-insensitive includes) to illustrations
// Uses the provided combined image URLs and crops where necessary.
export function getSampleIllustrations(testIdOrName: string): Illustration[] {
  const key = (testIdOrName || "").toLowerCase();
  const illos: Illustration[] = [];

  // Occupational tasks
  if (key.includes("balance")) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2Fa8a5d5be9a164784b9e7deb709fde4c1?format=webp&width=800",
      label: "Balance",
    });
  }
  if (key.includes("carry")) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F8cad4e396fe242039880bb4941f16c89?format=webp&width=800",
      label: "Carry",
    });
  }
  if (key.includes("crawl")) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F22f430bda0144a799d1d5dbe95722962?format=webp&width=800",
      label: "Crawl",
    });
  }
  if (
    key.includes("push-pull") ||
    key.includes("push/pull") ||
    key.includes("cart")
  ) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F63d2090b80744eccb13de3e58bea4c87?format=webp&width=800",
      label: "Push/Pull Cart",
    });
  }
  if (key.includes("climb-stairs") || key.includes("stairs")) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2Fcffd9144253d401393ffc7f35d0f3319?format=webp&width=800",
      label: "Climb Stairs",
    });
  }
  if (key.includes("walk")) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F88f58c3430b34929a4ff05d64fb3b5f4?format=webp&width=800",
      label: "Walk",
    });
  }

  // Static lifts (three vertical slices: High, Low, Mid) from img444
  if (key.includes("static") && key.includes("lift")) {
    if (key.includes("high")) {
      illos.push({
        src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F891b1e3525924d0395567e2d8af1513e?format=webp&width=800",
        label: "Static High Lift",
        yPercent: sliceY(3, 0),
      });
    } else if (key.includes("low")) {
      illos.push({
        src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F891b1e3525924d0395567e2d8af1513e?format=webp&width=800",
        label: "Static Low Lift",
        yPercent: sliceY(3, 1),
      });
    } else if (key.includes("mid")) {
      illos.push({
        src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F891b1e3525924d0395567e2d8af1513e?format=webp&width=800",
        label: "Static Mid Lift",
        yPercent: sliceY(3, 2),
      });
    } else {
      // generic static lift
      illos.push({
        src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F891b1e3525924d0395567e2d8af1513e?format=webp&width=800",
        label: "Static Lift",
        yPercent: sliceY(3, 1),
      });
    }
  }
  // Static push/pull (two slices) from img445
  if (
    key.includes("static") &&
    (key.includes("pull") || key.includes("push"))
  ) {
    if (key.includes("pull")) {
      illos.push({
        src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2Feb7ed34b066f450b9e8f4cf377e7e504?format=webp&width=800",
        label: "Static Pull",
        yPercent: sliceY(2, 0),
      });
    }
    if (key.includes("push")) {
      illos.push({
        src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2Feb7ed34b066f450b9e8f4cf377e7e504?format=webp&width=800",
        label: "Static Push",
        yPercent: sliceY(2, 1),
      });
    }
  }

  // Grip & Pinch
  if (key.includes("grip") && !key.includes("pinch")) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F023afb06e6f746d89a9e181116dd8b60?format=webp&width=800",
      label: "Grip Strength",
    });
  }
  if (
    key.includes("pinch") ||
    key.includes("key-pinch") ||
    key.includes("tip-pinch") ||
    key.includes("palmar")
  ) {
    if (key.includes("key")) {
      illos.push({
        src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F67805325df6f4a32b27417e843921c31?format=webp&width=800",
        label: "Key Pinch",
      });
    }
    if (key.includes("tip")) {
      illos.push({
        src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2Fd70226abebbf4a0691604597627ebbba?format=webp&width=800",
        label: "Tip Pinch",
        yPercent: sliceY(3, 1),
      });
    }
    if (key.includes("palmar") || key.includes("palmer")) {
      illos.push({
        src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2Fd70226abebbf4a0691604597627ebbba?format=webp&width=800",
        label: "Palmar Pinch",
        yPercent: sliceY(3, 2),
      });
    }
  }

  // ROM: Lumbar
  if (
    key.includes("lumbar") &&
    (key.includes("flexion") || key.includes("extension"))
  ) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2Fa4bf1555af3a4c7da471c6f2ccc3c7ae?format=webp&width=800",
      label: "Lumbar Flex/Ext",
      yPercent: sliceY(2, 0),
    });
  }
  if (key.includes("lumbar") && key.includes("lateral")) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2Fa4bf1555af3a4c7da471c6f2ccc3c7ae?format=webp&width=800",
      label: "Lumbar Lateral Flexion",
      yPercent: sliceY(2, 1),
    });
  }

  // ROM: Cervical (three slices)
  if (
    key.includes("cervical") &&
    (key.includes("flexion") || key.includes("extension"))
  ) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F68cb6725a04747458acd3b2ae388d5f3?format=webp&width=800",
      label: "Cervical Flex/Ext",
      yPercent: sliceY(3, 0),
    });
  }
  if (key.includes("cervical") && key.includes("lateral")) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F68cb6725a04747458acd3b2ae388d5f3?format=webp&width=800",
      label: "Cervical Lateral Flexion",
      yPercent: sliceY(3, 1),
    });
  }
  if (key.includes("cervical") && key.includes("rotation")) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2Ff7468d7d54714529abd2bc8056bbfa55?format=webp&width=800",
      label: "Cervical Rotation",
      yPercent: sliceY(3, 2),
    });
  }

  // ROM: Elbow (two slices)
  if (
    key.includes("elbow") &&
    (key.includes("flexion") || key.includes("extension"))
  ) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F3f90cb87a7aa456e81ca3e0ebe08e9dc?format=webp&width=800",
      label: "Elbow Flex/Ext",
      yPercent: sliceY(2, 0),
    });
  }
  if (
    key.includes("elbow") &&
    (key.includes("supination") || key.includes("pronation"))
  ) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F3f90cb87a7aa456e81ca3e0ebe08e9dc?format=webp&width=800",
      label: "Elbow Supination/Pronation",
      yPercent: sliceY(2, 1),
    });
  }

  // ROM: Wrist (two slices)
  if (
    key.includes("wrist") &&
    (key.includes("flexion") || key.includes("extension"))
  ) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F4e95fd691d94436ab63ed761ee9b4f8d?format=webp&width=800",
      label: "Wrist Flex/Ext",
      yPercent: sliceY(2, 0),
    });
  }
  if (
    key.includes("wrist") &&
    (key.includes("radial") ||
      key.includes("ulnar") ||
      key.includes("deviation"))
  ) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F4e95fd691d94436ab63ed761ee9b4f8d?format=webp&width=800",
      label: "Wrist Radial/Ulnar Deviation",
      yPercent: sliceY(2, 1),
    });
  }

  // ROM: Shoulder
  if (
    key.includes("shoulder") &&
    (key.includes("flexion") || key.includes("extension"))
  ) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F938130fe24c24124a2711be1e0307463?format=webp&width=800",
      label: "Shoulder Flex/Ext",
    });
  }
  if (
    key.includes("shoulder") &&
    (key.includes("internal") || key.includes("external"))
  ) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2Ffd39c83c61714cfc9d2c409c3e46a8f7?format=webp&width=800",
      label: "Shoulder Int/Ext Rotation",
      yPercent: sliceY(2, 0),
    });
  }
  if (
    key.includes("shoulder") &&
    (key.includes("abduction") || key.includes("adduction"))
  ) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2Ffd39c83c61714cfc9d2c409c3e46a8f7?format=webp&width=800",
      label: "Shoulder Abd/Add",
      yPercent: sliceY(2, 1),
    });
  }

  // Thumb (three slices)
  if (key.includes("thumb") && key.includes("ip")) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F69160ba5b89344d68a54bd2884cd74e6?format=webp&width=800",
      label: "Thumb IP Flex/Ext",
      yPercent: sliceY(3, 0),
    });
  }
  if (key.includes("thumb") && key.includes("mp")) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F69160ba5b89344d68a54bd2884cd74e6?format=webp&width=800",
      label: "Thumb MP Flex/Ext",
      yPercent: sliceY(3, 1),
    });
  }
  if (
    key.includes("thumb") &&
    (key.includes("abduction") || key.includes("radial"))
  ) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F69160ba5b89344d68a54bd2884cd74e6?format=webp&width=800",
      label: "Thumb Radial Abduction",
      yPercent: sliceY(3, 2),
    });
  }

  // Index finger DIP/PIP/MP (three slices) from img212
  if (key.includes("index") && key.includes("dip")) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F7199d12a9337420585ae89ce5cdb6006?format=webp&width=800",
      label: "Index DIP Flex/Ext",
      yPercent: sliceY(3, 0),
    });
  }
  if (key.includes("index") && key.includes("pip")) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F7199d12a9337420585ae89ce5cdb6006?format=webp&width=800",
      label: "Index PIP Flex/Ext",
      yPercent: sliceY(3, 1),
    });
  }
  if (key.includes("index") && key.includes("mp")) {
    illos.push({
      src: "https://cdn.builder.io/api/v1/image/assets%2Ff95aa0ae0e694a5390be7d3246a25d07%2F7199d12a9337420585ae89ce5cdb6006?format=webp&width=800",
      label: "Index MP Flex/Ext",
      yPercent: sliceY(3, 2),
    });
  }

  // Fallback: return what we have
  return illos;
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
      // Cropped background technique to display a slice from a tall composite
      return `\n<div style="text-align: left;">\n  <div style="width: ${sizePx}px; height: ${Math.round((sizePx * 5) / 4)}px; border: 1px solid #333; border-radius: 4px; background-image: url('${ill.src}'); background-repeat: no-repeat; background-size: 100% auto; background-position: center ${ill.yPercent}%;"></div>\n  <p style="font-size: 7px; color: #555; margin: 1px 0 0 0; text-align: left;">${ill.label}</p>\n</div>`;
    })
    .join("\n");

  return `\n<div style="display: flex; flex-direction: column; gap: 4px;">${items}\n</div>`;
}

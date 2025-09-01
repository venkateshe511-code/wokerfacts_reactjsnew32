// Utility functions for cardio test image handling and persistence

export interface SerializedImage {
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded
  lastModified: number;
}

// Convert File to serializable format
export const fileToBase64 = (file: File): Promise<SerializedImage> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        resolve({
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result as string,
          lastModified: file.lastModified,
        });
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

// Convert serialized image back to File
export const base64ToFile = (serializedImage: SerializedImage): File => {
  try {
    // Validate input
    if (!serializedImage || !serializedImage.data || !serializedImage.name) {
      throw new Error("Invalid serialized image data");
    }

    // Ensure the data has the correct base64 format
    const base64Data = serializedImage.data.includes(",")
      ? serializedImage.data.split(",")[1]
      : serializedImage.data;

    if (!base64Data) {
      throw new Error("Invalid base64 data");
    }

    // Convert base64 to blob
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: serializedImage.type || "image/*",
    });

    // Create File from blob
    return new File([blob], serializedImage.name, {
      type: serializedImage.type || "image/*",
      lastModified: serializedImage.lastModified || Date.now(),
    });
  } catch (error) {
    console.error("Error converting base64 to File:", error);
    // Return a minimal File object that won't crash the app
    const blob = new Blob([""], { type: "text/plain" });
    return new File([blob], "invalid-image.txt", {
      type: "text/plain",
      lastModified: Date.now(),
    });
  }
};

// Convert array of Files to array of SerializedImages
export const filesToBase64Array = async (
  files: File[],
): Promise<SerializedImage[]> => {
  if (!Array.isArray(files)) {
    console.error("filesToBase64Array: Input is not an array");
    return [];
  }

  const validFiles = files.filter(
    (file) => file instanceof File && file.size > 0,
  );

  if (validFiles.length === 0) {
    return [];
  }

  const promises = validFiles.map(async (file) => {
    try {
      return await fileToBase64(file);
    } catch (error) {
      console.error("Error converting file to base64:", error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((result): result is SerializedImage => result !== null);
};

// Convert array of SerializedImages to array of Files
export const base64ArrayToFiles = (
  serializedImages: SerializedImage[],
): File[] => {
  if (!Array.isArray(serializedImages)) {
    console.error("base64ArrayToFiles: Input is not an array");
    return [];
  }

  return serializedImages
    .filter((img) => img && typeof img === "object" && img.name && img.data)
    .map((img) => {
      try {
        return base64ToFile(img);
      } catch (error) {
        console.error("Error converting serialized image to File:", error);
        return null;
      }
    })
    .filter(
      (file): file is File =>
        file !== null && file instanceof File && file.size > 0,
    );
};

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Save,
  Edit,
  Check,
  Upload,
  X,
  File,
  Image,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDemoMode } from "@/hooks/use-demo-mode";

// IndexedDB utilities for large image storage
const DB_NAME = "DigitalLibraryDB";
const DB_VERSION = 1;
const STORE_NAME = "images";

interface IndexedDBImage {
  id: string;
  name: string;
  type: string;
  size: number;
  category: "image" | "document" | "other";
  dataUrl: string;
  timestamp: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
};

const saveImagesToDB = async (images: IndexedDBImage[]): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // Clear existing images first
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Add new images in batches
    for (const image of images) {
      await new Promise<void>((resolve, reject) => {
        const request = store.add(image);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    db.close();
  } catch (error) {
    console.error("Error saving to IndexedDB:", error);
    throw error;
  }
};

const loadImagesFromDB = async (): Promise<IndexedDBImage[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        db.close();
        resolve(request.result || []);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Error loading from IndexedDB:", error);
    return [];
  }
};

interface DigitalFile {
  id: string;
  name: string;
  type: string;
  size: number;
  category: "image" | "document" | "other";
  file: File;
}

interface LibraryData {
  files: DigitalFile[];
  savedFileData?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    category: "image" | "document" | "other";
    dataUrl: string;
  }>;
}

export default function UploadDigitalLibrary() {
  const navigate = useNavigate();
  const isDemoMode = useDemoMode();
  const [libraryData, setLibraryData] = useState<LibraryData>({
    files: [],
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const createSampleFile = (
    name: string,
    type: string,
    category: "image" | "document" | "other",
  ): DigitalFile => {
    // Create a minimal sample file object
    const sampleContent = `Sample ${category} content for demonstration`;
    const blob = new Blob([sampleContent], { type });

    // Try to create File object, fallback to enhanced Blob
    let file: File;
    try {
      // Ensure File constructor is available and properly typed
      file = new (File as any)([blob], name, { type }) as File;
    } catch (error) {
      // Fallback for environments where File constructor is not available
      file = Object.assign(blob, {
        name,
        lastModified: Date.now(),
        webkitRelativePath: "",
      }) as File;
    }

    return {
      id: `sample-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      size: blob.size,
      category,
      file,
    };
  };

  const fillSampleDigitalLibrary = async () => {
    try {
      setIsSubmitting(true);

      // Pick 10 real images from public folder
      const imagePaths = [
        "/clinical-software-overview.jpg",
        "/functional-assessment.jpg",
        "/grip-exerciser.jpg",
        "/hand-grip.jpg",
        "/kasch-step-illustration.jpg",
        "/mcaft-step-illustration.jpg",
        "/occupational-task-1.jpg",
        "/occupational-task-2.jpg",
        "/workplace-wellness-round.jpg",
        "/home_page_background_image.jpg",
      ];

      // Fetch images and build File objects
      const fetchedFiles = await Promise.all(
        imagePaths.map(async (url, idx) => {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to load ${url}`);
          const blob = await res.blob();
          const type =
            blob.type || (url.endsWith(".png") ? "image/png" : "image/jpeg");
          const name = url.split("/").pop() || `image-${idx + 1}.jpg`;
          let file: File;
          try {
            file = new (File as any)([blob], name, { type }) as File;
          } catch {
            file = Object.assign(blob, {
              name,
              lastModified: Date.now(),
              webkitRelativePath: "",
            }) as File;
          }
          return { name, type, size: blob.size, file };
        }),
      );

      // Compress and prepare for state + storage
      const processed = await Promise.all(
        fetchedFiles.map(async ({ name, type, size, file }) => {
          const id = `file-${Date.now()}-${Math.random()}`;
          const dataUrl = await compressImage(file, "high");
          return {
            digitalFile: {
              id,
              name,
              type,
              size,
              category: "image" as const,
              file,
            },
            saved: {
              id,
              name,
              type,
              size,
              category: "image" as const,
              dataUrl,
            },
          };
        }),
      );

      const files: DigitalFile[] = processed.map((p) => p.digitalFile);
      const savedFileData = processed.map((p) => p.saved);

      // Save to IndexedDB for large, persistent storage
      const imagesForDB: IndexedDBImage[] = savedFileData.map((img) => ({
        id: img.id,
        name: img.name,
        type: img.type,
        size: img.size,
        category: img.category,
        dataUrl: img.dataUrl,
        timestamp: Date.now(),
      }));

      try {
        await saveImagesToDB(imagesForDB);
        // Store only metadata in localStorage
        localStorage.setItem(
          "digitalLibraryData",
          JSON.stringify({
            imageCount: savedFileData.length,
            totalSize: savedFileData.reduce((s, i) => s + (i.size || 0), 0),
            lastUpdated: Date.now(),
            storageType: "indexeddb",
          }),
        );
      } catch (e) {
        // Fallback to localStorage if IndexedDB not available
        localStorage.setItem(
          "digitalLibraryData",
          JSON.stringify({
            files: [],
            savedFileData,
            storageType: "localStorage",
          }),
        );
      }

      // Update UI state
      setLibraryData({ files, savedFileData });

      // Mark step completed
      const completedSteps = JSON.parse(
        localStorage.getItem("completedSteps") || "[]",
      );
      if (!completedSteps.includes(7)) {
        completedSteps.push(7);
        localStorage.setItem("completedSteps", JSON.stringify(completedSteps));
      }

      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error("Error filling sample digital library:", error);
      setAlertMessage(
        error?.message || "Failed to load sample images. Please try again.",
      );
      setShowAlertDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const loadExistingData = async () => {
      try {
        // Check if we have existing library data (edit mode)
        const existingData = localStorage.getItem("digitalLibraryData");
        if (!existingData) return;

        const savedData = JSON.parse(existingData);

        // Check storage type and load accordingly
        if (savedData.storageType === "indexeddb") {
          // Load from IndexedDB
          const imagesFromDB = await loadImagesFromDB();

          if (imagesFromDB.length > 0) {
            // Convert IndexedDB data back to our format
            const reconstructedFiles: DigitalFile[] = [];
            const savedFileData = imagesFromDB
              .map((imageData) => {
                try {
                  const byteCharacters = atob(imageData.dataUrl.split(",")[1]);
                  const byteNumbers = new Array(byteCharacters.length);
                  for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                  }
                  const byteArray = new Uint8Array(byteNumbers);
                  const blob = new Blob([byteArray], { type: imageData.type });

                  // Create a File-like object
                  let file: File;
                  try {
                    file = new (File as any)([blob], imageData.name, {
                      type: imageData.type,
                    }) as File;
                  } catch (fileError) {
                    file = Object.assign(blob, {
                      name: imageData.name,
                      lastModified: Date.now(),
                      webkitRelativePath: "",
                    }) as File;
                  }

                  reconstructedFiles.push({
                    id: imageData.id,
                    name: imageData.name,
                    type: imageData.type,
                    size: imageData.size,
                    category: imageData.category,
                    file: file,
                  });

                  return {
                    id: imageData.id,
                    name: imageData.name,
                    type: imageData.type,
                    size: imageData.size,
                    category: imageData.category,
                    dataUrl: imageData.dataUrl,
                  };
                } catch (error) {
                  console.error(
                    "Error reconstructing file from IndexedDB:",
                    error,
                  );
                  return null;
                }
              })
              .filter(Boolean);

            setLibraryData({
              files: reconstructedFiles,
              savedFileData: savedFileData,
            });
            setIsEditMode(true);
          }
        } else {
          // Load from localStorage (legacy format)
          const reconstructedFiles: DigitalFile[] = [];
          if (savedData.savedFileData) {
            savedData.savedFileData.forEach((fileData: any) => {
              try {
                const byteCharacters = atob(fileData.dataUrl.split(",")[1]);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: fileData.type });

                let file: File;
                try {
                  file = new (File as any)([blob], fileData.name, {
                    type: fileData.type,
                  }) as File;
                } catch (fileError) {
                  file = Object.assign(blob, {
                    name: fileData.name,
                    lastModified: Date.now(),
                    webkitRelativePath: "",
                  }) as File;
                }

                reconstructedFiles.push({
                  id: fileData.id,
                  name: fileData.name,
                  type: fileData.type,
                  size: fileData.size,
                  category: fileData.category,
                  file: file,
                });
              } catch (error) {
                console.error("Error reconstructing file:", error);
              }
            });
          }

          setLibraryData({
            files: reconstructedFiles,
            savedFileData: savedData.savedFileData,
          });
          setIsEditMode(true);
        }
      } catch (error) {
        console.error("Error loading existing data:", error);
      }
    };

    loadExistingData();
  }, []);

  const getFileCategory = (file: File): "image" => {
    return "image"; // Only images are allowed now
  };

  const getFileIcon = (category: "image" | "document" | "other") => {
    switch (category) {
      case "image":
        return Image;
      case "document":
        return FileText;
      default:
        return File;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const compressImage = (
    file: File,
    quality: "high" | "medium" | "low" = "medium",
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Check if we're in a browser environment
      if (
        typeof window === "undefined" ||
        typeof document === "undefined" ||
        typeof Image === "undefined"
      ) {
        // Fallback: use FileReader to convert to base64 without compression
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };
        reader.readAsDataURL(file);
        return;
      }

      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        if (!ctx) {
          throw new Error("Canvas context not available");
        }

        img.onload = () => {
          // Calculate new dimensions based on quality setting
          const maxSizes = {
            high: 1200, // High quality for IndexedDB storage
            medium: 800, // Medium quality for localStorage
            low: 600, // Low quality for very constrained storage
          };
          const qualitySettings = {
            high: 0.85, // 85% quality
            medium: 0.7, // 70% quality
            low: 0.5, // 50% quality
          };

          const maxSize = maxSizes[quality];
          const jpegQuality = qualitySettings[quality];
          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", jpegQuality);
          resolve(compressedDataUrl);
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        img.src = URL.createObjectURL(file);
      } catch (error) {
        // Fallback to FileReader if canvas/Image fails
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // Filter for images only and check size limit
    const imageFiles = fileArray.filter((file) =>
      file.type.startsWith("image/"),
    );
    const validFiles = imageFiles.filter(
      (file) => file.size <= 50 * 1024 * 1024,
    ); // 50MB limit

    // Check if adding new files would exceed the 40 file limit
    const remainingSlots = 40 - libraryData.files.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    let uploadAlertMessage = "";
    if (imageFiles.length !== fileArray.length) {
      uploadAlertMessage += "Only image files are accepted. ";
    }
    if (validFiles.length !== imageFiles.length) {
      uploadAlertMessage +=
        "Some images exceed 50MB limit and were not uploaded. ";
    }
    if (filesToAdd.length !== validFiles.length) {
      uploadAlertMessage += `Only ${filesToAdd.length} images uploaded due to 40 file limit. `;
    }
    if (uploadAlertMessage) {
      setAlertMessage(uploadAlertMessage.trim());
      setShowAlertDialog(true);
    }

    if (filesToAdd.length === 0) return;

    setUploadingImages(true);

    try {
      // Process images with adaptive compression based on total image count
      const totalImages = libraryData.files.length + filesToAdd.length;
      const compressionQuality =
        totalImages > 20 ? "medium" : totalImages > 10 ? "high" : "high";

      const processedImages = await Promise.all(
        filesToAdd.map(async (file) => {
          try {
            const compressedDataUrl = await compressImage(
              file,
              compressionQuality,
            );
            return {
              id: `file-${Date.now()}-${Math.random()}`,
              name: file.name,
              type: file.type,
              size: file.size,
              category: getFileCategory(file),
              dataUrl: compressedDataUrl,
            };
          } catch (error) {
            console.error("Error compressing image:", error);
            // Fallback: create a placeholder data URL
            return {
              id: `file-${Date.now()}-${Math.random()}`,
              name: file.name,
              type: file.type,
              size: file.size,
              category: getFileCategory(file),
              dataUrl:
                "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDX/9k=",
            };
          }
        }),
      );

      const newFiles: DigitalFile[] = filesToAdd.map((file) => ({
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        category: getFileCategory(file),
        file: file,
      }));

      setLibraryData((prev) => ({
        ...prev,
        files: [...prev.files, ...newFiles],
        savedFileData: [...(prev.savedFileData || []), ...processedImages],
      }));
    } catch (error) {
      console.error("Error processing images:", error);
      setAlertMessage("Error processing images. Please try again.");
      setShowAlertDialog(true);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const removeFile = (fileId: string) => {
    setLibraryData((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== fileId),
      savedFileData: (prev.savedFileData || []).filter((f) => f.id !== fileId),
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setIsSaving(true);
    setSaveProgress(0);

    try {
      const savedFileData = libraryData.savedFileData || [];

      setSaveProgress(10);

      // Prepare images for IndexedDB storage
      const imagesForDB: IndexedDBImage[] = savedFileData.map((image) => ({
        id: image.id,
        name: image.name,
        type: image.type,
        size: image.size,
        category: image.category,
        dataUrl: image.dataUrl,
        timestamp: Date.now(),
      }));

      setSaveProgress(20);

      try {
        // Try to save images to IndexedDB (can handle large amounts of data)
        await saveImagesToDB(imagesForDB);
        setSaveProgress(70);

        // Store only metadata in localStorage (much smaller)
        const metadataForLocalStorage = {
          imageCount: savedFileData.length,
          totalSize: savedFileData.reduce(
            (sum, img) => sum + (img.size || 0),
            0,
          ),
          lastUpdated: Date.now(),
          storageType: "indexeddb",
        };

        localStorage.setItem(
          "digitalLibraryData",
          JSON.stringify(metadataForLocalStorage),
        );
        setSaveProgress(85);
      } catch (indexedDBError) {
        console.warn(
          "IndexedDB failed, falling back to localStorage with compression:",
          indexedDBError,
        );
        setSaveProgress(30);

        // Fallback: Try localStorage with heavily compressed data
        if (savedFileData.length <= 5) {
          // For small datasets, try localStorage directly
          const dataToSave = {
            savedFileData: savedFileData,
            files: [],
            storageType: "localStorage",
          };

          try {
            localStorage.setItem(
              "digitalLibraryData",
              JSON.stringify(dataToSave),
            );
            setSaveProgress(85);
          } catch (quotaError) {
            throw new Error(
              "Storage quota exceeded. Please upload fewer images or try clearing browser data.",
            );
          }
        } else {
          throw new Error(
            "Too many images for localStorage. Please upload fewer images or enable IndexedDB in your browser.",
          );
        }
      }

      setSaveProgress(90);

      // Mark step 7 as completed
      const completedSteps = JSON.parse(
        localStorage.getItem("completedSteps") || "[]",
      );
      if (!completedSteps.includes(7)) {
        completedSteps.push(7);
        localStorage.setItem("completedSteps", JSON.stringify(completedSteps));
      }

      setSaveProgress(100);

      // Small delay to show completion
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error("Error saving digital library:", error);
      setAlertMessage(
        `Error saving digital library: ${error.message || "Please try uploading fewer images."}`,
      );
      setShowAlertDialog(true);
    } finally {
      setIsSubmitting(false);
      setIsSaving(false);
      setSaveProgress(0);
      if (!showAlertDialog) {
        setShowSuccessDialog(true);
      }
    }
  };

  // All files are images now, so no need to group by category

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              {isEditMode && <Edit className="mr-3 h-8 w-8 text-orange-600" />}
              Upload Digital Library
              {isEditMode && (
                <span className="ml-3 text-2xl text-orange-600">
                  (Edit Mode)
                </span>
              )}
            </h1>
            <p className="text-xl text-gray-600">
              {isEditMode
                ? "Update your digital library images"
                : "Upload images to your digital library"}
            </p>

            {/* Sample Digital Library Button - Only show in demo mode */}
            {isDemoMode && !isEditMode && (
              <div className="mt-6">
                <Button
                  type="button"
                  onClick={fillSampleDigitalLibrary}
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 shadow-lg border-2 border-green-500"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </div>
                  ) : (
                    <>
                      <Image className="mr-2 h-4 w-4" />
                      Fill Sample Digital Library & Continue
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Quick demo with sample medical images
                </p>
              </div>
            )}
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader
            className={`text-white ${isEditMode ? "bg-orange-600" : "bg-blue-600"}`}
          >
            <CardTitle className="text-2xl flex items-center">
              {isEditMode ? (
                <>
                  <Edit className="mr-3 h-6 w-6" />
                  Step 7: Edit Digital Library
                </>
              ) : (
                <>
                  <div className="w-6 h-6 mr-3 bg-white text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    7
                  </div>
                  Step 7: Upload Digital Library
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drop files here or click to upload
              </h3>
              <p className="text-gray-500 mb-4">
                Support for image files up to 50MB each (Maximum 40 images)
                <br />
                <span className="text-xs">
                  📱 Large image sets use optimized storage for better
                  performance
                </span>
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={libraryData.files.length >= 40 || uploadingImages}
                className={`${
                  libraryData.files.length >= 40 || uploadingImages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                }`}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadingImages
                  ? "Processing..."
                  : libraryData.files.length >= 40
                    ? "Maximum Files Reached"
                    : "Choose Files"}
              </Button>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  e.target.files && handleFileUpload(e.target.files)
                }
                className="hidden"
              />
            </div>

            {/* Upload Progress Indicator */}
            {uploadingImages && (
              <div className="mt-6 flex items-center justify-center p-4 border border-blue-200 rounded-lg bg-blue-50">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-blue-600">
                  Processing and compressing images...
                </span>
              </div>
            )}

            {/* Save Progress Indicator */}
            {isSaving && (
              <div className="mt-6 p-4 border border-green-200 rounded-lg bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">
                    Saving Digital Library...
                  </span>
                  <span className="text-sm text-green-600">
                    {saveProgress}%
                  </span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${saveProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {saveProgress < 90
                    ? "Processing images..."
                    : saveProgress < 95
                      ? "Saving to storage..."
                      : saveProgress < 100
                        ? "Finalizing..."
                        : "Complete!"}
                </p>
              </div>
            )}

            {/* Image Gallery */}
            {libraryData.files.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Image className="mr-2 h-5 w-5" />
                  Uploaded Images ({libraryData.files.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {libraryData.files.map((file) => {
                    // Use compressed image if available, otherwise use original file
                    const compressedImage = libraryData.savedFileData?.find(
                      (saved) => saved.id === file.id,
                    );
                    const imageSrc =
                      compressedImage?.dataUrl ||
                      URL.createObjectURL(file.file);

                    return (
                      <div key={file.id} className="relative group">
                        <img
                          src={imageSrc}
                          alt={file.name}
                          className="w-full h-32 object-cover rounded-lg border shadow-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="absolute top-2 right-2 h-8 w-8 p-0 bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Storage Information */}
            {libraryData.files.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <div className="h-3 w-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium text-blue-700">
                    Storage Information
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-blue-600">
                  <div>Images: {libraryData.files.length} / 40</div>
                  <div>
                    Storage:{" "}
                    {libraryData.files.length > 10
                      ? "IndexedDB (Large)"
                      : "Browser Storage"}
                  </div>
                  <div>
                    Quality:{" "}
                    {libraryData.files.length > 20
                      ? "Medium"
                      : libraryData.files.length > 10
                        ? "High"
                        : "High"}
                  </div>
                  <div>
                    Size: ~
                    {Math.round(
                      (libraryData.savedFileData?.reduce(
                        (sum, img) => sum + (img.dataUrl?.length || 0),
                        0,
                      ) || 0) / 1024,
                    )}
                    KB
                  </div>
                </div>
                {libraryData.files.length > 15 && (
                  <p className="text-xs text-blue-600 mt-2">
                    ℹ️ Using optimized compression for large image sets
                  </p>
                )}
              </div>
            )}

            {/* Summary and Save */}
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Total images: {libraryData.files.length} / 40
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                {isSubmitting || isSaving ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isSaving
                      ? `Saving... ${saveProgress}%`
                      : isEditMode
                        ? "Updating..."
                        : "Saving..."}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="mr-2 h-5 w-5" />
                    {isEditMode
                      ? "Update Digital Library"
                      : "Save Digital Library"}
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl text-green-600">
                <Check className="mr-3 h-6 w-6" />
                Success!
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditMode
                    ? "Digital Library Updated"
                    : "Digital Library Saved"}
                </h3>
                <p className="text-gray-600">
                  {isEditMode
                    ? "Step 7 has been updated successfully. Your changes have been saved."
                    : "Step 7 has been completed successfully. You can now proceed to the next step."}
                </p>
                <p className="text-sm text-gray-500">
                  Uploaded {libraryData.files.length} / 40 image(s) to your
                  digital library.
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowSuccessDialog(false)}
                className="flex-1"
              >
                Stay Here
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Return to Dashboard
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Alert Dialog */}
        <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl text-orange-600">
                ⚠️ Upload Notice
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-700">{alertMessage}</p>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setShowAlertDialog(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

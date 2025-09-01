import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  filesToBase64Array,
  base64ArrayToFiles,
  SerializedImage,
} from "@/lib/cardio-utils";

interface KASCHStepTestData {
  classification: string;
  aerobicFitnessScore: string;
  clientImages: File[];
  serializedImages?: SerializedImage[];
}

interface Props {
  onSave: (data: KASCHStepTestData) => void;
  initialData?: Partial<KASCHStepTestData>;
}

export default function KASCHStepTest({ onSave, initialData }: Props) {
  const [classification, setClassification] = useState(
    initialData?.classification || "",
  );
  const [aerobicFitnessScore, setAerobicFitnessScore] = useState(
    initialData?.aerobicFitnessScore || "",
  );
  const [clientImages, setClientImages] = useState<File[]>(
    initialData?.clientImages || [],
  );
  const [imagePreviewIndex, setImagePreviewIndex] = useState<number | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImages = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    const newImages = [...clientImages, ...files];
    setClientImages(newImages);

    // Auto-save when images are added
    const serializedImages = await filesToBase64Array(newImages);
    onSave({
      classification,
      aerobicFitnessScore,
      clientImages: newImages,
      serializedImages,
    });
  };

  const handleRemoveImage = async (index: number) => {
    const newImages = clientImages.filter((_, i) => i !== index);
    setClientImages(newImages);

    // Auto-save when images are removed
    const serializedImages = await filesToBase64Array(newImages);
    onSave({
      classification,
      aerobicFitnessScore,
      clientImages: newImages,
      serializedImages,
    });
  };

  const handlePreviewImage = (index: number) => {
    setImagePreviewIndex(index);
  };

  // Auto-save when text fields change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (classification || aerobicFitnessScore) {
        const serializedImages = await filesToBase64Array(clientImages);
        onSave({
          classification,
          aerobicFitnessScore,
          clientImages,
          serializedImages,
        });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [classification, aerobicFitnessScore]);

  // Load images from serialized data on mount
  useEffect(() => {
    if (
      initialData?.serializedImages &&
      initialData.serializedImages.length > 0
    ) {
      try {
        const files = base64ArrayToFiles(initialData.serializedImages);
        // Filter out any invalid files
        const validFiles = files.filter(
          (file) => file instanceof File && file.size > 0,
        );
        setClientImages(validFiles);
      } catch (error) {
        console.error("Error loading serialized images:", error);
        setClientImages([]);
      }
    }
  }, [initialData?.serializedImages]);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-500 text-white relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <CardTitle className="text-2xl font-bold text-center relative z-10 drop-shadow-lg">
            🏃 KASCH STEP TEST
          </CardTitle>
          <p className="text-center text-blue-100 text-sm relative z-10 font-medium mt-2">
            The Kasch step test, officially the Kasch Pulse Recovery Test (KPR
            Test), is a 3-minute step test used to assess cardiorespiratory
            fitness.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
          {/* Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="classification" className="text-sm font-semibold">
                CLASSIFICATION:
              </Label>
              <Input
                id="classification"
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
                placeholder="Enter classification"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="aerobicFitnessScore"
                className="text-sm font-semibold"
              >
                AEROBIC FITNESS SCORE:
              </Label>
              <Input
                id="aerobicFitnessScore"
                value={aerobicFitnessScore}
                onChange={(e) => setAerobicFitnessScore(e.target.value)}
                className="border-2 border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm"
                placeholder="Enter aerobic fitness score"
              />
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-4">
            <div className="text-center">
              <Button
                onClick={handleAddImages}
                variant="outline"
                className="border-2 border-blue-400 hover:border-blue-600 hover:bg-blue-50 px-8 py-3 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold text-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                ADD CLIENT IMAGES
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Image Preview Grid */}
            {clientImages.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">CLIENT IMAGES:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {clientImages
                    .filter((file) => file instanceof File && file.size > 0)
                    .map((file, index) => {
                      let imageUrl: string;
                      try {
                        imageUrl = URL.createObjectURL(file);
                      } catch (error) {
                        console.error("Error creating object URL:", error);
                        return null;
                      }

                      return (
                        <div
                          key={index}
                          className="relative border-2 border-gray-300 rounded-lg p-2"
                        >
                          <img
                            src={imageUrl}
                            alt={`Client image ${index + 1}`}
                            className="w-full h-24 object-cover rounded cursor-pointer"
                            onClick={() => handlePreviewImage(index)}
                            onError={() => {
                              console.error("Error loading image:", file.name);
                            }}
                          />
                          <div className="absolute top-1 right-1 flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePreviewImage(index)}
                              className="p-1 h-6 w-6"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveImage(index)}
                              className="p-1 h-6 w-6"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-center mt-1 truncate">
                            {file.name}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog
        open={imagePreviewIndex !== null}
        onOpenChange={() => setImagePreviewIndex(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {imagePreviewIndex !== null && clientImages[imagePreviewIndex] && (
            <div className="text-center">
              {(() => {
                const file = clientImages[imagePreviewIndex];
                if (!(file instanceof File) || file.size === 0) {
                  return <p className="text-red-500">Invalid image file</p>;
                }

                let imageUrl: string;
                try {
                  imageUrl = URL.createObjectURL(file);
                } catch (error) {
                  console.error("Error creating preview URL:", error);
                  return (
                    <p className="text-red-500">Error loading image preview</p>
                  );
                }

                return (
                  <>
                    <img
                      src={imageUrl}
                      alt={`Preview ${imagePreviewIndex + 1}`}
                      className="max-w-full max-h-[70vh] object-contain mx-auto"
                      onError={() => {
                        console.error(
                          "Error loading preview image:",
                          file.name,
                        );
                      }}
                    />
                    <p className="mt-2 text-sm text-gray-600">{file.name}</p>
                  </>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

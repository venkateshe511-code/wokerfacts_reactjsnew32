import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Trash2,
  Upload,
  Edit,
  Check,
  Circle,
  Zap,
  Flame,
  Navigation,
  Minus,
  Thermometer,
  Droplets,
  Scissors,
  Activity,
  X,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDemoMode } from "@/hooks/use-demo-mode";

interface PainMarker {
  id: string;
  x: number;
  y: number;
  view: "front" | "back" | "left" | "right";
  type: string;
  concern: "primary" | "secondary";
  description?: string;
}

interface PainData {
  markers: PainMarker[];
  uploadedImages: File[];
  imageTitles: string[];
  savedImageData?: Array<{
    name: string;
    type: string;
    dataUrl: string;
    title?: string;
  }>;
}

const painTypes = [
  { id: "dull-ache", label: "Dull Ache", icon: Circle, color: "bg-amber-500" },
  { id: "shooting", label: "Shooting", icon: Zap, color: "bg-red-600" },
  { id: "burning", label: "Burning", icon: Flame, color: "bg-orange-600" },
  {
    id: "pins-needles",
    label: "Pins & Needles",
    icon: Navigation,
    color: "bg-violet-600",
  },
  { id: "numbness", label: "Numbness", icon: Minus, color: "bg-slate-600" },
];

const generalIndicators = [
  {
    id: "temperature",
    label: "Temperature",
    icon: Thermometer,
    color: "bg-cyan-500",
  },
  {
    id: "swelling",
    label: "Swelling",
    icon: Droplets,
    color: "bg-emerald-600",
  },
  { id: "scar", label: "Scar", icon: Scissors, color: "bg-pink-600" },
  { id: "crepitus", label: "Crepitus", icon: Activity, color: "bg-indigo-600" },
];

const allSymbols = [
  {
    id: "p1-primary",
    label: "P1 - Primary",
    category: "concern",
    color: "bg-blue-600",
  },
  {
    id: "p2-secondary",
    label: "P2 - Secondary",
    category: "concern",
    color: "bg-purple-600",
  },
  ...painTypes.map((type) => ({ ...type, category: "pain" })),
  ...generalIndicators.map((indicator) => ({
    ...indicator,
    category: "general",
  })),
];

export default function PainIllustration() {
  const navigate = useNavigate();
  const isDemoMode = useDemoMode();
  const [painData, setPainData] = useState<PainData>({
    markers: [],
    uploadedImages: [],
    imageTitles: [],
  });

  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showSymbolWarningDialog, setShowSymbolWarningDialog] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<PainMarker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const samplePainData = {
    markers: [
      {
        id: "1",
        x: 50,
        y: 30,
        view: "front" as const,
        type: "dull-ache",
        concern: "primary" as const,
        description: "Lower back pain",
      },
      {
        id: "2",
        x: 45,
        y: 25,
        view: "front" as const,
        type: "shooting",
        concern: "secondary" as const,
        description: "Radiating pain",
      },
      {
        id: "3",
        x: 55,
        y: 40,
        view: "back" as const,
        type: "burning",
        concern: "primary" as const,
        description: "Chronic burning sensation",
      },
    ],
    uploadedImages: [],
    imageTitles: [],
    savedImageData: [],
  };

  const fillSamplePainData = async () => {
    setPainData(samplePainData);
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Store sample data in localStorage
    localStorage.setItem(
      "painIllustrationData",
      JSON.stringify(samplePainData),
    );

    // Update completed steps
    const completedSteps = JSON.parse(
      localStorage.getItem("completedSteps") || "[]",
    );
    if (!completedSteps.includes(2)) {
      completedSteps.push(2);
      localStorage.setItem("completedSteps", JSON.stringify(completedSteps));
    }

    setIsSubmitting(false);
    setShowSuccessDialog(true);
  };

  const svgRefs = {
    front: useRef<SVGSVGElement>(null),
    back: useRef<SVGSVGElement>(null),
    left: useRef<SVGSVGElement>(null),
    right: useRef<SVGSVGElement>(null),
  };

  useEffect(() => {
    // Check if we have existing pain data (edit mode)
    const existingData = localStorage.getItem("painIllustrationData");
    if (existingData) {
      const savedData = JSON.parse(existingData);

      // Convert saved image data back to File objects if they exist
      const reconstructedFiles: File[] = [];
      const reconstructedTitles: string[] = [];
      if (savedData.savedImageData) {
        savedData.savedImageData.forEach((imageData: any) => {
          try {
            // Convert base64 back to blob then to File
            const byteCharacters = atob(imageData.dataUrl.split(",")[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: imageData.type });
            const file = new File([blob], imageData.name, {
              type: imageData.type,
            });
            reconstructedFiles.push(file);
            reconstructedTitles.push(imageData.title || "");
          } catch (error) {
            console.error("Error reconstructing file:", error);
          }
        });
      }

      setPainData({
        ...savedData,
        uploadedImages: reconstructedFiles,
        imageTitles:
          reconstructedTitles.length > 0
            ? reconstructedTitles
            : savedData.imageTitles || [],
        savedImageData: undefined, // Clear this as we've reconstructed the files
      });
      setIsEditMode(true);

      // Set initial symbol selection if we have markers or saved selection
      if (savedData.selectedSymbol) {
        setSelectedSymbol(savedData.selectedSymbol);
      } else if (savedData.markers && savedData.markers.length > 0) {
        // Set based on first marker
        const firstMarker = savedData.markers[0];
        if (firstMarker.type === "primary-concern") {
          setSelectedSymbol("p1-primary");
        } else if (firstMarker.type === "secondary-concern") {
          setSelectedSymbol("p2-secondary");
        } else {
          setSelectedSymbol(firstMarker.type);
        }
      }
    }
  }, []);

  const handleDiagramClick = (
    event: React.MouseEvent<SVGSVGElement>,
    view: "front" | "back" | "left" | "right",
  ) => {
    // Don't allow adding markers if no symbol is selected
    if (!selectedSymbol) {
      setShowSymbolWarningDialog(true);
      return;
    }

    const selectedSymbolData = allSymbols.find(
      (symbol) => symbol.id === selectedSymbol,
    );
    if (!selectedSymbolData) return;

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    // Determine concern and type based on selected symbol
    let concern: "primary" | "secondary";
    let type: string;

    if (selectedSymbol === "p1-primary") {
      concern = "primary";
      type = "primary-concern";
    } else if (selectedSymbol === "p2-secondary") {
      concern = "secondary";
      type = "secondary-concern";
    } else {
      // For pain indicators and general, default to primary concern
      concern = "primary";
      type = selectedSymbol;
    }

    const newMarker: PainMarker = {
      id: `marker-${Date.now()}`,
      x,
      y,
      view,
      type,
      concern,
    };

    setPainData((prev) => ({
      ...prev,
      markers: [...prev.markers, newMarker],
    }));
  };

  const handleMarkerClick = (marker: PainMarker, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedMarker(marker);
  };

  const removeMarker = (markerId: string) => {
    setPainData((prev) => ({
      ...prev,
      markers: prev.markers.filter((m) => m.id !== markerId),
    }));
    setSelectedMarker(null);
  };

  const undoLastMarker = () => {
    setPainData((prev) => ({
      ...prev,
      markers: prev.markers.slice(0, -1),
    }));
  };

  const clearAllMarkers = () => {
    setPainData((prev) => ({
      ...prev,
      markers: [],
    }));
    setSelectedMarker(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      // Check file sizes (10MB = 10 * 1024 * 1024 bytes)
      const validFiles = files.filter((file) => file.size <= 10 * 1024 * 1024);
      if (validFiles.length !== files.length) {
        alert("Some files exceed 10MB limit and were not uploaded.");
      }
      setPainData((prev) => {
        const newImages = [...prev.uploadedImages, ...validFiles].slice(0, 5);
        const newTitles = [...prev.imageTitles];
        // Add empty titles for new images
        while (newTitles.length < newImages.length) {
          newTitles.push("");
        }
        return {
          ...prev,
          uploadedImages: newImages,
          imageTitles: newTitles,
        };
      });
    }
  };

  const removeImage = (index: number) => {
    setPainData((prev) => ({
      ...prev,
      uploadedImages: prev.uploadedImages.filter((_, i) => i !== index),
      imageTitles: prev.imageTitles.filter((_, i) => i !== index),
    }));
  };

  const updateImageTitle = (index: number, title: string) => {
    setPainData((prev) => {
      const newTitles = [...prev.imageTitles];
      newTitles[index] = title;
      return {
        ...prev,
        imageTitles: newTitles,
      };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Convert uploaded images to base64 for storage
    const imageDataPromises = painData.uploadedImages.map((file, index) => {
      return new Promise<{
        name: string;
        type: string;
        dataUrl: string;
        title: string;
      }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            type: file.type,
            dataUrl: e.target?.result as string,
            title: painData.imageTitles[index] || "",
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const savedImageData = await Promise.all(imageDataPromises);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Store data in localStorage including selected symbol and image data
    const dataToSave = {
      ...painData,
      selectedSymbol,
      savedImageData,
      uploadedImages: [], // Don't store File objects directly
    };
    localStorage.setItem("painIllustrationData", JSON.stringify(dataToSave));

    // Mark step 2 as completed
    const completedSteps = JSON.parse(
      localStorage.getItem("completedSteps") || "[]",
    );
    if (!completedSteps.includes(2)) {
      completedSteps.push(2);
      localStorage.setItem("completedSteps", JSON.stringify(completedSteps));
    }

    setIsSubmitting(false);
    setShowSuccessDialog(true);
  };

  const getMarkerIcon = (type: string) => {
    // Handle special concern types
    if (type === "primary-concern") {
      return { id: "p1-primary", label: "P1 - Primary", color: "bg-blue-600" };
    }
    if (type === "secondary-concern") {
      return {
        id: "p2-secondary",
        label: "P2 - Secondary",
        color: "bg-purple-600",
      };
    }

    const symbol = allSymbols.find((s) => s.id === type);
    return symbol || allSymbols[0];
  };

  const getCircleColor = (tailwindClass: string) => {
    const colorMap: { [key: string]: string } = {
      "bg-amber-500": "#f59e0b",
      "bg-red-600": "#dc2626",
      "bg-orange-600": "#ea580c",
      "bg-violet-600": "#7c3aed",
      "bg-slate-600": "#475569",
      "bg-cyan-500": "#06b6d4",
      "bg-emerald-600": "#059669",
      "bg-pink-600": "#db2777",
      "bg-indigo-600": "#4f46e5",
      "bg-blue-600": "#2563eb",
      "bg-purple-600": "#9333ea",
    };
    return colorMap[tailwindClass] || "#6b7280"; // Default to gray
  };

  // const BodyDiagram = ({ view, title }: { view: 'front' | 'back' | 'left' | 'right', title: string }) => (
  //   <div className="relative bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
  //     <div className="p-2 border-b bg-gray-50 rounded-t-lg">
  //       <h3 className="text-sm font-medium text-center text-gray-700">{title}</h3>
  //     </div>
  //     <div className="p-4">
  //       <svg
  //         ref={svgRefs[view]}
  //         viewBox="0 0 200 400"
  //         className="w-full h-80 cursor-crosshair border rounded bg-gray-50"
  //         onClick={(e) => handleDiagramClick(e, view)}
  //       >
  //         {/* Clean anatomical silhouettes for each view */}
  //         <g stroke="#374151" strokeWidth="2" fill="#f3f4f6">
  //           {view === 'front' && (
  //             <g>
  //               {/* Head */}
  //               <ellipse cx="100" cy="35" rx="20" ry="24" />
  //               {/* Neck */}
  //               <rect x="90" y="55" width="20" height="15" rx="5" />
  //               {/* Torso */}
  //               <path d="M 75 70 Q 70 75 70 85 L 70 120 Q 70 140 75 160 Q 80 180 85 200 L 115 200 Q 120 180 125 160 Q 130 140 130 120 L 130 85 Q 130 75 125 70 Z" />
  //               {/* Shoulders */}
  //               <ellipse cx="75" cy="80" rx="15" ry="8" />
  //               <ellipse cx="125" cy="80" rx="15" ry="8" />
  //               {/* Arms */}
  //               <rect x="45" y="85" width="15" height="80" rx="7" />
  //               <rect x="140" y="85" width="15" height="80" rx="7" />
  //               {/* Hands */}
  //               <ellipse cx="52" cy="175" rx="10" ry="15" />
  //               <ellipse cx="148" cy="175" rx="10" ry="15" />
  //               {/* Hips */}
  //               <ellipse cx="100" cy="210" rx="35" ry="15" />
  //               {/* Legs */}
  //               <rect x="80" y="220" width="18" height="100" rx="9" />
  //               <rect x="102" y="220" width="18" height="100" rx="9" />
  //               {/* Lower legs */}
  //               <rect x="82" y="320" width="14" height="60" rx="7" />
  //               <rect x="104" y="320" width="14" height="60" rx="7" />
  //               {/* Feet */}
  //               <ellipse cx="89" cy="390" rx="18" ry="8" />
  //               <ellipse cx="111" cy="390" rx="18" ry="8" />
  //             </g>
  //           )}
  //           {view === 'back' && (
  //             <g>
  //               {/* Head */}
  //               <ellipse cx="100" cy="35" rx="20" ry="24" />
  //               {/* Neck */}
  //               <rect x="90" y="55" width="20" height="15" rx="5" />
  //               {/* Torso */}
  //               <path d="M 75 70 Q 70 75 70 85 L 70 120 Q 70 140 75 160 Q 80 180 85 200 L 115 200 Q 120 180 125 160 Q 130 140 130 120 L 130 85 Q 130 75 125 70 Z" />
  //               {/* Shoulders */}
  //               <ellipse cx="75" cy="80" rx="15" ry="8" />
  //               <ellipse cx="125" cy="80" rx="15" ry="8" />
  //               {/* Spine line */}
  //               <line x1="100" y1="70" x2="100" y2="200" stroke="#6b7280" strokeWidth="1" strokeDasharray="3,2" />
  //               {/* Arms */}
  //               <rect x="45" y="85" width="15" height="80" rx="7" />
  //               <rect x="140" y="85" width="15" height="80" rx="7" />
  //               {/* Hands */}
  //               <ellipse cx="52" cy="175" rx="10" ry="15" />
  //               <ellipse cx="148" cy="175" rx="10" ry="15" />
  //               {/* Hips */}
  //               <ellipse cx="100" cy="210" rx="35" ry="15" />
  //               {/* Legs */}
  //               <rect x="80" y="220" width="18" height="100" rx="9" />
  //               <rect x="102" y="220" width="18" height="100" rx="9" />
  //               {/* Lower legs */}
  //               <rect x="82" y="320" width="14" height="60" rx="7" />
  //               <rect x="104" y="320" width="14" height="60" rx="7" />
  //               {/* Feet */}
  //               <ellipse cx="89" cy="390" rx="18" ry="8" />
  //               <ellipse cx="111" cy="390" rx="18" ry="8" />
  //             </g>
  //           )}
  //           {view === 'left' && (
  //             <g>
  //               {/* Head profile */}
  //               <path d="M 85 25 Q 90 15 105 20 Q 120 25 125 35 Q 125 45 120 50 Q 110 60 100 58 Q 88 55 85 45 Q 82 35 85 25 Z" />
  //               {/* Neck */}
  //               <rect x="95" y="55" width="12" height="15" rx="6" />
  //               {/* Torso profile */}
  //               <path d="M 85 70 Q 80 75 80 85 L 80 120 Q 80 140 85 160 Q 90 180 95 200 L 105 200 Q 115 190 120 170 Q 125 150 120 130 Q 115 110 110 90 Q 108 80 105 70 Z" />
  //               {/* Arm */}
  //               <rect x="70" y="90" width="12" height="75" rx="6" />
  //               {/* Hand */}
  //               <ellipse cx="76" cy="175" rx="8" ry="12" />
  //               {/* Hips */}
  //               <ellipse cx="100" cy="210" rx="25" ry="12" />
  //               {/* Legs */}
  //               <rect x="90" y="220" width="16" height="100" rx="8" />
  //               <rect x="92" y="320" width="12" height="60" rx="6" />
  //               {/* Foot */}
  //               <ellipse cx="98" cy="390" rx="20" ry="8" />
  //             </g>
  //           )}
  //           {view === 'right' && (
  //             <g>
  //               {/* Head profile (mirrored) */}
  //               <path d="M 115 25 Q 110 15 95 20 Q 80 25 75 35 Q 75 45 80 50 Q 90 60 100 58 Q 112 55 115 45 Q 118 35 115 25 Z" />
  //               {/* Neck */}
  //               <rect x="93" y="55" width="12" height="15" rx="6" />
  //               {/* Torso profile */}
  //               <path d="M 115 70 Q 120 75 120 85 L 120 120 Q 120 140 115 160 Q 110 180 105 200 L 95 200 Q 85 190 80 170 Q 75 150 80 130 Q 85 110 90 90 Q 92 80 95 70 Z" />
  //               {/* Arm */}
  //               <rect x="118" y="90" width="12" height="75" rx="6" />
  //               {/* Hand */}
  //               <ellipse cx="124" cy="175" rx="8" ry="12" />
  //               {/* Hips */}
  //               <ellipse cx="100" cy="210" rx="25" ry="12" />
  //               {/* Legs */}
  //               <rect x="94" y="220" width="16" height="100" rx="8" />
  //               <rect x="96" y="320" width="12" height="60" rx="6" />
  //               {/* Foot */}
  //               <ellipse cx="102" cy="390" rx="20" ry="8" />
  //             </g>
  //           )}
  //         </g>

  //         {/* Render pain markers */}
  //         {painData.markers
  //           .filter(marker => marker.view === view)
  //           .map(marker => {
  //             const markerType = getMarkerIcon(marker.type);

  //             // Get the symbol text based on marker type
  //             let symbolText = '';
  //             if (marker.type === 'primary-concern') {
  //               symbolText = 'P1';
  //             } else if (marker.type === 'secondary-concern') {
  //               symbolText = 'P2';
  //             } else if (marker.type === 'dull-ache') {
  //               symbolText = '~';
  //             } else if (marker.type === 'shooting') {
  //               symbolText = '/';
  //             } else if (marker.type === 'burning') {
  //               symbolText = 'x';
  //             } else if (marker.type === 'pins-needles') {
  //               symbolText = '•';
  //             } else if (marker.type === 'numbness') {
  //               symbolText = 'o';
  //             } else if (marker.type === 'temperature') {
  //               symbolText = 'T';
  //             } else if (marker.type === 'swelling') {
  //               symbolText = 'SW';
  //             } else if (marker.type === 'scar') {
  //               symbolText = 'S';
  //             } else if (marker.type === 'crepitus') {
  //               symbolText = 'C';
  //             } else {
  //               symbolText = '?';
  //             }

  //             return (
  //               <g key={marker.id}>
  //                 <circle
  //                   cx={marker.x * 2}
  //                   cy={marker.y * 4}
  //                   r="10"
  //                   fill={getCircleColor(markerType.color)}
  //                   className="cursor-pointer stroke-white stroke-2 opacity-90"
  //                   onClick={(e) => handleMarkerClick(marker, e)}
  //                 />
  //                 <text
  //                   x={marker.x * 2}
  //                   y={marker.y * 4 + 4}
  //                   textAnchor="middle"
  //                   className="text-xs fill-white font-bold pointer-events-none"
  //                 >
  //                   {symbolText}
  //                 </text>
  //               </g>
  //             );
  //           })}
  //       </svg>
  //     </div>
  //   </div>
  // );

  // Function to get text color that matches legend colors
  const getMarkerTextColor = (markerType: string): string => {
    switch (markerType) {
      case "primary-concern":
        return "text-blue-600";
      case "secondary-concern":
        return "text-purple-600";
      case "dull-ache":
        return "text-amber-500";
      case "shooting":
        return "text-red-600";
      case "burning":
        return "text-orange-600";
      case "pins-needles":
        return "text-violet-600";
      case "numbness":
        return "text-slate-600";
      case "temperature":
        return "text-cyan-500";
      case "swelling":
        return "text-emerald-600";
      case "scar":
        return "text-pink-600";
      case "crepitus":
        return "text-indigo-600";
      default:
        return "text-gray-600";
    }
  };

  const BodyDiagram = ({
    view,
    title,
  }: {
    view: "front" | "back" | "left" | "right";
    title: string;
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const imageSrcMap: Record<typeof view, string> = {
      front: "/humanBody/front_view.png",
      back: "/humanBody/back_view.png",
      left: "/humanBody/left_view.png",
      right: "/humanBody/right_view.png",
    };

    const handleImageClick = (
      e: React.MouseEvent<HTMLImageElement>,
      view: "front" | "back" | "left" | "right",
    ) => {
      if (!selectedSymbol) {
        setShowSymbolWarningDialog(true);
        return;
      }

      const selectedSymbolData = allSymbols.find(
        (symbol) => symbol.id === selectedSymbol,
      );
      if (!selectedSymbolData) return;

      const img = e.currentTarget;
      const rect = img.getBoundingClientRect();

      // Calculate the actual image dimensions within the container
      const naturalRatio = img.naturalWidth / img.naturalHeight;
      const containerRatio = rect.width / rect.height;

      let actualImageWidth, actualImageHeight, offsetX, offsetY;

      if (naturalRatio > containerRatio) {
        // Image is wider, constrained by width
        actualImageWidth = rect.width;
        actualImageHeight = rect.width / naturalRatio;
        offsetX = 0;
        offsetY = (rect.height - actualImageHeight) / 2;
      } else {
        // Image is taller, constrained by height
        actualImageHeight = rect.height;
        actualImageWidth = rect.height * naturalRatio;
        offsetX = (rect.width - actualImageWidth) / 2;
        offsetY = 0;
      }

      // Calculate click position relative to actual image
      const clickX = e.clientX - rect.left - offsetX;
      const clickY = e.clientY - rect.top - offsetY;

      // Convert to percentage of actual image
      const x = Math.max(0, Math.min(100, (clickX / actualImageWidth) * 100));
      const y = Math.max(0, Math.min(100, (clickY / actualImageHeight) * 100));

      let concern: "primary" | "secondary";
      let type: string;

      if (selectedSymbol === "p1-primary") {
        concern = "primary";
        type = "primary-concern";
      } else if (selectedSymbol === "p2-secondary") {
        concern = "secondary";
        type = "secondary-concern";
      } else {
        concern = "primary";
        type = selectedSymbol;
      }

      const newMarker: PainMarker = {
        id: `marker-${Date.now()}`,
        x,
        y,
        view,
        type,
        concern,
      };

      setPainData((prev) => ({
        ...prev,
        markers: [...prev.markers, newMarker],
      }));
    };

    return (
      <div className="relative bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
        <div className="p-2 border-b bg-gray-50 rounded-t-lg">
          <h3 className="text-sm font-medium text-center text-gray-700">
            {title}
          </h3>
        </div>

        <div ref={containerRef} className="relative p-4">
          <div className="relative w-full h-[28rem] lg:h-[32rem]">
            <img
              src={imageSrcMap[view]}
              alt={`${view} view`}
              className="w-full h-full object-contain bg-gray-50 cursor-crosshair"
              onClick={(e) => handleImageClick(e, view)}
            />

            {/* Overlay pain markers */}
            {painData.markers
              .filter((marker) => marker.view === view)
              .map((marker) => {
                const markerType = getMarkerIcon(marker.type);

                let symbolText = "";
                switch (marker.type) {
                  case "primary-concern":
                    symbolText = "P1";
                    break;
                  case "secondary-concern":
                    symbolText = "P2";
                    break;
                  case "dull-ache":
                    symbolText = "~";
                    break;
                  case "shooting":
                    symbolText = "/";
                    break;
                  case "burning":
                    symbolText = "x";
                    break;
                  case "pins-needles":
                    symbolText = "•";
                    break;
                  case "numbness":
                    symbolText = "o";
                    break;
                  case "temperature":
                    symbolText = "T";
                    break;
                  case "swelling":
                    symbolText = "SW";
                    break;
                  case "scar":
                    symbolText = "S";
                    break;
                  case "crepitus":
                    symbolText = "C";
                    break;
                  default:
                    symbolText = "?";
                }

                return (
                  <div
                    key={marker.id}
                    className="absolute z-10 cursor-pointer"
                    style={{
                      left: `${marker.x}%`,
                      top: `${marker.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={(e) => handleMarkerClick(marker, e)}
                  >
                    <div
                      className={`flex items-center justify-center text-lg font-bold ${getMarkerTextColor(marker.type)}`}
                      style={{
                        textShadow: "1px 1px 2px rgba(0,0,0,0.3)",
                      }}
                    >
                      {symbolText}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
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
              Pain Illustration
              {isEditMode && (
                <span className="ml-3 text-2xl text-orange-600">
                  (Edit Mode)
                </span>
              )}
            </h1>
            <p className="text-xl text-gray-600">
              {isEditMode
                ? "Update pain markers and illustration details"
                : "Click on body diagrams to mark pain locations and types"}
            </p>

            {/* Sample Pain Data Button - Only show in demo mode */}
            {isDemoMode && !isEditMode && (
              <div className="mt-6">
                <Button
                  type="button"
                  onClick={fillSamplePainData}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 shadow-lg border-2 border-green-500"
                >
                  <Circle className="mr-2 h-4 w-4" />
                  Fill Sample Pain Data & Continue
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Quick demo with pre-marked pain locations
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Body Diagrams - 4 columns */}
          <div className="lg:col-span-4">
            <Card className="shadow-lg">
              <CardHeader
                className={`text-white ${isEditMode ? "bg-orange-600" : "bg-blue-600"}`}
              >
                <CardTitle className="text-2xl flex items-center">
                  {isEditMode ? (
                    <>
                      <Edit className="mr-3 h-6 w-6" />
                      Step 2: Edit Pain Illustration
                    </>
                  ) : (
                    <>
                      <Circle className="mr-3 h-6 w-6" />
                      Step 2: Enter Claimant Pain Illustration
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                  <BodyDiagram view="front" title="Front View" />
                  <BodyDiagram view="back" title="Back View" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                  <BodyDiagram view="left" title="Left Side" />
                  <BodyDiagram view="right" title="Right Side" />
                </div>

                {/* Upload Controls */}
                <div className="space-y-4">
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("image-upload")?.click()
                      }
                      className="flex items-center"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Images (Max 10MB)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={undoLastMarker}
                      disabled={painData.markers.length === 0}
                      className="flex items-center"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Undo Last
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearAllMarkers}
                      disabled={painData.markers.length === 0}
                      className="flex items-center text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All
                    </Button>
                  </div>

                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {/* Uploaded Images Preview */}
                  {painData.uploadedImages.length > 0 && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium mb-2 block">
                        Uploaded Images
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {painData.uploadedImages.map((file, index) => (
                          <div key={index} className="relative group space-y-2">
                            <div className="relative">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Uploaded ${index + 1}`}
                                className="w-full h-32 object-contain rounded-lg border shadow-sm bg-gray-50"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeImage(index)}
                                className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-500 text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <div>
                              <Label
                                htmlFor={`image-title-${index}`}
                                className="text-xs font-medium text-gray-600"
                              >
                                Pain Title for Image {index + 1}
                              </Label>
                              <Input
                                id={`image-title-${index}`}
                                value={painData.imageTitles[index] || ""}
                                onChange={(e) =>
                                  updateImageTitle(index, e.target.value)
                                }
                                placeholder="e.g., Lower back pain area"
                                className="mt-1 text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Control Panel - 1 column */}
          <div className="lg:col-span-1">
            <div className="space-y-6 sticky top-8">
              {/* Unified Symbol Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-blue-600">
                    Select Symbol
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedSymbol || ""}
                    onValueChange={(value) => setSelectedSymbol(value || null)}
                  >
                    {allSymbols.map((symbol) => {
                      // Get the text symbol for each type
                      let textSymbol = "";
                      if (symbol.id === "p1-primary") {
                        textSymbol = "P1";
                      } else if (symbol.id === "p2-secondary") {
                        textSymbol = "P2";
                      } else if (symbol.id === "dull-ache") {
                        textSymbol = "~";
                      } else if (symbol.id === "shooting") {
                        textSymbol = "/";
                      } else if (symbol.id === "burning") {
                        textSymbol = "x";
                      } else if (symbol.id === "pins-needles") {
                        textSymbol = "•";
                      } else if (symbol.id === "numbness") {
                        textSymbol = "o";
                      } else if (symbol.id === "temperature") {
                        textSymbol = "T";
                      } else if (symbol.id === "swelling") {
                        textSymbol = "SW";
                      } else if (symbol.id === "scar") {
                        textSymbol = "S";
                      } else if (symbol.id === "crepitus") {
                        textSymbol = "C";
                      }

                      return (
                        <div
                          key={symbol.id}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem value={symbol.id} id={symbol.id} />
                          <Label
                            htmlFor={symbol.id}
                            className="flex items-center space-x-2 text-sm font-medium"
                          >
                            <div
                              className={`w-4 h-4 rounded-full ${symbol.color}`}
                            />
                            <div className="w-6 h-4 flex items-center justify-center text-sm font-bold">
                              {textSymbol}
                            </div>
                            <span>{symbol.label}</span>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isEditMode ? "Updating..." : "Saving..."}
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Save className="mr-2 h-5 w-5" />
                    {isEditMode
                      ? "Update Pain Illustration"
                      : "Save Pain Illustration"}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Symbol Warning Dialog */}
        <Dialog
          open={showSymbolWarningDialog}
          onOpenChange={setShowSymbolWarningDialog}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl text-orange-600">
                <User className="mr-3 h-6 w-6" />
                Symbol Required
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Please Select a Symbol
                </h3>
                <p className="text-gray-600">
                  Please select a symbol before adding pain markers to the body
                  diagram.
                </p>
              </div>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={() => setShowSymbolWarningDialog(false)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8"
              >
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
                    ? "Pain Illustration Updated"
                    : "Pain Illustration Saved"}
                </h3>
                <p className="text-gray-600">
                  {isEditMode
                    ? "Step 2 has been updated successfully. Your changes have been saved."
                    : "Step 2 has been completed successfully. You can now proceed to the next step."}
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
      </div>
    </div>
  );
}

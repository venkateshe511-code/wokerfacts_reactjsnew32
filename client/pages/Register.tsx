import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  X,
  Check,
  User,
  Building,
  Globe,
  Phone,
  Mail,
  FileText,
  Camera,
  RotateCcw,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { useDemoMode } from "@/hooks/use-demo-mode";
import {
  countryData,
  countries,
  getAvailableCities,
  getPostalLabel,
  getPostalPlaceholder,
} from "@/lib/countryData";

interface EvaluatorData {
  name: string;
  licenseNo: string;
  clinicName: string;
  address: string;
  country: string;
  city: string;
  zipcode: string;
  email: string;
  phone: string;
  website: string;
  profilePhoto: File | null;
  clinicLogo: File | null;
}

export default function Register() {
  const navigate = useNavigate();
  const { user, setSelectedProfileId } = useAuth();
  const isDemoMode = useDemoMode();
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get("admin") === "raygagne@12!%&A";
  const sampleAccess = isAdmin || isDemoMode;
  const [formData, setFormData] = useState<EvaluatorData>({
    name: "",
    licenseNo: "",
    clinicName: "",
    address: "",
    country: "",
    city: "",
    zipcode: "",
    email: "",
    phone: "",
    website: "",
    profilePhoto: null,
    clinicLogo: null,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enableDemoMode, setEnableDemoMode] = useState(false);

  const sampleProfileData = {
    name: "Sarah Sample, RPT",
    licenseNo: "FCE123456789",
    clinicName: "WorkerFacts Clinic",
    address: "123 Sample Drive",
    country: "United States",
    city: "New York,Ny",
    zipcode: "07008",
    email: "sarahsample@workerfactsclinic.com",
    phone: "212-111-2222",
    website: "http://www.workerfactsclinic.com/",
    profilePhoto: null,
    clinicLogo: null,
  };

  const fillSampleProfile = async () => {
    // Use assets from public folder for the demo/sample mode
    const defaultLogoPath = "/workerfacts-logo.png";
    const defaultProfilePath = "/sample-avatar.svg";
    setLogoPreview(defaultLogoPath);
    setProfilePreview(defaultProfilePath);

    setFormData(sampleProfileData);
    setEnableDemoMode(true); // Automatically enable demo mode for sample
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Store sample data in localStorage for demo
    localStorage.setItem(
      "evaluatorData",
      JSON.stringify({
        ...sampleProfileData,
        clinicLogo: defaultLogoPath,
        profilePhoto: defaultProfilePath,
      }),
    );

    // Enable demo mode for all subsequent steps
    localStorage.setItem("demoMode", "true");

    setIsSubmitting(false);
    navigate("/dashboard");
  };

  const handleInputChange = (field: keyof EvaluatorData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Reset city and zipcode when country changes
    if (field === "country") {
      setFormData((prev) => ({
        ...prev,
        city: "",
        zipcode: "",
      }));
    }

    // Auto-fill zipcode when city changes
    if (
      field === "city" &&
      formData.country &&
      countryData[formData.country]?.[value]
    ) {
      setFormData((prev) => ({
        ...prev,
        zipcode: countryData[formData.country][value],
      }));
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, clinicLogo: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, clinicLogo: null }));
    setLogoPreview(null);
  };

  const handleProfilePhotoUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profilePhoto: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePhoto = () => {
    setFormData((prev) => ({ ...prev, profilePhoto: null }));
    setProfilePreview(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      alert("Please enter your name");
      return false;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("Please enter a valid email address");
      return false;
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      alert(
        "Please enter a valid website URL (starting with http:// or https://)",
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent("/register")}`);
      return;
    }

    setIsSubmitting(true);

    // Prevent duplicate profiles: reuse an existing one with same name + clinic for this user
    try {
      const qExisting = query(collection(db, "evaluatorProfiles"), where("ownerId", "==", user.uid));
      const existingSnap = await getDocs(qExisting);
      let existingId: string | null = null;
      existingSnap.forEach((d) => {
        const data = d.data() as any;
        if (
          (data.name || "").trim().toLowerCase() === formData.name.trim().toLowerCase() &&
          (data.clinicName || "").trim().toLowerCase() === formData.clinicName.trim().toLowerCase()
        ) {
          existingId = d.id;
        }
      });

      if (existingId) {
        setSelectedProfileId(existingId);
        setIsSubmitting(false);
        navigate("/dashboard");
        return;
      }
    } catch {}

    const docRef = await addDoc(collection(db, "evaluatorProfiles"), {
      ownerId: user.uid,
      name: formData.name,
      licenseNo: formData.licenseNo,
      clinicName: formData.clinicName,
      address: formData.address,
      country: formData.country,
      city: formData.city,
      zipcode: formData.zipcode,
      email: formData.email,
      phone: formData.phone,
      website: formData.website,
      profilePhoto: profilePreview || null,
      clinicLogo: logoPreview || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setSelectedProfileId(docRef.id);

    setIsSubmitting(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Evaluator Registration
          </h1>
          <p className="text-xl text-gray-600">
            Create your professional assessment account
          </p>

          {/* Sample Profile Button - Only show for sample/demo access */}
          {sampleAccess && (
            <div className="mt-6">
              <Button
                type="button"
                onClick={fillSampleProfile}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 shadow-lg border-2 border-green-500"
              >
                <User className="mr-2 h-4 w-4" />
                Fill Sample Profile & Continue
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Quick demo with pre-filled professional data
              </p>
            </div>
          )}
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle className="text-2xl flex items-center">
              <User className="mr-3 h-6 w-6" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full break-words overflow-hidden text-ellipsis"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license" className="text-sm font-medium">
                    License Number
                  </Label>
                  <Input
                    id="license"
                    type="text"
                    value={formData.licenseNo}
                    onChange={(e) =>
                      handleInputChange("licenseNo", e.target.value)
                    }
                    className="w-full break-words overflow-hidden text-ellipsis"
                  />
                </div>
              </div>

              {/* Clinic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Clinic Information
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="clinicName" className="text-sm font-medium">
                    Clinic Name
                  </Label>
                  <Input
                    id="clinicName"
                    type="text"
                    value={formData.clinicName}
                    onChange={(e) =>
                      handleInputChange("clinicName", e.target.value)
                    }
                    className="w-full break-words overflow-hidden text-ellipsis"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Full Address
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className="w-full h-20 break-words resize-none overflow-y-auto"
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium">
                    Country
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleInputChange("country", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City
                  </Label>
                  <Select
                    onValueChange={(value) => handleInputChange("city", value)}
                    value={formData.city}
                    disabled={!formData.country}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableCities(formData.country).map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipcode" className="text-sm font-medium">
                    {getPostalLabel(formData.country)}{" "}
                    {formData.zipcode && (
                      <span className="text-green-600 text-xs">
                        (Auto-filled)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="zipcode"
                    type="text"
                    value={formData.zipcode}
                    onChange={(e) =>
                      handleInputChange("zipcode", e.target.value)
                    }
                    className="w-full"
                    disabled={!formData.city}
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Phone className="mr-2 h-5 w-5" />
                  Contact Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full break-words overflow-hidden text-ellipsis"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      className="w-full break-words overflow-hidden text-ellipsis"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm font-medium">
                    Website
                  </Label>
                  <div className="relative">
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) =>
                        handleInputChange("website", e.target.value)
                      }
                      className="w-full break-all overflow-hidden text-ellipsis pr-8"
                      title={formData.website} // Show full URL on hover
                    />
                    {formData.website && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <Globe className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  {formData.website && formData.website.length > 50 && (
                    <p className="text-xs text-gray-500 break-all">
                      Full URL: {formData.website}
                    </p>
                  )}
                </div>
              </div>

              {/* Profile Photo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Professional Profile Photo
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {profilePreview ? (
                    <div className="space-y-4">
                      <img
                        src={profilePreview}
                        alt="Profile Photo Preview"
                        className="w-32 h-32 mx-auto rounded-full object-cover shadow-md"
                      />
                      <div className="flex justify-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document.getElementById("profile-upload")?.click()
                          }
                          className="flex items-center"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Re-upload
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveProfilePhoto}
                          className="flex items-center text-red-600 hover:text-red-700"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <User className="mx-auto h-12 w-12 text-gray-400" />
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById("profile-upload")?.click()
                          }
                          className="flex items-center mx-auto"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Upload Profile Photo
                        </Button>
                        <p className="mt-2 text-sm text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Clinic Logo Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Camera className="mr-2 h-5 w-5" />
                  Clinic Logo
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {logoPreview ? (
                    <div className="space-y-4">
                      <img
                        src={logoPreview}
                        alt="Clinic Logo Preview"
                        className="max-w-48 max-h-32 mx-auto rounded-lg shadow-md"
                      />
                      <div className="flex justify-center space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document.getElementById("logo-upload")?.click()
                          }
                          className="flex items-center"
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Re-upload
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="flex items-center text-red-600 hover:text-red-700"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById("logo-upload")?.click()
                          }
                          className="flex items-center mx-auto"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Upload Clinic Logo
                        </Button>
                        <p className="mt-2 text-sm text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Check className="mr-2 h-5 w-5" />
                      Save & Continue to Dashboard
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// import React, { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
// import { Badge } from "@/components/ui/badge";
// import { toast } from "@/hooks/use-toast";
// import {
//   Upload,
//   X,
//   Check,
//   User,
//   Building,
//   Globe,
//   Phone,
//   Mail,
//   FileText,
//   Camera,
//   RotateCcw,
//   Save,
//   Plus,
//   Users,
//   Trash2,
//   UserCheck,
// } from "lucide-react";

// interface EvaluatorProfile {
//   id: string;
//   name: string;
//   licenseNo: string;
//   clinicName: string;
//   address: string;
//   country: string;
//   city: string;
//   zipcode: string;
//   email: string;
//   phone: string;
//   website: string;
//   profilePhoto: string | null; // base64 string
//   clinicLogo: string | null; // base64 string
//   createdAt: string;
//   updatedAt: string;
// }

// // Mock country data - you can replace this with your actual country data
// const mockCountries = ["United States", "Canada", "United Kingdom", "Australia", "Germany", "France"];
// const mockCities: { [key: string]: string[] } = {
//   "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"],
//   "Canada": ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
//   "United Kingdom": ["London", "Manchester", "Birmingham", "Leeds", "Glasgow"],
//   "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
//   "Germany": ["Berlin", "Munich", "Hamburg", "Cologne", "Frankfurt"],
//   "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice"],
// };

// const EVALUATOR_STORAGE_KEY = "evaluator_profiles";

// export default function Register() {
//   const [profiles, setProfiles] = useState<EvaluatorProfile[]>([]);
//   const [selectedProfileId, setSelectedProfileId] = useState<string>("");
//   const [isEditing, setIsEditing] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const [formData, setFormData] = useState({
//     name: "",
//     licenseNo: "",
//     clinicName: "",
//     address: "",
//     country: "",
//     city: "",
//     zipcode: "",
//     email: "",
//     phone: "",
//     website: "",
//     profilePhoto: null as File | null,
//     clinicLogo: null as File | null,
//   });

//   const [logoPreview, setLogoPreview] = useState<string | null>(null);
//   const [profilePreview, setProfilePreview] = useState<string | null>(null);

//   // Load profiles from localStorage on component mount
//   useEffect(() => {
//     const savedProfiles = localStorage.getItem(EVALUATOR_STORAGE_KEY);
//     if (savedProfiles) {
//       try {
//         setProfiles(JSON.parse(savedProfiles));
//       } catch (error) {
//         console.error("Error loading evaluator profiles:", error);
//       }
//     }
//   }, []);

//   // Save profiles to localStorage whenever profiles change
//   useEffect(() => {
//     localStorage.setItem(EVALUATOR_STORAGE_KEY, JSON.stringify(profiles));
//   }, [profiles]);

//   const handleInputChange = (field: string, value: string) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value
//     }));

//     // Reset city and zipcode when country changes
//     if (field === "country") {
//       setFormData(prev => ({
//         ...prev,
//         city: "",
//         zipcode: "",
//       }));
//     }
//   };

//   const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       setFormData(prev => ({ ...prev, clinicLogo: file }));
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setLogoPreview(e.target?.result as string);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleRemoveLogo = () => {
//     setFormData(prev => ({ ...prev, clinicLogo: null }));
//     setLogoPreview(null);
//   };

//   const handleProfilePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       setFormData(prev => ({ ...prev, profilePhoto: file }));
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setProfilePreview(e.target?.result as string);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleRemoveProfilePhoto = () => {
//     setFormData(prev => ({ ...prev, profilePhoto: null }));
//     setProfilePreview(null);
//   };

//   const validateForm = () => {
//     if (!formData.name.trim()) {
//       toast({
//         title: "Validation Error",
//         description: "Please enter your name",
//         variant: "destructive"
//       });
//       return false;
//     }

//     if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
//       toast({
//         title: "Validation Error",
//         description: "Please enter a valid email address",
//         variant: "destructive"
//       });
//       return false;
//     }

//     if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
//       toast({
//         title: "Validation Error",
//         description: "Please enter a valid website URL (starting with http:// or https://)",
//         variant: "destructive"
//       });
//       return false;
//     }

//     return true;
//   };

//   const handleSaveProfile = async () => {
//     if (!validateForm()) {
//       return;
//     }

//     setIsSubmitting(true);

//     // Simulate API call
//     await new Promise((resolve) => setTimeout(resolve, 1000));

//     const newProfile: EvaluatorProfile = {
//       id: isEditing ? selectedProfileId : Date.now().toString(),
//       name: formData.name,
//       licenseNo: formData.licenseNo,
//       clinicName: formData.clinicName,
//       address: formData.address,
//       country: formData.country,
//       city: formData.city,
//       zipcode: formData.zipcode,
//       email: formData.email,
//       phone: formData.phone,
//       website: formData.website,
//       profilePhoto: profilePreview,
//       clinicLogo: logoPreview,
//       createdAt: isEditing
//         ? profiles.find(p => p.id === selectedProfileId)?.createdAt || new Date().toISOString()
//         : new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };

//     if (isEditing) {
//       setProfiles(prev => prev.map(p => p.id === selectedProfileId ? newProfile : p));
//       toast({
//         title: "Profile Updated",
//         description: `Evaluator profile "${newProfile.name}" has been updated successfully.`,
//       });
//     } else {
//       setProfiles(prev => [...prev, newProfile]);
//       toast({
//         title: "Profile Saved",
//         description: `Evaluator profile "${newProfile.name}" has been saved successfully.`,
//       });
//     }

//     setIsSubmitting(false);
//     handleNewProfile(); // Reset form
//   };

//   const handleLoadProfile = (profileId: string) => {
//     const profile = profiles.find(p => p.id === profileId);
//     if (profile) {
//       setFormData({
//         name: profile.name,
//         licenseNo: profile.licenseNo,
//         clinicName: profile.clinicName,
//         address: profile.address,
//         country: profile.country,
//         city: profile.city,
//         zipcode: profile.zipcode,
//         email: profile.email,
//         phone: profile.phone,
//         website: profile.website,
//         profilePhoto: null, // Will be set from base64
//         clinicLogo: null, // Will be set from base64
//       });

//       setProfilePreview(profile.profilePhoto);
//       setLogoPreview(profile.clinicLogo);
//       setSelectedProfileId(profileId);
//       setIsEditing(true);

//       toast({
//         title: "Profile Loaded",
//         description: `Loaded profile for "${profile.name}"`,
//       });
//     }
//   };

//   const handleDeleteProfile = (profileId: string) => {
//     const profileToDelete = profiles.find(p => p.id === profileId);
//     setProfiles(prev => prev.filter(p => p.id !== profileId));

//     // If we were editing this profile, reset the form
//     if (selectedProfileId === profileId) {
//       handleNewProfile();
//     }

//     toast({
//       title: "Profile Deleted",
//       description: `Evaluator profile "${profileToDelete?.name}" has been deleted successfully.`,
//     });
//   };

//   const handleNewProfile = () => {
//     setFormData({
//       name: "",
//       licenseNo: "",
//       clinicName: "",
//       address: "",
//       country: "",
//       city: "",
//       zipcode: "",
//       email: "",
//       phone: "",
//       website: "",
//       profilePhoto: null,
//       clinicLogo: null,
//     });
//     setProfilePreview(null);
//     setLogoPreview(null);
//     setIsEditing(false);
//     setSelectedProfileId("");
//   };

//   const fillSampleProfile = () => {
//     const sampleData = {
//       name: "Dr. Sarah Johnson",
//       licenseNo: "FCE789456123",
//       clinicName: "Advanced Rehabilitation Clinic",
//       address: "456 Medical Plaza, Suite 300\nProfessional Building",
//       country: "United States",
//       city: "Chicago",
//       zipcode: "60601",
//       email: "dr.johnson@advancedrehab.com",
//       phone: "+1 (312) 555-0123",
//       website: "https://www.advancedrehab.com",
//       profilePhoto: null,
//       clinicLogo: null,
//     };

//     setFormData(sampleData);
//     toast({
//       title: "Sample Data Loaded",
//       description: "Sample evaluator profile data has been filled in.",
//     });
//   };

//   const getAvailableCities = (country: string) => {
//     return mockCities[country] || [];
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
//       <div className="container mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
//             <UserCheck className="h-10 w-10 text-indigo-600" />
//             Evaluator Profile Manager
//           </h1>
//           <p className="text-lg text-gray-600">Create, save, and manage evaluator professional profiles</p>

//           {/* Sample Profile Button */}
//           <div className="mt-6">
//             <Button
//               type="button"
//               onClick={fillSampleProfile}
//               className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
//             >
//               <User className="mr-2 h-4 w-4" />
//               Fill Sample Profile Data
//             </Button>
//             <p className="text-sm text-gray-500 mt-2">
//               Quick demo with pre-filled professional data
//             </p>
//           </div>
//         </div>

//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           <Card className="border-l-4 border-l-blue-500">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Total Evaluators</p>
//                   <p className="text-3xl font-bold text-gray-900">{profiles.length}</p>
//                 </div>
//                 <Users className="h-8 w-8 text-blue-500" />
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="border-l-4 border-l-green-500">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Current Mode</p>
//                   <p className="text-lg font-semibold text-gray-900">
//                     {isEditing ? "Editing" : "Creating"}
//                   </p>
//                 </div>
//                 <Save className="h-8 w-8 text-green-500" />
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="border-l-4 border-l-purple-500">
//             <CardContent className="p-6">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-600">Current Profile</p>
//                   <p className="text-lg font-semibold text-gray-900 truncate">
//                     {formData.name || "New Profile"}
//                   </p>
//                 </div>
//                 <Plus className="h-8 w-8 text-purple-500" />
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Profile Form */}
//           <div className="lg:col-span-2">
//             <Card className="shadow-lg">
//               <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
//                 <CardTitle className="text-xl flex items-center gap-2">
//                   <UserCheck className="h-5 w-5" />
//                   {isEditing ? "Edit Evaluator Profile" : "Create New Evaluator Profile"}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="p-8 space-y-6">
//                 {/* Personal Information */}
//                 <div className="grid md:grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <Label htmlFor="name" className="text-sm font-medium">
//                       Full Name <span className="text-red-500">*</span>
//                     </Label>
//                     <Input
//                       id="name"
//                       type="text"
//                       required
//                       value={formData.name}
//                       onChange={(e) => handleInputChange("name", e.target.value)}
//                       placeholder="Dr. John Smith"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="license" className="text-sm font-medium">
//                       License Number
//                     </Label>
//                     <Input
//                       id="license"
//                       type="text"
//                       value={formData.licenseNo}
//                       onChange={(e) => handleInputChange("licenseNo", e.target.value)}
//                       placeholder="LIC123456789"
//                     />
//                   </div>
//                 </div>

//                 {/* Clinic Information */}
//                 <div className="space-y-4">
//                   <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
//                     <Building className="mr-2 h-5 w-5" />
//                     Clinic Information
//                   </h3>
//                   <div className="space-y-2">
//                     <Label htmlFor="clinicName" className="text-sm font-medium">
//                       Clinic Name
//                     </Label>
//                     <Input
//                       id="clinicName"
//                       type="text"
//                       value={formData.clinicName}
//                       onChange={(e) => handleInputChange("clinicName", e.target.value)}
//                       placeholder="ABC Medical Center"
//                     />
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="address" className="text-sm font-medium">
//                       Full Address
//                     </Label>
//                     <Textarea
//                       id="address"
//                       value={formData.address}
//                       onChange={(e) => handleInputChange("address", e.target.value)}
//                       className="h-20 resize-none"
//                       placeholder="123 Main Street, Suite 100&#10;City, State 12345"
//                     />
//                   </div>
//                 </div>

//                 {/* Location Information */}
//                 <div className="grid md:grid-cols-3 gap-4">
//                   <div className="space-y-2">
//                     <Label htmlFor="country" className="text-sm font-medium">
//                       Country
//                     </Label>
//                     <Select
//                       value={formData.country}
//                       onValueChange={(value) => handleInputChange("country", value)}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select Country" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {mockCountries.map((country) => (
//                           <SelectItem key={country} value={country}>
//                             {country}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="city" className="text-sm font-medium">
//                       City
//                     </Label>
//                     <Select
//                       value={formData.city}
//                       onValueChange={(value) => handleInputChange("city", value)}
//                       disabled={!formData.country}
//                     >
//                       <SelectTrigger>
//                         <SelectValue
//                           placeholder={
//                             formData.country ? "Select City" : "Select Country First"
//                           }
//                         />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {getAvailableCities(formData.country).map((city) => (
//                           <SelectItem key={city} value={city}>
//                             {city}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="zipcode" className="text-sm font-medium">
//                       Zip Code
//                     </Label>
//                     <Input
//                       id="zipcode"
//                       type="text"
//                       value={formData.zipcode}
//                       onChange={(e) => handleInputChange("zipcode", e.target.value)}
//                       placeholder="12345"
//                     />
//                   </div>
//                 </div>

//                 {/* Contact Information */}
//                 <div className="space-y-4">
//                   <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
//                     <Phone className="mr-2 h-5 w-5" />
//                     Contact Information
//                   </h3>
//                   <div className="grid md:grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                       <Label htmlFor="email" className="text-sm font-medium">
//                         Email Address
//                       </Label>
//                       <Input
//                         id="email"
//                         type="email"
//                         value={formData.email}
//                         onChange={(e) => handleInputChange("email", e.target.value)}
//                         placeholder="doctor@clinic.com"
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="phone" className="text-sm font-medium">
//                         Phone Number
//                       </Label>
//                       <Input
//                         id="phone"
//                         type="tel"
//                         value={formData.phone}
//                         onChange={(e) => handleInputChange("phone", e.target.value)}
//                         placeholder="+1 (555) 123-4567"
//                       />
//                     </div>
//                   </div>
//                   <div className="space-y-2">
//                     <Label htmlFor="website" className="text-sm font-medium">
//                       Website
//                     </Label>
//                     <div className="relative">
//                       <Input
//                         id="website"
//                         type="url"
//                         value={formData.website}
//                         onChange={(e) => handleInputChange("website", e.target.value)}
//                         className="pr-8"
//                         placeholder="https://www.clinic.com"
//                       />
//                       {formData.website && (
//                         <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
//                           <Globe className="h-4 w-4 text-gray-400" />
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Profile Photo Upload */}
//                 <div className="space-y-4">
//                   <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
//                     <User className="mr-2 h-5 w-5" />
//                     Professional Profile Photo
//                   </h3>
//                   <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
//                     {profilePreview ? (
//                       <div className="space-y-4">
//                         <img
//                           src={profilePreview}
//                           alt="Profile Photo Preview"
//                           className="w-32 h-32 mx-auto rounded-full object-cover shadow-md"
//                         />
//                         <div className="flex justify-center space-x-3">
//                           <Button
//                             type="button"
//                             variant="outline"
//                             size="sm"
//                             onClick={() => document.getElementById("profile-upload")?.click()}
//                           >
//                             <RotateCcw className="mr-2 h-4 w-4" />
//                             Re-upload
//                           </Button>
//                           <Button
//                             type="button"
//                             variant="outline"
//                             size="sm"
//                             onClick={handleRemoveProfilePhoto}
//                             className="text-red-600 hover:text-red-700"
//                           >
//                             <X className="mr-2 h-4 w-4" />
//                             Remove
//                           </Button>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="space-y-4">
//                         <User className="mx-auto h-12 w-12 text-gray-400" />
//                         <div>
//                           <Button
//                             type="button"
//                             variant="outline"
//                             onClick={() => document.getElementById("profile-upload")?.click()}
//                           >
//                             <Camera className="mr-2 h-4 w-4" />
//                             Upload Profile Photo
//                           </Button>
//                           <p className="mt-2 text-sm text-gray-500">
//                             PNG, JPG, GIF up to 10MB
//                           </p>
//                         </div>
//                       </div>
//                     )}
//                     <input
//                       id="profile-upload"
//                       type="file"
//                       accept="image/*"
//                       onChange={handleProfilePhotoUpload}
//                       className="hidden"
//                     />
//                   </div>
//                 </div>

//                 {/* Clinic Logo Upload */}
//                 <div className="space-y-4">
//                   <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b pb-2">
//                     <Camera className="mr-2 h-5 w-5" />
//                     Clinic Logo
//                   </h3>
//                   <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
//                     {logoPreview ? (
//                       <div className="space-y-4">
//                         <img
//                           src={logoPreview}
//                           alt="Clinic Logo Preview"
//                           className="max-w-48 max-h-32 mx-auto rounded-lg shadow-md"
//                         />
//                         <div className="flex justify-center space-x-3">
//                           <Button
//                             type="button"
//                             variant="outline"
//                             size="sm"
//                             onClick={() => document.getElementById("logo-upload")?.click()}
//                           >
//                             <RotateCcw className="mr-2 h-4 w-4" />
//                             Re-upload
//                           </Button>
//                           <Button
//                             type="button"
//                             variant="outline"
//                             size="sm"
//                             onClick={handleRemoveLogo}
//                             className="text-red-600 hover:text-red-700"
//                           >
//                             <X className="mr-2 h-4 w-4" />
//                             Remove
//                           </Button>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="space-y-4">
//                         <Upload className="mx-auto h-12 w-12 text-gray-400" />
//                         <div>
//                           <Button
//                             type="button"
//                             variant="outline"
//                             onClick={() => document.getElementById("logo-upload")?.click()}
//                           >
//                             <Camera className="mr-2 h-4 w-4" />
//                             Upload Clinic Logo
//                           </Button>
//                           <p className="mt-2 text-sm text-gray-500">
//                             PNG, JPG, GIF up to 10MB
//                           </p>
//                         </div>
//                       </div>
//                     )}
//                     <input
//                       id="logo-upload"
//                       type="file"
//                       accept="image/*"
//                       onChange={handleLogoUpload}
//                       className="hidden"
//                     />
//                   </div>
//                 </div>

//                 {/* Action Buttons */}
//                 <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
//                   <Button
//                     onClick={handleSaveProfile}
//                     disabled={isSubmitting}
//                     className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
//                   >
//                     {isSubmitting ? (
//                       <div className="flex items-center">
//                         <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                         {isEditing ? "Updating..." : "Saving..."}
//                       </div>
//                     ) : (
//                       <>
//                         {isEditing ? (
//                           <>
//                             <Check className="mr-2 h-4 w-4" />
//                             Update Profile
//                           </>
//                         ) : (
//                           <>
//                             <Save className="mr-2 h-4 w-4" />
//                             Save Profile
//                           </>
//                         )}
//                       </>
//                     )}
//                   </Button>
//                   <Button
//                     variant="outline"
//                     onClick={handleNewProfile}
//                     className="flex-1"
//                   >
//                     <Plus className="mr-2 h-4 w-4" />
//                     New Profile
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* Saved Profiles Sidebar */}
//           <div className="space-y-6">
//             <Card className="shadow-lg">
//               <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
//                 <CardTitle className="text-lg flex items-center gap-2">
//                   <Users className="h-5 w-5" />
//                   Saved Evaluator Profiles ({profiles.length})
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="p-4">
//                 {profiles.length === 0 ? (
//                   <div className="text-center py-8">
//                     <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
//                     <p className="text-gray-500 text-sm">No evaluator profiles saved yet</p>
//                     <p className="text-gray-400 text-xs">Create your first evaluator profile to get started</p>
//                   </div>
//                 ) : (
//                   <div className="space-y-3 max-h-96 overflow-y-auto">
//                     {profiles.map((profile) => (
//                       <div
//                         key={profile.id}
//                         className={`p-4 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
//                           selectedProfileId === profile.id
//                             ? "border-indigo-500 bg-indigo-50"
//                             : "border-gray-200 hover:border-gray-300"
//                         }`}
//                         onClick={() => handleLoadProfile(profile.id)}
//                       >
//                         <div className="flex items-start justify-between">
//                           <div className="flex-1 min-w-0">
//                             <div className="flex items-center gap-2 mb-1">
//                               {profile.profilePhoto && (
//                                 <img
//                                   src={profile.profilePhoto}
//                                   alt="Profile"
//                                   className="w-8 h-8 rounded-full object-cover"
//                                 />
//                               )}
//                               <h4 className="font-semibold text-gray-900 truncate">{profile.name}</h4>
//                             </div>
//                             <p className="text-sm text-gray-600 truncate">{profile.email}</p>
//                             {profile.licenseNo && (
//                               <p className="text-xs text-gray-500">License: {profile.licenseNo}</p>
//                             )}
//                             {profile.clinicName && (
//                               <Badge variant="secondary" className="text-xs mt-1">
//                                 {profile.clinicName}
//                               </Badge>
//                             )}
//                             <p className="text-xs text-gray-400 mt-2">
//                               Created: {new Date(profile.createdAt).toLocaleDateString()}
//                             </p>
//                             {profile.updatedAt !== profile.createdAt && (
//                               <p className="text-xs text-gray-400">
//                                 Updated: {new Date(profile.updatedAt).toLocaleDateString()}
//                               </p>
//                             )}
//                           </div>
//                           <AlertDialog>
//                             <AlertDialogTrigger asChild>
//                               <Button
//                                 variant="ghost"
//                                 size="sm"
//                                 className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
//                                 onClick={(e) => e.stopPropagation()}
//                               >
//                                 <Trash2 className="h-4 w-4" />
//                               </Button>
//                             </AlertDialogTrigger>
//                             <AlertDialogContent>
//                               <AlertDialogHeader>
//                                 <AlertDialogTitle>Delete Evaluator Profile</AlertDialogTitle>
//                                 <AlertDialogDescription>
//                                   Are you sure you want to delete the evaluator profile for "{profile.name}"?
//                                   This action cannot be undone and will permanently remove all associated data.
//                                 </AlertDialogDescription>
//                               </AlertDialogHeader>
//                               <AlertDialogFooter>
//                                 <AlertDialogCancel>Cancel</AlertDialogCancel>
//                                 <AlertDialogAction
//                                   onClick={() => handleDeleteProfile(profile.id)}
//                                   className="bg-red-600 hover:bg-red-700"
//                                 >
//                                   Delete Profile
//                                 </AlertDialogAction>
//                               </AlertDialogFooter>
//                             </AlertDialogContent>
//                           </AlertDialog>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

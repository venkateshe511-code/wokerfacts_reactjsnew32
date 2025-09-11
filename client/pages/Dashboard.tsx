import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  Download,
  Play,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Edit,
  Settings,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { startCheckout } from "@/lib/payments";

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
  profilePhoto: string | null;
  clinicLogo: string | null;
}

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  icon: React.ReactNode;
}

export default function Dashboard() {
  const [checkoutRedirecting, setCheckoutRedirecting] = useState(false);
  const navigate = useNavigate();
  const isDemoMode = useDemoMode();
  const [evaluatorData, setEvaluatorData] = useState<EvaluatorData | null>(
    null,
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stripePaid, setStripePaid] = useState(false);

  const workflowSteps: WorkflowStep[] = [
    {
      id: 1,
      title: "ENTER CLAIMANT INFO",
      description: "Input basic claimant information and case details",
      status: "pending",
      icon: <User className="h-5 w-5" />,
    },
    {
      id: 2,
      title: "ENTER IN CLAIMANT PAIN ILLUSTRATION",
      description: "Document pain locations and severity levels",
      status: "pending",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 3,
      title: "COMPLETE PERCEIVED ABILITY CHART",
      description: "Assess claimant's perceived functional abilities",
      status: "pending",
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      id: 4,
      title: "ENTER IN REFERRAL QUESTIONS",
      description: "Complete referral-specific questions and requirements",
      status: "pending",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 5,
      title: "SELECT PROTOCOL OR TESTS",
      description: "Choose appropriate evaluation protocols and tests",
      status: "pending",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      id: 6,
      title: "ENTER IN TEST DATA",
      description: "Input all test results and measurements",
      status: "pending",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 7,
      title: "UPLOAD DIGITAL LIBRARY",
      description:
        "Upload documents, images, and files to your digital library",
      status: "pending",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 8,
      title: "PAY",
      description: "Process payment for evaluation report",
      status: "pending",
      icon: <CheckCircle className="h-5 w-5" />,
    },
    {
      id: 9,
      title: "REVIEW REPORT",
      description: "Review all collected data before generating final report",
      status: "pending",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 10,
      title: "DOWNLOAD REPORT",
      description: "Generate and download final evaluation report",
      status: "pending",
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  useEffect(() => {
    const savedData = localStorage.getItem("evaluatorData");
    if (savedData) {
      setEvaluatorData(JSON.parse(savedData));
    } else {
      navigate("/register");
    }

    // Load completed steps
    const savedCompletedSteps = localStorage.getItem("completedSteps");
    let completedStepsArray: number[] = [];
    if (savedCompletedSteps) {
      completedStepsArray = JSON.parse(savedCompletedSteps);
    }

    // Restore Stripe payment success state
    const savedStripe = localStorage.getItem("stripePaymentSuccess") === "1";
    if (savedStripe) setStripePaid(true);

    // If returned from Stripe success, mark payment step as completed and persist flag
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1" && !completedStepsArray.includes(8)) {
      completedStepsArray.push(8);
      localStorage.setItem(
        "completedSteps",
        JSON.stringify(completedStepsArray),
      );
      localStorage.setItem("stripePaymentSuccess", "1");
      setStripePaid(true);
      // Clean URL param
      const url = new URL(window.location.href);
      url.searchParams.delete("paid");
      window.history.replaceState({}, "", url.toString());
    }

    setCompletedSteps(completedStepsArray);

    // Auto-scroll to next available step
    const nextStep = completedStepsArray.length + 1;
    if (nextStep <= workflowSteps.length) {
      setTimeout(() => {
        const nextStepElement = document.getElementById(`step-${nextStep}`);
        if (nextStepElement) {
          nextStepElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          // Add a subtle highlight effect
          nextStepElement.classList.add(
            "ring-2",
            "ring-blue-400",
            "ring-opacity-75",
          );
          setTimeout(() => {
            nextStepElement.classList.remove(
              "ring-2",
              "ring-blue-400",
              "ring-opacity-75",
            );
          }, 2000);
        }
      }, 300);
    }
  }, [navigate]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Prevent the default back navigation
      event.preventDefault();
      window.history.pushState(null, "", window.location.href);
      setShowBackDialog(true);
    };

    // Push initial state and add listener
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleStepClick = async (stepId: number) => {
    if (checkoutRedirecting) return;
    setCurrentStep(stepId);

    // Navigate to specific step pages
    switch (stepId) {
      case 1:
        navigate("/claimant-form");
        break;
      case 2:
        navigate("/pain-illustration");
        break;
      case 3:
        navigate("/activity-rating");
        break;
      case 4:
        navigate("/referral-questions");
        break;
      case 5:
        navigate("/protocol-tests");
        break;
      case 6:
        navigate("/test-data");
        break;
      case 7:
        navigate("/upload-digital-library");
        break;
      case 8:
        {
          // const forceReal =
          //   (import.meta as any)?.env?.VITE_FORCE_REAL_PAYMENT === "true";
          // if (isDemoMode && !forceReal) {
          navigate("/payment");
          // } else {
          // try {

          //     setCheckoutRedirecting(true);
          //     await startCheckout({ amount: 25, currency: "USD" });
          //   } catch (e: any) {
          //     console.error(e);
          //     toast({
          //       title: "Payment error",
          //       description:
          //         typeof e?.message === "string"
          //           ? e.message
          //           : "Unable to start checkout. Please try again.",
          //       variant: "destructive",
          //     });
          //   } finally {
          //     // If redirect succeeds, page will navigate away; this only runs when an error occurs
          //     setCheckoutRedirecting(false);
          //   }
          // }
        }
        break;

      case 9:
        navigate("/review-report");
        break;
      case 10:
        navigate("/download-report");
        break;
      default:
        console.log(`Navigating to step ${stepId}`);
        break;
    }
  };

  const isStepAvailable = (stepId: number) => {
    // Step 1 is always available
    if (stepId === 1) return true;

    // Disable Pay step if Stripe checkout already succeeded
    if (stepId === 8 && stripePaid) return false;

    // Other steps are available only if previous step is completed
    return completedSteps.includes(stepId - 1);
  };

  const handleLogout = () => {
    if (checkoutRedirecting) return;
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    // Complete data wipe - clear ALL stored data including profile
    const keysToRemove = [
      "evaluatorData",
      "completedSteps",
      "claimantData",
      "painIllustrationData",
      "activityRatingData",
      "referralQuestionsData",
      "protocolTestsData",
      "occupationalTasksData",
      "testData",
      "mtmTestData",
      "digitalLibraryData",
      "paymentData",
      "reviewReportData",
    ];

    // Clear all evaluation data
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    // Clear any other potential data
    localStorage.clear();

    setShowLogoutDialog(false);
    navigate("/");
  };

  const cancelLogout = () => {
    setShowLogoutDialog(false);
  };

  const handleBackNavigation = () => {
    if (checkoutRedirecting) return;
    setShowBackDialog(true);
  };

  const samplePdfUrl = "/WF FCE DATA COLLECTION FORM.pdf";

  const downloadSamplePdf = async () => {
    try {
      const res = await fetch(samplePdfUrl, { mode: "cors" });
      if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "WF FCE DATA COLLECTION FORM.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      window.open(samplePdfUrl, "_blank", "noopener,noreferrer");
    }
  };

  // New informed consent doc
  // Use Firebase Cloud Function to generate informed consent docx with evaluator profile and images
  const downloadSampleDoc = async () => {
    try {
      if (!evaluatorData) {
        toast({
          title: "Profile required",
          description:
            "Please complete your evaluator profile before generating the document.",
        });
        return;
      }

      const functionPath = "https://us-central1-workerfacts-60c02.cloudfunctions.net/generateInformedConsentRouteApi";
      const payload = {
        clientProfile: {
          logo: evaluatorData.clinicLogo || evaluatorData.profilePhoto || null,
          clinicName: evaluatorData.clinicName,
          address: evaluatorData.address,
          phone: evaluatorData.phone,
          email: evaluatorData.email,
          website: evaluatorData.website,
          evaluatorName: evaluatorData.name,
        },
        images: [
          "https://cdn.builder.io/api/v1/image/assets%2F70e65ed07755445e80eef8d6022d311d%2F579c63d30eba4d8fb68cdc65e4b280c4?format=webp&width=800",
          "https://cdn.builder.io/api/v1/image/assets%2F70e65ed07755445e80eef8d6022d311d%2F0c39d5af8b534c0cbe7bf042d3a2d84f?format=webp&width=800",
          "https://cdn.builder.io/api/v1/image/assets%2F70e65ed07755445e80eef8d6022d311d%2Fcf0d8733b97d47748398622cfbf9bf4d?format=webp&width=800",
        ],
      };

      const res = await fetch(functionPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok)
        throw new Error(`Failed to generate document: ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "WF FCE Client Informed Consent.docx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast({
        title: "Generation failed",
        description: "Could not create the informed consent document.",
      });
    }
  };

  const confirmBackNavigation = () => {
    // Complete data wipe - clear ALL stored data including profile
    const keysToRemove = [
      "evaluatorData",
      "completedSteps",
      "claimantData",
      "painIllustrationData",
      "activityRatingData",
      "referralQuestionsData",
      "protocolTestsData",
      "occupationalTasksData",
      "testData",
      "mtmTestData",
      "digitalLibraryData",
      "paymentData",
      "reviewReportData",
    ];

    // Clear all evaluation data
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    // Clear any other potential data
    localStorage.clear();

    setShowBackDialog(false);
    navigate("/");
  };

  const cancelBackNavigation = () => {
    setShowBackDialog(false);
  };

  const getStepStatus = (stepId: number) => {
    if (completedSteps.includes(stepId)) return "completed";
    if (stepId === currentStep) return "in_progress";
    return "pending";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Play className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 border-green-200 hover:bg-green-100";
      case "in_progress":
        return "bg-blue-50 border-blue-200 hover:bg-blue-100";
      default:
        return "bg-gray-50 border-gray-200 hover:bg-gray-100";
    }
  };

  if (!evaluatorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-2 sm:px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <img
                src="/workerfacts-logo.png"
                alt="WorkerFacts"
                className="h-12 w-auto mr-2"
              />
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 text-center sm:text-left">
                WorkerFacts Dashboard
              </h1>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-row items-center flex-wrap justify-end space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={downloadSampleDoc}
              className="w-full sm:w-auto md:w-auto text-sm min-w-[160px] bg-gradient-to-r from-green-400 via-emerald-400 to-teal-500 text-white hover:from-green-500 hover:via-emerald-500 hover:to-teal-600 shadow-md"
            >
              <Download className="mr-2 h-4 w-4 text-white" />
              WF FCE Client Informed Consent
            </Button>
            <Button
              size="sm"
              onClick={downloadSamplePdf}
              className="w-full sm:w-auto md:w-auto text-sm min-w-[160px] bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 text-white hover:from-rose-600 hover:via-pink-600 hover:to-indigo-600 shadow-md"
            >
              <Download className="mr-2 h-4 w-4 text-white" />
              WF FCE DATA COLLECTION FORM
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/edit-profile")}
              className="w-full sm:w-auto md:w-auto text-sm min-w-[140px]"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full sm:w-auto md:w-auto text-sm min-w-[140px]"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="shadow-lg lg:sticky lg:top-8">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24">
                    <AvatarImage
                      src={evaluatorData.profilePhoto || undefined}
                      alt="Profile Photo"
                    />
                    <AvatarFallback className="bg-blue-500 text-white text-lg sm:text-xl md:text-2xl font-bold">
                      {evaluatorData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-2">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 break-words text-center max-w-full"
                  >
                    <span className="break-words">
                      Evaluator: {evaluatorData.name}
                    </span>
                  </Badge>
                  {evaluatorData.licenseNo && (
                    <Badge
                      variant="secondary"
                      className="block break-words text-center max-w-full"
                    >
                      <span className="break-words">
                        License: {evaluatorData.licenseNo}
                      </span>
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 text-sm">
                    <Building className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium break-words">
                      {evaluatorData.clinicName}
                    </span>
                  </div>
                  <div className="flex items-start space-x-3 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-600 break-words">
                        {evaluatorData.address}
                      </p>
                      <p className="text-gray-600 break-words">
                        {evaluatorData.city}, {evaluatorData.zipcode}
                      </p>
                      <p className="text-gray-600 break-words">
                        {evaluatorData.country}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 text-sm">
                    <Phone className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 break-words">
                      {evaluatorData.phone}
                    </span>
                  </div>
                  <div className="flex items-start space-x-3 text-sm">
                    <Mail className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600 break-all">
                      {evaluatorData.email}
                    </span>
                  </div>
                  {evaluatorData.website && (
                    <div className="flex items-start space-x-3 text-sm">
                      <Globe className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <a
                          href={evaluatorData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline break-all block"
                          title={evaluatorData.website}
                        >
                          {evaluatorData.website.length > 30
                            ? `${evaluatorData.website.substring(0, 30)}...`
                            : evaluatorData.website}
                        </a>
                        {evaluatorData.website.length > 30 && (
                          <div className="text-xs text-gray-500 mt-1 p-2 bg-gray-50 rounded border break-all">
                            Full URL: {evaluatorData.website}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {evaluatorData.clinicLogo && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">Clinic Logo</h4>
                    <img
                      src={evaluatorData.clinicLogo}
                      alt="Clinic Logo"
                      className="max-w-full max-h-16 mx-auto rounded shadow-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center lg:text-left">
                Evaluation Workflow
              </h2>
              <p className="text-base sm:text-lg text-gray-600 text-center lg:text-left">
                Complete the following steps to create a comprehensive
                functional capacity evaluation report.
              </p>
            </div>

            {/* Workflow Steps */}
            <div className="space-y-4">
              {workflowSteps.map((step) => {
                const status = getStepStatus(step.id);
                const isAvailable = isStepAvailable(step.id);
                return (
                  <Card
                    key={step.id}
                    id={`step-${step.id}`}
                    className={`border-2 transition-all duration-200 ${
                      isAvailable
                        ? `cursor-pointer ${getStatusColor(status)}`
                        : "cursor-not-allowed bg-gray-100 border-gray-200 opacity-50"
                    }`}
                    onClick={
                      isAvailable ? () => handleStepClick(step.id) : undefined
                    }
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(status)}
                            <div className="flex items-center space-x-2">
                              {step.icon}
                              <span className="text-2xl font-bold text-gray-400">
                                {step.id.toString().padStart(2, "0")}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {step.title}
                            </h3>
                            <p className="text-gray-600">{step.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {status === "completed" && (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700"
                            >
                              Completed
                            </Badge>
                          )}
                          {status === "in_progress" && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-700"
                            >
                              In Progress
                            </Badge>
                          )}
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Progress Summary */}
            <Card className="mt-8 bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Evaluation Progress
                    </h3>
                    <p className="text-blue-700">
                      Complete all steps to generate your professional
                      evaluation report.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {completedSteps.includes(9)
                        ? 100
                        : Math.round((completedSteps.length / 9) * 100)}
                      %
                    </div>
                    <div className="text-sm text-blue-600">Complete</div>
                  </div>
                </div>
                <div className="mt-4 bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${completedSteps.includes(9) ? 100 : (completedSteps.length / 9) * 100}%`,
                    }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-red-600">
              <LogOut className="mr-3 h-6 w-6" />
              Confirm Logout
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Warning: Complete Data Wipe
              </h3>
              <p className="text-gray-600">
                ALL data will be permanently deleted if you logout, including:
              </p>
              <div className="bg-red-50 border border-red-200 rounded p-3 text-left">
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• Your evaluator profile information</li>
                  <li>• All claimant data and test results</li>
                  <li>• Uploaded images and documents</li>
                  <li>• Payment and transaction data</li>
                  <li>• All progress and step data</li>
                </ul>
              </div>
              <p className="text-sm text-red-600 font-bold">
                You will need to register again as a new evaluator. This cannot
                be undone!
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Note: Downloading a report only clears evaluation steps, not
                your profile.
              </p>
            </div>
          </div>
          <DialogFooter className="flex space-x-3">
            <Button variant="outline" onClick={cancelLogout} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={confirmLogout}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout & Clear Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Back Navigation Confirmation Dialog */}
      <Dialog open={showBackDialog} onOpenChange={setShowBackDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-red-600">
              <ArrowLeft className="mr-3 h-6 w-6" />
              Confirm Navigation
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Warning: Complete Data Wipe
              </h3>
              <p className="text-gray-600">
                Going back to the home page will permanently delete ALL data,
                including:
              </p>
              <div className="bg-red-50 border border-red-200 rounded p-3 text-left">
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• Your evaluator profile information</li>
                  <li>• All claimant data and test results</li>
                  <li>• Uploaded images and documents</li>
                  <li>• Payment and transaction data</li>
                  <li>• All progress and step data</li>
                </ul>
              </div>
              <p className="text-sm text-red-600 font-bold">
                You will need to register again as a new evaluator. This cannot
                be undone!
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Note: Use "Download Report" to save your work before navigating
                away.
              </p>
            </div>
          </div>
          <DialogFooter className="flex space-x-3">
            <Button
              variant="outline"
              onClick={cancelBackNavigation}
              className="flex-1"
            >
              Stay on Dashboard
            </Button>
            <Button
              onClick={confirmBackNavigation}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back & Clear Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {checkoutRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 text-center border">
            <div className="flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
            </div>
            <h3 className="text-lg font-semibold mb-1">
              Redirecting to secure checkout…
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Please wait. Do not close this window or navigate away.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

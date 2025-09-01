import "./global.css";
import React from "react";

import { Toaster } from "@/components/ui/toaster";
import { createRoot, type Root } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AxzoraBranding } from "@/components/ui/axzora-branding";
import Index from "./pages/Index";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import EditProfile from "./pages/EditProfile";
import ClaimantForm from "./pages/ClaimantForm";
import PainIllustration from "./pages/PainIllustration";
import ActivityRatingChart from "./pages/ActivityRatingChart";
import ReferralQuestions from "./pages/ReferralQuestions";
import ProtocolTests from "./pages/ProtocolTests";
import TestData from "./pages/TestData";
import UploadDigitalLibrary from "./pages/UploadDigitalLibrary";
import Payment from "./pages/Payment";
import ReviewReport from "./pages/ReviewReport";
import DownloadReport from "./pages/DownloadReport";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/claimant-form" element={<ClaimantForm />} />
        <Route path="/pain-illustration" element={<PainIllustration />} />
        <Route path="/activity-rating" element={<ActivityRatingChart />} />
        <Route path="/referral-questions" element={<ReferralQuestions />} />
        <Route path="/protocol-tests" element={<ProtocolTests />} />
        <Route path="/test-data" element={<TestData />} />
        <Route
          path="/upload-digital-library"
          element={<UploadDigitalLibrary />}
        />
        <Route path="/payment" element={<Payment />} />
        <Route path="/review-report" element={<ReviewReport />} />
        <Route path="/download-report" element={<DownloadReport />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AxzoraBranding />
    </BrowserRouter>
  </QueryClientProvider>
);

// Initialize React app with proper root handling for HMR
const container = document.getElementById("root")!;

// Use a global property to track if root was already created
declare global {
  interface Window {
    __REACT_ROOT__?: Root;
  }
}

// Check if root already exists globally to prevent duplicate creation during HMR
if (!window.__REACT_ROOT__) {
  window.__REACT_ROOT__ = createRoot(container);
}

window.__REACT_ROOT__.render(<App />);

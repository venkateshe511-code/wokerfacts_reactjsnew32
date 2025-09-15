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
import Login from "./pages/Login";
import ProfileSelector from "./pages/ProfileSelector";
import { AuthProvider } from "@/hooks/use-auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/profiles"
            element={
              <ProtectedRoute>
                <ProfileSelector />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute>
                <Register />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/claimant-form"
            element={
              <ProtectedRoute>
                <ClaimantForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pain-illustration"
            element={
              <ProtectedRoute>
                <PainIllustration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity-rating"
            element={
              <ProtectedRoute>
                <ActivityRatingChart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/referral-questions"
            element={
              <ProtectedRoute>
                <ReferralQuestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/protocol-tests"
            element={
              <ProtectedRoute>
                <ProtocolTests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test-data"
            element={
              <ProtectedRoute>
                <TestData />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload-digital-library"
            element={
              <ProtectedRoute>
                <UploadDigitalLibrary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review-report"
            element={
              <ProtectedRoute>
                <ReviewReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/download-report"
            element={
              <ProtectedRoute>
                <DownloadReport />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AxzoraBranding />
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

// Initialize React app with proper root handling for HMR
const container = document.getElementById("root")!;

declare global {
  interface Window {
    __REACT_ROOT__?: Root;
  }
}

if (!window.__REACT_ROOT__) {
  window.__REACT_ROOT__ = createRoot(container);
}

window.__REACT_ROOT__.render(<App />);

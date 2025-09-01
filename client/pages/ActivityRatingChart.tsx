import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Save, Edit, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDemoMode } from "@/hooks/use-demo-mode";

interface ActivityRating {
  id: string;
  name: string;
  rating: number;
}

interface RatingData {
  activities: ActivityRating[];
}

const activityList = [
  { id: "standing", name: "Standing" },
  { id: "sitting", name: "Sitting" },
  { id: "feeling", name: "Feeling" },
  { id: "fingering", name: "Fingering" },
  { id: "handling", name: "Handling" },
  { id: "reaching", name: "Reaching" },
  { id: "crawling", name: "Crawling" },
  { id: "crouching", name: "Crouching" },
  { id: "kneeling", name: "Kneeling" },
  { id: "stoop-bend", name: "Stoop/Bend" },
  { id: "balance", name: "Balance" },
  { id: "climbing", name: "Climbing" },
  { id: "walking", name: "Walking" },
  { id: "push-pull", name: "Push/Pull" },
  { id: "carrying", name: "Carrying" },
  { id: "lifting-50", name: "Lifting 50 Lbs" },
  { id: "lifting-20", name: "Lifting 20 Lbs" },
  { id: "lifting-10", name: "Lifting 10 Lbs" },
];

export default function ActivityRatingChart() {
  const navigate = useNavigate();
  const isDemoMode = useDemoMode();
  const [ratingData, setRatingData] = useState<RatingData>({
    activities: activityList.map((activity) => ({
      id: activity.id,
      name: activity.name,
      rating: 0,
    })),
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sampleActivityRatings = {
    activities: [
      { id: "standing", name: "Standing", rating: 6 },
      { id: "sitting", name: "Sitting", rating: 8 },
      { id: "feeling", name: "Feeling", rating: 9 },
      { id: "fingering", name: "Fingering", rating: 9 },
      { id: "handling", name: "Handling", rating: 7 },
      { id: "reaching", name: "Reaching", rating: 5 },
      { id: "crawling", name: "Crawling", rating: 2 },
      { id: "crouching", name: "Crouching", rating: 3 },
      { id: "kneeling", name: "Kneeling", rating: 4 },
      { id: "stoop-bend", name: "Stoop/Bend", rating: 3 },
      { id: "balance", name: "Balance", rating: 7 },
      { id: "climbing", name: "Climbing", rating: 2 },
      { id: "walking", name: "Walking", rating: 6 },
      { id: "push-pull", name: "Push/Pull", rating: 4 },
      { id: "carrying", name: "Carrying", rating: 5 },
      { id: "lifting-50", name: "Lifting 50 Lbs", rating: 1 },
      { id: "lifting-20", name: "Lifting 20 Lbs", rating: 3 },
      { id: "lifting-10", name: "Lifting 10 Lbs", rating: 6 },
    ],
  };

  const fillSampleActivityRatings = async () => {
    setRatingData(sampleActivityRatings);
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Store sample data in localStorage
    localStorage.setItem(
      "activityRatingData",
      JSON.stringify(sampleActivityRatings),
    );

    // Update completed steps
    const completedSteps = JSON.parse(
      localStorage.getItem("completedSteps") || "[]",
    );
    if (!completedSteps.includes(3)) {
      completedSteps.push(3);
      localStorage.setItem("completedSteps", JSON.stringify(completedSteps));
    }

    setIsSubmitting(false);
    setShowSuccessDialog(true);
  };

  useEffect(() => {
    // Check if we have existing rating data (edit mode)
    const existingData = localStorage.getItem("activityRatingData");
    if (existingData) {
      const savedData = JSON.parse(existingData);
      setRatingData(savedData);
      setIsEditMode(true);
    }
  }, []);

  const handleBarClick = (
    activityId: string,
    clickX: number,
    barWidth: number,
  ) => {
    // Calculate rating based on click position (0-10 scale)
    const rating = Math.max(
      0,
      Math.min(10, Math.round((clickX / barWidth) * 10)),
    );

    setRatingData((prev) => ({
      ...prev,
      activities: prev.activities.map((activity) =>
        activity.id === activityId ? { ...activity, rating } : activity,
      ),
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Store data in localStorage
    localStorage.setItem("activityRatingData", JSON.stringify(ratingData));

    // Mark step 3 as completed
    const completedSteps = JSON.parse(
      localStorage.getItem("completedSteps") || "[]",
    );
    if (!completedSteps.includes(3)) {
      completedSteps.push(3);
      localStorage.setItem("completedSteps", JSON.stringify(completedSteps));
    }

    setIsSubmitting(false);
    setShowSuccessDialog(true);
  };

  const ActivityBar = ({
    activity,
    index,
  }: {
    activity: ActivityRating;
    index: number;
  }) => {
    // Define different colors for each activity (matching ReviewReport style)
    const barColors = [
      "#D4A574", // Yellow/gold
      "#5B9BD5", // Blue
      "#70AD47", // Green
      "#C55A5A", // Red
      "#E87D5A", // Orange
      "#9575CD", // Purple
      "#4FC3F7", // Light blue
      "#66BB6A", // Light green
      "#FFB74D", // Orange yellow
      "#F06292", // Pink
      "#81C784", // Green
      "#64B5F6", // Blue
      "#FFD54F", // Yellow
      "#A1887F", // Brown
      "#90A4AE", // Blue grey
      "#3B82F6", // Blue-500
      "#10B981", // Green-500
      "#F59E0B", // Yellow-500
    ];

    return (
      <div
        className="flex items-center"
        style={{ margin: 0, padding: 0, lineHeight: 0, display: "flex" }}
      >
        <div
          className="w-20 text-xs font-medium pr-2"
          style={{
            height: "20px",
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {activity.name}
        </div>
        <div
          className="flex-1 mx-1"
          style={{
            margin: 0,
            borderLeft: "1px solid #374151",
            borderBottom:
              index === ratingData.activities.length - 1
                ? "1px solid #374151"
                : "none",
          }}
        >
          <div
            className="h-5 relative cursor-pointer"
            style={{
              height: "20px",
              background:
                "linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)",
              backgroundSize: "10px 10px",
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              handleBarClick(activity.id, clickX, rect.width);
            }}
          >
            <div
              className="h-5 flex items-center justify-end pr-1 transition-all duration-200 ease-out"
              style={{
                width: `${(activity.rating / 10) * 100}%`,
                backgroundColor: barColors[index % barColors.length],
                height: "20px",
                border: "1px solid #374151",
                borderLeft: "none",
              }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

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
              Activity Rating Chart
              {isEditMode && (
                <span className="ml-3 text-2xl text-orange-600">
                  (Edit Mode)
                </span>
              )}
            </h1>
            <p className="text-xl text-gray-600">
              {isEditMode
                ? "Update activity ratings by clicking on the bars"
                : "Click on each bar to set the rating from 0 to 10 for each activity"}
            </p>

            {/* Sample Activity Rating Button - Only show in demo mode */}
            {isDemoMode && !isEditMode && (
              <div className="mt-6">
                <Button
                  type="button"
                  onClick={fillSampleActivityRatings}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 shadow-lg border-2 border-green-500"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Fill Sample Activity Ratings & Continue
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Quick demo with pre-filled activity ratings
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
                  Step 3: Edit Activity Rating Chart
                </>
              ) : (
                <>
                  <div className="w-6 h-6 mr-3 bg-white text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  Step 3: Complete Perceived Ability Chart
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Activity Rating Chart
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                  <strong>Instructions:</strong> For each activity, click on the
                  number scale to select a value from 0 to 10. 0 means you
                  cannot perform the activity at all, and 10 means you can
                  perform it without any difficulty.
                </p>
              </div>
            </div>

            <div className="p-1 bg-white max-w-3xl mx-auto border border-gray-400">
              <div>
                {ratingData.activities.map((activity, index) => (
                  <ActivityBar
                    key={activity.id}
                    activity={activity}
                    index={index}
                  />
                ))}
              </div>

              {/* Scale indicators at bottom (exact copy from ReviewReport) */}
              <div className="mt-1 flex items-center">
                <div className="w-20"></div>
                <div className="flex-1 mx-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>0</span>
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                    <span>6</span>
                    <span>7</span>
                    <span>8</span>
                    <span>9</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                For each activity, click the number scale to select a value from
                0 to 10
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isEditMode ? "Updating..." : "Saving..."}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Save className="mr-2 h-5 w-5" />
                    {isEditMode
                      ? "Update Activity Ratings"
                      : "Save Activity Ratings"}
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
                    ? "Activity Ratings Updated"
                    : "Activity Ratings Saved"}
                </h3>
                <p className="text-gray-600">
                  {isEditMode
                    ? "Step 3 has been updated successfully. Your changes have been saved."
                    : "Step 3 has been completed successfully. You can now proceed to the next step."}
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

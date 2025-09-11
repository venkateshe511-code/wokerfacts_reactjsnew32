import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mtmDescriptions } from "./mtm-descriptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calculateStandardTime,
  calculatePercentIS,
} from "@shared/mtm-standards";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Pause, RotateCcw, Save } from "lucide-react";

interface TrialData {
  trial: number;
  side: string;
  plane: string;
  position: string;
  reps: number;
  testTime: number;
  percentIS: number;
  totalCompleted: number;
}

interface TestParameters {
  numberOfTrials: number;
  numberOfReps: number;
  bodySide?: string;
  plane?: string;
  position?: string;
  direction?: string;
  weight?: number;
  distance?: number;
  weightOptions?: number[];
}

interface MTMTestInterfaceProps {
  testName: string;
  testType: string;
  parameters: TestParameters;
  onSave: (data: any) => void;
  onBack: () => void;
}

export default function MTMTestInterface({
  testName,
  testType,
  parameters,
  onSave,
  onBack,
}: MTMTestInterfaceProps) {
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [currentTrial, setCurrentTrial] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [testTime, setTestTime] = useState<number>(0);
  const [hrPre, setHrPre] = useState<number>(0);
  const [hrPost, setHrPost] = useState<number>(0);
  const [percentIS, setPercentIS] = useState<number>(0);
  const [standardTime, setStandardTime] = useState<number>(0);

  // Test-specific parameter states
  const [selectedSide, setSelectedSide] = useState(
    parameters.bodySide || "Both",
  );
  const [selectedPlane, setSelectedPlane] = useState(parameters.plane || "");
  const [selectedPosition, setSelectedPosition] = useState(
    parameters.position || "Standing",
  );
  const [selectedDirection, setSelectedDirection] = useState(
    parameters.direction || "Both",
  );
  const [selectedWeight, setSelectedWeight] = useState(parameters.weight || 0);
  const [selectedDistance, setSelectedDistance] = useState(
    parameters.distance || 0,
  );
  const [selectedReps, setSelectedReps] = useState(
    parameters.numberOfReps || 10,
  );

  // Calculate standard time when parameters change
  useEffect(() => {
    const calcStandardTime = calculateStandardTime(testType, {
      weight: selectedWeight,
      distance: selectedDistance,
      reps: selectedReps,
      difficulty: "medium",
    });
    setStandardTime(calcStandardTime);
  }, [testType, selectedWeight, selectedDistance, selectedReps]);

  // Auto-calculate %IS when test time changes
  useEffect(() => {
    if (testTime > 0 && standardTime > 0) {
      const calculatedPercentIS = calculatePercentIS(testTime, standardTime);
      setPercentIS(calculatedPercentIS);
    }
  }, [testTime, standardTime]);

  const startTest = () => {
    setIsRunning(true);
    setStartTime(Date.now());
  };

  const stopTest = () => {
    if (!isRunning || !startTime) return;

    setIsRunning(false);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    setTestTime(duration);

    // Add trial data
    const newTrial: TrialData = {
      trial: currentTrial,
      side: selectedSide,
      plane: selectedPlane,
      position: selectedPosition,
      reps: parameters.numberOfReps,
      testTime: duration,
      percentIS: calculatePercentIS(duration, standardTime),
      totalCompleted:
        duration * (calculatePercentIS(duration, standardTime) / 100),
    };

    setTrials((prev) => [...prev, newTrial]);
    setCurrentTrial((prev) => prev + 1);
  };

  const resetTest = () => {
    setIsRunning(false);
    setStartTime(null);
    setTestTime(0);
    setTrials([]);
    setCurrentTrial(1);
  };

  const renderParameterControls = () => {
    switch (testType) {
      case "fingering":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Body Side(s):
              </label>
              <Select value={selectedSide} onValueChange={setSelectedSide}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Reps per Trial:
              </label>
              <Input
                type="number"
                value={selectedReps}
                onChange={(e) =>
                  setSelectedReps(parseInt(e.target.value) || 10)
                }
                className="bg-white"
                min="1"
                max="20"
              />
            </div>
          </div>
        );

      case "bi-manual-fingering":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Body Side(s):
              </label>
              <div className="bg-white p-2 rounded border text-center">
                Both (Bi-Manual)
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Reps per Trial:
              </label>
              <Input
                type="number"
                value={selectedReps}
                onChange={(e) =>
                  setSelectedReps(parseInt(e.target.value) || 10)
                }
                className="bg-white"
                min="1"
                max="20"
              />
            </div>
          </div>
        );

      case "handling":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Body Side(s):
              </label>
              <Select value={selectedSide} onValueChange={setSelectedSide}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Object Type:
              </label>
              <Select value={selectedPlane} onValueChange={setSelectedPlane}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small">Small Objects</SelectItem>
                  <SelectItem value="Medium">Medium Objects</SelectItem>
                  <SelectItem value="Large">Large Objects</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "bi-manual-handling":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Body Side(s):
              </label>
              <div className="bg-white p-2 rounded border text-center">
                Both (Bi-Manual)
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Object Type:
              </label>
              <Select value={selectedPlane} onValueChange={setSelectedPlane}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Small">Small Objects</SelectItem>
                  <SelectItem value="Medium">Medium Objects</SelectItem>
                  <SelectItem value="Large">Large Objects</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "reach-immediate":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Body Side(s):
              </label>
              <Select value={selectedSide} onValueChange={setSelectedSide}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Reach Distance:
              </label>
              <div className="bg-white p-2 rounded border text-center">
                Immediate (12 inches)
              </div>
            </div>
          </div>
        );

      case "reach-overhead":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Body Side(s):
              </label>
              <Select value={selectedSide} onValueChange={setSelectedSide}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Reach Type:
              </label>
              <div className="bg-white p-2 rounded border text-center">
                Overhead Position
              </div>
            </div>
          </div>
        );

      case "reach-with-weight":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Body Side(s):
              </label>
              <Select value={selectedSide} onValueChange={setSelectedSide}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Weight:
              </label>
              <Select
                value={selectedWeight.toString()}
                onValueChange={(value) => setSelectedWeight(Number(value))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 lbs</SelectItem>
                  <SelectItem value="10">10 lbs</SelectItem>
                  <SelectItem value="15">15 lbs</SelectItem>
                  <SelectItem value="20">20 lbs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "balance":
        return (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Direction:
              </label>
              <Select
                value={selectedDirection}
                onValueChange={setSelectedDirection}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="Forward">Forward</SelectItem>
                  <SelectItem value="Backward">Backward</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Weight:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={selectedWeight}
                  onChange={(e) => setSelectedWeight(Number(e.target.value))}
                  className="bg-white flex-1"
                />
                <span className="text-white text-sm">Lb</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Distance:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={selectedDistance}
                  onChange={(e) => setSelectedDistance(Number(e.target.value))}
                  className="bg-white flex-1"
                />
                <span className="text-white text-sm">paces</span>
              </div>
            </div>
          </div>
        );

      case "stoop":
      case "crouch":
      case "crawl":
      case "kneel":
        return (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Body Side(s):
              </label>
              <Select value={selectedSide} onValueChange={setSelectedSide}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Weight:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={selectedWeight}
                  onChange={(e) => setSelectedWeight(Number(e.target.value))}
                  className="bg-white flex-1"
                />
                <span className="text-white text-sm">Lb</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Distance:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={selectedDistance}
                  onChange={(e) => setSelectedDistance(Number(e.target.value))}
                  className="bg-white flex-1"
                />
                <span className="text-white text-sm">ft</span>
              </div>
            </div>
          </div>
        );

      case "climb-stairs":
      case "climb-ladder":
        return (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Direction:
              </label>
              <Select
                value={selectedDirection}
                onValueChange={setSelectedDirection}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="Up">Up</SelectItem>
                  <SelectItem value="Down">Down</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Weight:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={selectedWeight}
                  onChange={(e) => setSelectedWeight(Number(e.target.value))}
                  className="bg-white flex-1"
                />
                <span className="text-white text-sm">Lb</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Distance:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={selectedDistance}
                  onChange={(e) => setSelectedDistance(Number(e.target.value))}
                  className="bg-white flex-1"
                />
                <span className="text-white text-sm">
                  {testType === "climb-stairs" ? "stairs" : "rungs"}
                </span>
              </div>
            </div>
          </div>
        );

      case "carry":
        return (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Body Side(s):
              </label>
              <Select value={selectedSide} onValueChange={setSelectedSide}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Weight:
              </label>
              <div className="flex gap-2">
                {[10, 20, 50].map((weight) => (
                  <Button
                    key={weight}
                    variant={selectedWeight === weight ? "default" : "outline"}
                    onClick={() => setSelectedWeight(weight)}
                    className="flex-1 text-xs"
                  >
                    {weight}
                  </Button>
                ))}
                <span className="text-white text-sm self-center">Lb</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Distance:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={selectedDistance}
                  onChange={(e) => setSelectedDistance(Number(e.target.value))}
                  className="bg-white flex-1"
                />
                <span className="text-white text-sm">ft</span>
              </div>
            </div>
          </div>
        );

      case "push-pull-cart":
        return (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Direction:
              </label>
              <Select
                value={selectedDirection}
                onValueChange={setSelectedDirection}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="Push">Push</SelectItem>
                  <SelectItem value="Pull">Pull</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Weight:
              </label>
              <div className="flex gap-2">
                {[40, 50, 60].map((weight) => (
                  <Button
                    key={weight}
                    variant={selectedWeight === weight ? "default" : "outline"}
                    onClick={() => setSelectedWeight(weight)}
                    className="flex-1 text-xs"
                  >
                    {weight}
                  </Button>
                ))}
                <span className="text-white text-sm self-center">Lb</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Distance:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={selectedDistance}
                  onChange={(e) => setSelectedDistance(Number(e.target.value))}
                  className="bg-white flex-1"
                />
                <span className="text-white text-sm">ft</span>
              </div>
            </div>
          </div>
        );

      case "walk":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Direction:
              </label>
              <Select
                value={selectedDirection}
                onValueChange={setSelectedDirection}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Forward">Forward</SelectItem>
                  <SelectItem value="Backward">Backward</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Distance:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={selectedDistance}
                  onChange={(e) => setSelectedDistance(Number(e.target.value))}
                  className="bg-white flex-1"
                />
                <span className="text-white text-sm">feet</span>
              </div>
            </div>
          </div>
        );

      case "stoop":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Body Side(s):
              </label>
              <Select value={selectedSide} onValueChange={setSelectedSide}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Duration:
              </label>
              <div className="bg-white p-2 rounded border text-center">
                6 repetitions
              </div>
            </div>
          </div>
        );

      case "crouch":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Body Side(s):
              </label>
              <Select value={selectedSide} onValueChange={setSelectedSide}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Both">Both</SelectItem>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Position:
              </label>
              <div className="bg-white p-2 rounded border text-center">
                Crouching Position
              </div>
            </div>
          </div>
        );

      case "crawl":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Direction:
              </label>
              <Select
                value={selectedDirection}
                onValueChange={setSelectedDirection}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Forward">Forward</SelectItem>
                  <SelectItem value="Backward">Backward</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Distance:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={selectedDistance}
                  onChange={(e) => setSelectedDistance(Number(e.target.value))}
                  className="bg-white flex-1"
                />
                <span className="text-white text-sm">feet</span>
              </div>
            </div>
          </div>
        );

      default:
        // Standardized MTM interface for all occupational task tests
        return (
          <div className="mb-6">
            {/* Number of Trials Selector */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-white font-medium">Number of Trials:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (trials.length > 3) {
                      setTrials((prev) => prev.slice(0, -1));
                    }
                  }}
                  disabled={trials.length <= 3}
                  className="bg-white text-gray-800"
                >
                  −
                </Button>
                <span className="text-white font-bold text-lg px-4">
                  {trials.length || parameters.numberOfTrials || 3}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (trials.length < 8) {
                      setTrials((prev) => [
                        ...prev,
                        {
                          trial: prev.length + 1,
                          side: "Both",
                          plane: "",
                          position: "Standing",
                          reps: parameters.numberOfReps || 6,
                          testTime: 0,
                          percentIS: 0,
                          totalCompleted: 0,
                        },
                      ]);
                    }
                  }}
                  disabled={trials.length >= 8}
                  className="bg-white text-gray-800"
                >
                  +
                </Button>
                <span className="text-white text-sm ml-2">(3-8 trials)</span>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <Button variant="outline" onClick={onBack} className="mb-4">
            ← Back to Tests
          </Button>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            MTM - {testName}
          </h1>
          {mtmDescriptions[testType] && (
            <div className="mt-3 text-sm text-gray-700 p-3 rounded bg-white whitespace-pre-line">
              <strong>MTM Description:</strong>
              <p className="mt-1">{mtmDescriptions[testType]}</p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Trial Results Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle>Trial Results</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-700 text-white">
                      <tr>
                        <th className="px-3 py-2 text-left">Trial</th>
                        <th className="px-3 py-2 text-left">Side</th>
                        <th className="px-3 py-2 text-left">Plane</th>
                        <th className="px-3 py-2 text-left">Position</th>
                        <th className="px-3 py-2 text-left">Reps</th>
                        <th className="px-3 py-2 text-left">Test Time</th>
                        <th className="px-3 py-2 text-left">% IS</th>
                        <th className="px-3 py-2 text-left">
                          Total of Completed Set
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {trials.map((trial, index) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-gray-50" : "bg-white"
                          }
                        >
                          <td className="px-3 py-2">{trial.trial}</td>
                          <td className="px-3 py-2">{trial.side}</td>
                          <td className="px-3 py-2">{trial.plane}</td>
                          <td className="px-3 py-2">{trial.position}</td>
                          <td className="px-3 py-2">{trial.reps}</td>
                          <td className="px-3 py-2">
                            {trial.testTime.toFixed(1)}
                          </td>
                          <td className="px-3 py-2">
                            {trial.percentIS > 0
                              ? trial.percentIS.toFixed(1)
                              : ""}
                          </td>
                          <td className="px-3 py-2">
                            {trial.totalCompleted.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                      {trials.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-3 py-8 text-center text-gray-500"
                          >
                            No trials completed yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Controls */}
          <div className="space-y-6">
            {/* Test Parameters */}
            <Card>
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle>Test Parameters</CardTitle>
              </CardHeader>
              <CardContent className="bg-blue-500 text-white p-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Number of Trials:
                      </label>
                      <Input
                        type="number"
                        value={parameters.numberOfTrials}
                        className="bg-white text-black"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Number of Reps:
                      </label>
                      <Input
                        type="number"
                        value={parameters.numberOfReps}
                        className="bg-white text-black"
                        readOnly
                      />
                    </div>
                  </div>

                  {renderParameterControls()}

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Position:
                    </label>
                    <Input
                      value={selectedPosition}
                      className="bg-white text-black"
                      readOnly
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button className="bg-blue-700 hover:bg-blue-800">
                      HR: Pre
                    </Button>
                    <Button className="bg-blue-700 hover:bg-blue-800">
                      HR: Post
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Trial Info */}
            <Card>
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle>Trial {currentTrial}</CardTitle>
              </CardHeader>
              <CardContent className="bg-blue-500 text-white p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Test Time:
                    </label>
                    <Input
                      value={testTime.toFixed(1)}
                      className="bg-white text-black text-lg font-bold"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Percent IS (Auto-calculated):
                    </label>
                    <Input
                      type="number"
                      value={percentIS > 0 ? percentIS.toFixed(1) : ""}
                      className="bg-gray-100 text-black"
                      readOnly
                      title="Automatically calculated: (Standard Time / Actual Time) × 100"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Standard Time:
                    </label>
                    <Input
                      type="number"
                      value={standardTime.toFixed(1)}
                      className="bg-gray-100 text-black"
                      readOnly
                      title="MTM standard time for this task with current parameters"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Control Buttons */}
            <div className="space-y-3">
              <Button
                onClick={isRunning ? stopTest : startTest}
                className={`w-full ${
                  isRunning
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                disabled={currentTrial > parameters.numberOfTrials}
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Stop Test
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Test
                  </>
                )}
              </Button>

              <Button onClick={resetTest} variant="outline" className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>

              <Button
                onClick={() =>
                  onSave({
                    testName,
                    testType,
                    trials,
                    parameters: {
                      ...parameters,
                      selectedSide,
                      selectedPlane,
                      selectedPosition,
                      selectedDirection,
                      selectedWeight,
                      selectedDistance,
                    },
                  })
                }
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={trials.length === 0}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Test Data
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

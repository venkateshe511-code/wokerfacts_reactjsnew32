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
import { Play, Pause, RotateCcw, Save, ArrowLeft } from "lucide-react";

interface CarryTrialData {
  trial: number;
  side: string;
  plane: string;
  position: string;
  weight: number;
  distance: number;
  reps: number;
  testTime: number;
  percentIS: number;
}

interface CarryTestInterfaceProps {
  onSave: (data: any) => void;
  onBack: () => void;
}

export default function CarryTestInterface({
  onSave,
  onBack,
}: CarryTestInterfaceProps) {
  const [trials, setTrials] = useState<CarryTrialData[]>([]);
  const [currentTrial, setCurrentTrial] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [testTime, setTestTime] = useState<number>(0);

  // Test parameters based on handwritten specification
  const [selectedSide, setSelectedSide] = useState("Left");
  const [selectedPlane, setSelectedPlane] = useState("Front");
  const [selectedPosition, setSelectedPosition] = useState("Standing");
  const [selectedWeight, setSelectedWeight] = useState(10);
  const [selectedDistance, setSelectedDistance] = useState(4); // feet
  const [selectedReps, setSelectedReps] = useState(6);
  const [percentIS, setPercentIS] = useState<number>(0);
  const [standardTime, setStandardTime] = useState<number>(0);

  // Calculate standard time when parameters change
  useEffect(() => {
    const calcStandardTime = calculateStandardTime("carry", {
      weight: selectedWeight,
      distance: selectedDistance,
      reps: selectedReps,
      difficulty: "medium",
    });
    setStandardTime(calcStandardTime);
  }, [selectedWeight, selectedDistance, selectedReps]);

  // Auto-calculate %IS when test time changes
  useEffect(() => {
    if (testTime > 0 && standardTime > 0) {
      const calculatedPercentIS = calculatePercentIS(testTime, standardTime);
      setPercentIS(calculatedPercentIS);
    }
  }, [testTime, standardTime]);

  // HR tracking
  const [hrPre, setHrPre] = useState<number>(0);
  const [hrPost, setHrPost] = useState<number>(0);

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
    const newTrial: CarryTrialData = {
      trial: currentTrial,
      side: selectedSide,
      plane: selectedPlane,
      position: selectedPosition,
      weight: selectedWeight,
      distance: selectedDistance,
      reps: selectedReps,
      testTime: duration,
      percentIS: calculatePercentIS(duration, standardTime),
    };

    setTrials((prev) => [...prev, newTrial]);
    setCurrentTrial((prev) => prev + 1);
    setTestTime(0);
    setPercentIS(0);
  };

  const resetTest = () => {
    setIsRunning(false);
    setStartTime(null);
    setTestTime(0);
    setTrials([]);
    setCurrentTrial(1);
    setPercentIS(0);
  };

  // Calculate total IS% average
  const calculateAverageIS = () => {
    if (trials.length === 0) return 0;
    const total = trials.reduce((sum, trial) => sum + trial.percentIS, 0);
    return (total / trials.length).toFixed(1);
  };

  const handleSave = () => {
    const testData = {
      testType: "carrying",
      trials: trials,
      hrPre: hrPre,
      hrPost: hrPost,
      averageIS: calculateAverageIS(),
      totalTrials: trials.length,
      completedAt: new Date().toISOString(),
    };
    onSave(testData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={onBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tests
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              OCCUPATIONAL TASKS
            </h1>
            <h2 className="text-xl font-semibold text-blue-700 mb-2">
              USING METHODS TIME MEASUREMENT ANALYSIS (MTM)
            </h2>
            <div className="inline-block border-2 border-gray-400 px-4 py-2 bg-gray-100">
              <span className="font-bold">TEST TYPE: </span>
              <span className="font-bold text-blue-800">CARRYING</span>
            </div>
            {mtmDescriptions["carry"] && (
              <div className="mt-3 text-sm text-gray-800 p-4 rounded-lg bg-gradient-to-r from-purple-50 via-blue-50 to-teal-50 border shadow-sm whitespace-pre-line">
                <p className="mt-1">{mtmDescriptions["carry"]}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Data Table - Takes up most space */}
          <div className="lg:col-span-3">
            <Card className="shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    {/* Header Row */}
                    <thead>
                      <tr className="bg-yellow-300 border-2 border-gray-400">
                        <th className="border-2 border-gray-400 px-3 py-2 text-center font-bold">
                          TRIAL
                        </th>
                        <th className="border-2 border-gray-400 px-3 py-2 text-center font-bold">
                          SIDE
                        </th>
                        <th className="border-2 border-gray-400 px-3 py-2 text-center font-bold">
                          PLANE
                        </th>
                        <th className="border-2 border-gray-400 px-3 py-2 text-center font-bold">
                          POSITION
                        </th>
                        <th className="border-2 border-gray-400 px-3 py-2 text-center font-bold">
                          WEIGHT
                        </th>
                        <th className="border-2 border-gray-400 px-3 py-2 text-center font-bold">
                          DISTANCE
                        </th>
                        <th className="border-2 border-gray-400 px-3 py-2 text-center font-bold">
                          REPS
                        </th>
                        <th className="border-2 border-gray-400 px-3 py-2 text-center font-bold">
                          TIME
                        </th>
                        <th className="border-2 border-gray-400 px-3 py-2 text-center font-bold">
                          % IS
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Row for trial options/reference */}
                      <tr className="bg-gray-100 text-xs">
                        <td className="border-2 border-gray-400 px-2 py-1 text-center">
                          1-10
                        </td>
                        <td className="border-2 border-gray-400 px-2 py-1">
                          <div className="text-center">
                            <div>LEFT ▲</div>
                            <div>RIGHT ▼</div>
                            <div>BOTH</div>
                            <div>L/R</div>
                            <div>R/L</div>
                          </div>
                        </td>
                        <td className="border-2 border-gray-400 px-2 py-1">
                          <div className="text-center">
                            <div>FRONT ▲</div>
                            <div>SIDE ▼</div>
                            <div>ACROSS</div>
                          </div>
                        </td>
                        <td className="border-2 border-gray-400 px-2 py-1">
                          <div className="text-center text-xs">
                            <div>SITTING ▲</div>
                            <div>STANDING ▼</div>
                            <div>WALKING</div>
                            <div>CLIMBING</div>
                            <div>CRAWLING</div>
                            <div>KNEELING</div>
                            <div>SQUATTING</div>
                          </div>
                        </td>
                        <td className="border-2 border-gray-400 px-2 py-1 text-center">
                          <div>1-? ▲</div>
                          <div>___ Lbs</div>
                        </td>
                        <td className="border-2 border-gray-400 px-2 py-1 text-center">
                          <div>___ FT</div>
                        </td>
                        <td className="border-2 border-gray-400 px-2 py-1 text-center">
                          <div>1-6</div>
                        </td>
                        <td className="border-2 border-gray-400 px-2 py-1 text-center">
                          <div>___ SEC</div>
                        </td>
                        <td className="border-2 border-gray-400 px-2 py-1 text-center">
                          <div>___ %</div>
                        </td>
                      </tr>

                      {/* Actual trial data rows */}
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((trialNum) => {
                        const existingTrial = trials.find(
                          (t) => t.trial === trialNum,
                        );
                        return (
                          <tr key={trialNum} className="bg-white">
                            <td className="border-2 border-gray-400 px-3 py-2 text-center font-semibold">
                              {trialNum}
                            </td>
                            <td className="border-2 border-gray-400 px-3 py-2 text-center">
                              {existingTrial?.side || ""}
                            </td>
                            <td className="border-2 border-gray-400 px-3 py-2 text-center">
                              {existingTrial?.plane || ""}
                            </td>
                            <td className="border-2 border-gray-400 px-3 py-2 text-center">
                              {existingTrial?.position || ""}
                            </td>
                            <td className="border-2 border-gray-400 px-3 py-2 text-center">
                              {existingTrial
                                ? `${existingTrial.weight} Lbs`
                                : ""}
                            </td>
                            <td className="border-2 border-gray-400 px-3 py-2 text-center">
                              {existingTrial
                                ? `${existingTrial.distance} FT`
                                : ""}
                            </td>
                            <td className="border-2 border-gray-400 px-3 py-2 text-center">
                              {existingTrial?.reps || ""}
                            </td>
                            <td className="border-2 border-gray-400 px-3 py-2 text-center">
                              {existingTrial
                                ? `${existingTrial.testTime.toFixed(1)} SEC`
                                : ""}
                            </td>
                            <td className="border-2 border-gray-400 px-3 py-2 text-center">
                              {existingTrial && existingTrial.percentIS > 0
                                ? `${existingTrial.percentIS.toFixed(1)}%`
                                : ""}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Total IS% Average row */}
                      <tr className="bg-blue-100">
                        <td
                          colSpan={8}
                          className="border-2 border-gray-400 px-3 py-2 text-right font-bold"
                        >
                          (TOTAL IS % AVERAGE)
                        </td>
                        <td className="border-2 border-gray-400 px-3 py-2 text-center font-bold text-blue-800">
                          {calculateAverageIS()}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Heart Rate Section */}
            <Card className="mt-4 shadow-lg">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="text-lg font-semibold w-20">
                        HR PRE
                      </label>
                      <Input
                        type="number"
                        value={hrPre || ""}
                        onChange={(e) =>
                          setHrPre(parseInt(e.target.value) || 0)
                        }
                        className="w-24 h-12 text-center border-2 border-gray-400 text-lg"
                        placeholder=""
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-lg font-semibold w-20">
                        HR POST
                      </label>
                      <Input
                        type="number"
                        value={hrPost || ""}
                        onChange={(e) =>
                          setHrPost(parseInt(e.target.value) || 0)
                        }
                        className="w-24 h-12 text-center border-2 border-gray-400 text-lg"
                        placeholder=""
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 italic">
                    <p>* USE SAME COMMENTS SCREENS AS OTHER TESTS</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Current Trial Setup */}
            <Card className="shadow-lg">
              <CardHeader className="bg-blue-600 text-white">
                <CardTitle className="text-center">
                  Trial {currentTrial} Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="bg-blue-500 text-white p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Side:
                    </label>
                    <Select
                      value={selectedSide}
                      onValueChange={setSelectedSide}
                    >
                      <SelectTrigger className="bg-white text-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Left">LEFT</SelectItem>
                        <SelectItem value="Right">RIGHT</SelectItem>
                        <SelectItem value="Both">BOTH</SelectItem>
                        <SelectItem value="L/R">L/R</SelectItem>
                        <SelectItem value="R/L">R/L</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Plane:
                    </label>
                    <Select
                      value={selectedPlane}
                      onValueChange={setSelectedPlane}
                    >
                      <SelectTrigger className="bg-white text-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Front">FRONT</SelectItem>
                        <SelectItem value="Side">SIDE</SelectItem>
                        <SelectItem value="Across">ACROSS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Position:
                    </label>
                    <Select
                      value={selectedPosition}
                      onValueChange={setSelectedPosition}
                    >
                      <SelectTrigger className="bg-white text-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sitting">SITTING</SelectItem>
                        <SelectItem value="Standing">STANDING</SelectItem>
                        <SelectItem value="Walking">WALKING</SelectItem>
                        <SelectItem value="Climbing">CLIMBING</SelectItem>
                        <SelectItem value="Crawling">CRAWLING</SelectItem>
                        <SelectItem value="Kneeling">KNEELING</SelectItem>
                        <SelectItem value="Squatting">SQUATTING</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Weight (Lbs):
                    </label>
                    <Input
                      type="number"
                      value={selectedWeight}
                      onChange={(e) =>
                        setSelectedWeight(parseInt(e.target.value) || 0)
                      }
                      className="bg-white text-black"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Distance (FT):
                    </label>
                    <Input
                      type="number"
                      value={selectedDistance}
                      onChange={(e) =>
                        setSelectedDistance(parseInt(e.target.value) || 0)
                      }
                      className="bg-white text-black"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Reps:
                    </label>
                    <Input
                      type="number"
                      value={selectedReps}
                      onChange={(e) =>
                        setSelectedReps(parseInt(e.target.value) || 0)
                      }
                      className="bg-white text-black"
                      min="1"
                      max="6"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      % IS (Auto-calculated):
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
                      title="MTM standard time for carry task with current parameters"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timer and Controls */}
            <Card className="shadow-lg">
              <CardHeader className="bg-green-600 text-white">
                <CardTitle className="text-center">Timer & Controls</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="text-center space-y-4">
                  <div className="text-3xl font-bold text-green-600">
                    {testTime.toFixed(1)}s
                  </div>

                  <div className="space-y-2">
                    {!isRunning ? (
                      <Button
                        onClick={startTest}
                        className="w-full bg-green-600 hover:bg-green-700"
                        disabled={currentTrial > 10}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start Trial {currentTrial}
                      </Button>
                    ) : (
                      <Button
                        onClick={stopTest}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        Stop Trial
                      </Button>
                    )}

                    <Button
                      onClick={resetTest}
                      variant="outline"
                      className="w-full"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset All
                    </Button>
                  </div>

                  <div className="text-sm text-gray-600">
                    Trial {currentTrial} of 10
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3"
              disabled={trials.length === 0}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Test Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

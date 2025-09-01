import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface BalanceTrialData {
  trial: number;
  side: string;
  plane: string;
  position: string;
  reps: number;
  testTime: number;
  percentIS: number;
  totalCompletedSet: number;
}

interface BalanceTestInterfaceProps {
  onSave: (data: any) => void;
  onBack: () => void;
}

export default function BalanceTestInterface({
  onSave,
  onBack,
}: BalanceTestInterfaceProps) {
  const [trials, setTrials] = useState<BalanceTrialData[]>([]);
  const [currentTrial, setCurrentTrial] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [testTime, setTestTime] = useState<number>(0);

  // Test parameters
  const [numberOfTrials] = useState(3);
  const [numberOfReps] = useState(1);
  const [direction, setDirection] = useState("Both");
  const [weight, setWeight] = useState(0);
  const [distance, setDistance] = useState(10);
  const [percentIS, setPercentIS] = useState<number>(0);
  const [standardTime, setStandardTime] = useState<number>(0);

  // Calculate standard time when parameters change
  useEffect(() => {
    const calcStandardTime = calculateStandardTime("balance", {
      distance: distance,
      difficulty: "medium",
    });
    setStandardTime(calcStandardTime);
  }, [distance]);

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
    const calculatedPercentIS = calculatePercentIS(duration, standardTime);
    const newTrial: BalanceTrialData = {
      trial: currentTrial,
      side: "Both",
      plane: "0",
      position: "Standing",
      reps: numberOfReps,
      testTime: duration,
      percentIS: calculatedPercentIS,
      totalCompletedSet: duration * (calculatedPercentIS / 100),
    };
    setPercentIS(calculatedPercentIS);

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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <Button variant="outline" onClick={onBack} className="mb-4">
            ← Back to Tests
          </Button>
          <h1 className="text-3xl font-bold text-center text-gray-900">
            MTM - Balance
          </h1>
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
                          className={`${index % 2 === 0 ? "bg-gray-50" : "bg-white"} ${index === 2 ? "bg-orange-200" : ""}`}
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
                            {trial.totalCompletedSet.toFixed(1)}
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
                        value={numberOfTrials}
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
                        value={numberOfReps}
                        className="bg-white text-black"
                        readOnly
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Direction:
                    </label>
                    <Select value={direction} onValueChange={setDirection}>
                      <SelectTrigger className="bg-white text-black">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Both">Both</SelectItem>
                        <SelectItem value="Forward">Forward</SelectItem>
                        <SelectItem value="Backward">Backward</SelectItem>
                        <SelectItem value="Left">Left</SelectItem>
                        <SelectItem value="Right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Weight:
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="bg-white text-black flex-1"
                      />
                      <span className="text-white text-sm">Lb</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Distance:
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={distance}
                        onChange={(e) => setDistance(Number(e.target.value))}
                        className="bg-white text-black flex-1"
                      />
                      <span className="text-white text-sm">paces</span>
                    </div>
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
                      title="MTM standard time for balance task"
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
                disabled={currentTrial > numberOfTrials}
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
                    testName: "Balance",
                    testType: "balance",
                    trials,
                    parameters: {
                      numberOfTrials,
                      numberOfReps,
                      direction,
                      weight,
                      distance,
                      hrPre,
                      hrPost,
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

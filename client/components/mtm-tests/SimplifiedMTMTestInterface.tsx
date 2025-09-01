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

interface SimplifiedMTMTestInterfaceProps {
  testName: string;
  testType: string;
  parameters: TestParameters;
  onSave: (data: any) => void;
  onBack: () => void;
}

export default function SimplifiedMTMTestInterface({
  testName,
  testType,
  parameters,
  onSave,
  onBack,
}: SimplifiedMTMTestInterfaceProps) {
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [currentTrial, setCurrentTrial] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [testTime, setTestTime] = useState<number>(0);
  const [hrPre, setHrPre] = useState<number>(0);
  const [hrPost, setHrPost] = useState<number>(0);
  const [percentIS, setPercentIS] = useState<number>(0);
  const [standardTime, setStandardTime] = useState<number>(0);

  // Initialize trials
  useEffect(() => {
    const initialTrials = [];
    for (let i = 1; i <= (parameters.numberOfTrials || 3); i++) {
      initialTrials.push({
        trial: i,
        side: "Both",
        plane: "",
        position: "Standing",
        reps: parameters.numberOfReps || 6,
        testTime: 0,
        percentIS: 0,
        totalCompleted: 0,
      });
    }
    setTrials(initialTrials);
  }, [parameters.numberOfTrials, parameters.numberOfReps]);

  // Calculate standard time when parameters change
  useEffect(() => {
    const calcStandardTime = calculateStandardTime(testType, {
      reps: parameters.numberOfReps || 6,
      difficulty: "medium",
    });
    setStandardTime(calcStandardTime);
  }, [testType, parameters.numberOfReps]);

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
  };

  const resetTest = () => {
    setIsRunning(false);
    setStartTime(null);
    setTestTime(0);
  };

  const saveTrialData = () => {
    if (currentTrial <= trials.length) {
      const updatedTrials = [...trials];
      updatedTrials[currentTrial - 1] = {
        ...updatedTrials[currentTrial - 1],
        testTime: testTime,
        percentIS: calculatePercentIS(testTime, standardTime),
        totalCompleted: testTime,
      };
      setTrials(updatedTrials);
    }
  };

  const handleSave = () => {
    const testData = {
      testName,
      testType,
      trials: trials,
      hrPre,
      hrPost,
      completedAt: new Date().toISOString(),
    };
    onSave(testData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <Button variant="outline" onClick={onBack} className="mb-4">
            ← Back to Tests
          </Button>
        </div>

        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">OCCUPATIONAL TASKS</h1>
              <h2 className="text-lg mb-4">
                USING METHODS TIME MEASUREMENT ANALYSIS (MTM)
              </h2>
              <div className="inline-block bg-white/20 px-4 py-2 rounded border border-white/30">
                <span className="font-medium">TEST TYPE: </span>
                <span className="font-bold">{testName.toUpperCase()}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Test Configuration Section */}
            <div className="bg-purple-600 text-white p-6">
              <h3 className="text-xl font-bold text-center mb-6">
                Test Configuration
              </h3>

              {/* Number of Trials Selector */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-white font-medium">
                  Number of Trials:
                </span>
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
                    {trials.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (trials.length < 6) {
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
                    disabled={trials.length >= 6}
                    className="bg-white text-gray-800"
                  >
                    +
                  </Button>
                  <span className="text-white text-sm ml-2">(3-6 trials)</span>
                </div>
              </div>
            </div>

            {/* MTM Results Table */}
            <div className="p-6">
              <table className="w-full border border-gray-400 text-xs">
                <thead>
                  <tr className="bg-yellow-300">
                    <th className="border border-gray-400 p-2">Trial</th>
                    <th className="border border-gray-400 p-2">Side</th>
                    <th className="border border-gray-400 p-2">Weight/Plane</th>
                    <th className="border border-gray-400 p-2">
                      Distance/Posture
                    </th>
                    <th className="border border-gray-400 p-2">Reps</th>
                    <th className="border border-gray-400 p-2">Time (sec)</th>
                    <th className="border border-gray-400 p-2">%IS</th>
                    <th className="border border-gray-400 p-2">CV%</th>
                    <th className="border border-gray-400 p-2">
                      Time Set Completed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trials.map((trial, index) => (
                    <tr
                      key={index}
                      className={
                        currentTrial === trial.trial ? "bg-blue-50" : ""
                      }
                    >
                      <td className="border border-gray-400 p-2 text-center">
                        {trial.trial}
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        {trial.side}
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        {trial.plane}
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        {trial.position}
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        {trial.reps}
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        {trial.testTime > 0 ? trial.testTime.toFixed(1) : ""}
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        {trial.percentIS > 0 ? trial.percentIS.toFixed(1) : ""}
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        {index + 1}
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        {trial.totalCompleted > 0
                          ? trial.totalCompleted.toFixed(1)
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Test Controls */}
              <div className="mt-6 flex flex-col items-center gap-4">
                <div className="text-lg font-bold">
                  Trial {currentTrial} of {trials.length}
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    onClick={startTest}
                    disabled={isRunning}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </Button>
                  <Button
                    onClick={stopTest}
                    disabled={!isRunning}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                  <Button onClick={resetTest} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>

                <div className="text-2xl font-bold">{testTime.toFixed(1)}s</div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">
                      %IS (Auto-calculated):
                    </label>
                    <Input
                      type="number"
                      value={percentIS > 0 ? percentIS.toFixed(1) : ""}
                      className="mt-1 bg-gray-100"
                      readOnly
                      title="Automatically calculated: (Standard Time / Actual Time) × 100"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      Standard Time:
                    </label>
                    <Input
                      type="number"
                      value={standardTime.toFixed(1)}
                      className="mt-1 bg-gray-100"
                      readOnly
                      title="MTM standard time for this task"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">HR Pre:</label>
                    <Input
                      type="number"
                      value={hrPre}
                      onChange={(e) => setHrPre(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={saveTrialData}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Save Trial {currentTrial}
                  </Button>
                  <Button
                    onClick={() =>
                      setCurrentTrial((prev) =>
                        Math.min(trials.length, prev + 1),
                      )
                    }
                    disabled={currentTrial >= trials.length}
                    variant="outline"
                  >
                    Next Trial
                  </Button>
                </div>

                <Button
                  onClick={handleSave}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2"
                  disabled={trials.some((t) => t.testTime === 0)}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Complete Test
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

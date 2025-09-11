import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mtmDescriptions } from "./mtm-descriptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Play, Pause, RotateCcw, Save, ArrowLeft } from "lucide-react";

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
}

interface StandardMTMInterfaceProps {
  testName: string;
  testType: string;
  parameters: TestParameters;
  onSave: (data: any) => void;
  onBack: () => void;
}

export default function StandardMTMInterface({
  testName,
  testType,
  parameters,
  onSave,
  onBack,
}: StandardMTMInterfaceProps) {
  const [trials, setTrials] = useState<TrialData[]>([]);
  const [currentTrial, setCurrentTrial] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [testTime, setTestTime] = useState<number>(0);
  const [hrPre, setHrPre] = useState<number>(0);
  const [hrPost, setHrPost] = useState<number>(0);
  const [percentIS, setPercentIS] = useState<number>(0);

  // Test parameters (same for all tests)
  const [selectedSide, setSelectedSide] = useState(
    parameters.bodySide || "Both",
  );
  const [selectedReps, setSelectedReps] = useState(
    parameters.numberOfReps || 10,
  );

  // Initialize trials
  useEffect(() => {
    const initialTrials = [];
    for (let i = 1; i <= (parameters.numberOfTrials || 3); i++) {
      initialTrials.push({
        trial: i,
        side: "Both",
        plane: "",
        position: "Standing",
        reps: parameters.numberOfReps || 10,
        testTime: 0,
        percentIS: 0,
        totalCompleted: 0,
      });
    }
    setTrials(initialTrials);
  }, [parameters]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setTestTime((Date.now() - startTime) / 1000);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

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
        side: selectedSide,
        reps: selectedReps,
        testTime: testTime,
        percentIS: percentIS,
        totalCompleted: testTime,
      };
      setTrials(updatedTrials);

      // Move to next trial
      if (currentTrial < trials.length) {
        setCurrentTrial(currentTrial + 1);
        resetTest();
        setPercentIS(0);
      }
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
      <div className="container mx-auto max-w-4xl">
        <Button variant="outline" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tests
        </Button>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">MTM - {testName}</h1>
          {mtmDescriptions[testType] && (
            <div className="mt-3 text-sm text-gray-800 p-4 rounded-lg bg-gradient-to-r from-purple-50 via-blue-50 to-teal-50 border shadow-sm whitespace-pre-line text-justify">
              <p className="mt-1">{mtmDescriptions[testType]}</p>
            </div>
          )}
        </div>

        {/* Trial Results Table */}
        <Card className="mb-6">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle>Trial Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="border p-2">Trial</th>
                  <th className="border p-2">Side</th>
                  <th className="border p-2">Plane</th>
                  <th className="border p-2">Position</th>
                  <th className="border p-2">Reps</th>
                  <th className="border p-2">Test Time</th>
                  <th className="border p-2">% IS</th>
                  <th className="border p-2">Total of Completed Set</th>
                </tr>
              </thead>
              <tbody>
                {trials.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-4 text-gray-500">
                      No trials completed yet
                    </td>
                  </tr>
                ) : (
                  trials.map((trial, index) => (
                    <tr key={index}>
                      <td className="border p-2 text-center">{trial.trial}</td>
                      <td className="border p-2 text-center">{trial.side}</td>
                      <td className="border p-2 text-center">{trial.plane}</td>
                      <td className="border p-2 text-center">
                        {trial.position}
                      </td>
                      <td className="border p-2 text-center">{trial.reps}</td>
                      <td className="border p-2 text-center">
                        {trial.testTime > 0 ? trial.testTime.toFixed(1) : ""}
                      </td>
                      <td className="border p-2 text-center">
                        {trial.percentIS > 0 ? trial.percentIS.toFixed(1) : ""}
                      </td>
                      <td className="border p-2 text-center">
                        {trial.totalCompleted > 0
                          ? trial.totalCompleted.toFixed(1)
                          : ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Test Parameters */}
        <Card className="mb-6">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle>Test Parameters</CardTitle>
          </CardHeader>
          <CardContent className="bg-blue-500 text-white p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Number of Trials:
                </label>
                <Input
                  type="number"
                  value={parameters.numberOfTrials || 3}
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
                  value={selectedReps}
                  onChange={(e) =>
                    setSelectedReps(parseInt(e.target.value) || 10)
                  }
                  className="bg-white text-black"
                />
              </div>
            </div>

            {/* Standard Parameters for ALL tests */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Body Side(s):
                </label>
                <Select value={selectedSide} onValueChange={setSelectedSide}>
                  <SelectTrigger className="bg-white text-black">
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
                <label className="text-sm font-medium mb-1 block">
                  Position:
                </label>
                <Input
                  value="Standing"
                  className="bg-white text-black"
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setHrPre(hrPre)}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                HR Pre: {hrPre}
              </Button>
              <Button
                onClick={() => setHrPost(hrPost)}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                HR Post: {hrPost}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Trial */}
        <Card className="mb-6">
          <CardHeader className="bg-blue-600 text-white">
            <CardTitle>Trial {currentTrial}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Test Time (seconds):
                </label>
                <Input
                  type="number"
                  value={testTime.toFixed(1)}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Percent IS:
                </label>
                <Input
                  type="number"
                  value={percentIS}
                  onChange={(e) => setPercentIS(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex justify-center gap-4 mb-4">
              <Button
                onClick={startTest}
                disabled={isRunning}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Test
              </Button>
              <Button
                onClick={stopTest}
                disabled={!isRunning}
                className="bg-red-600 hover:bg-red-700"
              >
                <Pause className="w-4 h-4 mr-2" />
                Stop Test
              </Button>
              <Button onClick={resetTest} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            <div className="flex justify-center gap-4">
              <Button
                onClick={saveTrialData}
                disabled={testTime === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save Test Data
              </Button>
              <Button
                onClick={handleSave}
                disabled={trials.some((t) => t.testTime === 0)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Complete Test
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

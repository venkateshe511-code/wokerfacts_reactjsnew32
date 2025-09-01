import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getReferencesForTest,
  formatReference,
  type Reference,
} from "@shared/references";

interface ReferencesProps {
  testId: string;
  testName?: string;
  className?: string;
}

export function References({
  testId,
  testName,
  className = "",
}: ReferencesProps) {
  const references = getReferencesForTest(testId);

  if (references.length === 0) {
    return null;
  }

  return (
    <Card className={`mt-6 border-gray-300 ${className}`}>
      <CardHeader className="bg-gray-50 border-b border-gray-300">
        <CardTitle className="text-lg font-bold text-gray-800">
          REFERENCES
          {testName && (
            <span className="text-sm font-normal text-gray-600 ml-2">
              - {testName}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {references.map((reference, index) => (
            <div key={index} className="text-sm text-gray-700 leading-relaxed">
              <span className="font-medium text-gray-800">
                {formatReference(reference)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface MultipleTestReferencesProps {
  testIds: string[];
  title?: string;
  className?: string;
}

export function MultipleTestReferences({
  testIds,
  title = "REFERENCES",
  className = "",
}: MultipleTestReferencesProps) {
  // Collect all unique references from multiple tests
  const allReferences = new Map<string, Reference>();

  testIds.forEach((testId) => {
    const testRefs = getReferencesForTest(testId);
    testRefs.forEach((ref) => {
      const key = `${ref.author}-${ref.title}-${ref.year}`;
      allReferences.set(key, ref);
    });
  });

  const uniqueReferences = Array.from(allReferences.values());

  if (uniqueReferences.length === 0) {
    return null;
  }

  return (
    <Card className={`mt-6 border-gray-300 ${className}`}>
      <CardHeader className="bg-gray-50 border-b border-gray-300">
        <CardTitle className="text-lg font-bold text-gray-800">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {uniqueReferences.map((reference, index) => (
            <div key={index} className="text-sm text-gray-700 leading-relaxed">
              <span className="font-medium text-gray-800">
                {formatReference(reference)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default References;

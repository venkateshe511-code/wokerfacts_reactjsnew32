import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, CheckCircle2, Trash } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface EvaluatorProfile {
  id: string;
  name: string;
  clinicName: string;
  createdAt?: Timestamp;
}

export default function ProfileSelector() {
  const { user, setSelectedProfileId } = useAuth();
  const [profiles, setProfiles] = useState<EvaluatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      // Ensure no cached selection carries over (especially from demo flows)
      setSelectedProfileId(null);
      const q = query(
        collection(db, "evaluatorProfiles"),
        where("ownerId", "==", user.uid),
      );
      const snap = await getDocs(q);
      const items: EvaluatorProfile[] = [];
      snap.forEach((doc) => {
        const d = doc.data() as any;
        items.push({
          id: doc.id,
          name: d.name || "Untitled Evaluator",
          clinicName: d.clinicName || "",
          createdAt: d.createdAt,
        });
      });
      setProfiles(items);
      setLoading(false);
    };
    load();
  }, [user, setSelectedProfileId]);

  if (!user) return null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4 overflow-hidden">
      {/* Watermark background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          backgroundImage: "url('/workerfacts-logo.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "260px 260px",
          backgroundPosition: "top left",
          filter: "grayscale(100%)",
        }}
      />

      <div className="relative container mx-auto max-w-3xl">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-700 bg-clip-text text-transparent">
              Select Evaluator Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div>Loading...</div>
            ) : profiles.length === 0 ? (
              <div className="text-center space-y-3">
                <p>No profiles found for your account.</p>
                <Button
                  onClick={() => navigate("/register")}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                >
                  Create your first profile
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-md flex items-center justify-between border border-transparent bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-blue-100 hover:to-indigo-100 transition-all shadow-sm hover:shadow-md"
                  >
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      {p.clinicName && (
                        <div className="text-sm text-gray-600">
                          {p.clinicName}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() =>
                          navigate(`/edit-profile?profileId=${p.id}`)
                        }
                        variant="outline"
                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedProfileId(p.id);
                          navigate("/dashboard");
                        }}
                        className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white"
                      >
                        <CheckCircle2 className="mr-2" /> Use this profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => navigate("/register")}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <PlusCircle className="mr-2" /> Create new profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

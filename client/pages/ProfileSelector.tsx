import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { db } from "../firebase";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, CheckCircle2 } from "lucide-react";

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
      const q = query(collection(db, "evaluatorProfiles"), where("ownerId", "==", user.uid));
      const snap = await getDocs(q);
      const items: EvaluatorProfile[] = [];
      snap.forEach((doc) => {
        const d = doc.data() as any;
        items.push({ id: doc.id, name: d.name || "Untitled Evaluator", clinicName: d.clinicName || "", createdAt: d.createdAt });
      });
      setProfiles(items);
      setLoading(false);
    };
    load();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Select Evaluator Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div>Loading...</div>
            ) : profiles.length === 0 ? (
              <div className="text-center space-y-3">
                <p>No profiles found for your account.</p>
                <Button onClick={() => navigate("/register")}>Create your first profile</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {profiles.map((p) => (
                  <div key={p.id} className="p-4 border rounded-md flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      {p.clinicName && <div className="text-sm text-gray-600">{p.clinicName}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => navigate(`/edit-profile?profileId=${p.id}`)} variant="outline">Edit</Button>
                      <Button onClick={() => { setSelectedProfileId(p.id); navigate("/dashboard"); }} className="bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle2 className="mr-2" /> Use this profile
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t">
              <Button variant="outline" onClick={() => navigate("/register")}>
                <PlusCircle className="mr-2" /> Create new profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

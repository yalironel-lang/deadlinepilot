"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STRUGGLES = [
  "I don't know where to start",
  "I procrastinate until it's too late",
  "I lose track of multiple deadlines",
  "I underestimate how long things take",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [struggle, setStruggle] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseError, setCourseError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    setLoading(true);
    try {
      // Mark onboarding done
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || undefined, onboardingCompleted: true }),
      });

      // Create first course if provided
      if (courseName.trim()) {
        const res = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: courseName.trim() }),
        });
        if (!res.ok) {
          setCourseError("Couldn't create course. You can add it later.");
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-zinc-900">DeadlinePilot</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? "w-6 bg-indigo-600" : s < step ? "w-4 bg-indigo-300" : "w-4 bg-zinc-200"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200 p-8">
          {step === 1 && (
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 mb-1">Nice to meet you</h1>
              <p className="text-sm text-zinc-500 mb-6">Let&rsquo;s get you set up in 2 minutes.</p>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">What should we call you?</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your first name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <Button className="w-full mt-6" onClick={() => setStep(2)}>
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 mb-1">What&rsquo;s your biggest struggle?</h1>
              <p className="text-sm text-zinc-500 mb-6">This helps us prioritize your plan.</p>
              <div className="space-y-2">
                {STRUGGLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStruggle(s)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                      struggle === s
                        ? "border-indigo-500 bg-indigo-50 text-indigo-800 font-medium"
                        : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1" onClick={() => setStep(3)}>Continue <ArrowRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <h1 className="text-xl font-semibold text-zinc-900 mb-1">Add your first course</h1>
              <p className="text-sm text-zinc-500 mb-6">You can always add more later.</p>
              <div className="space-y-1.5">
                <Label htmlFor="course">Course name</Label>
                <Input
                  id="course"
                  type="text"
                  placeholder="e.g. CS401 — Algorithms"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  autoFocus
                />
                {courseError && <p className="text-xs text-red-500">{courseError}</p>}
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1" onClick={handleFinish} disabled={loading}>
                  {loading ? "Setting up…" : "Go to dashboard"} <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <button
                onClick={handleFinish}
                className="w-full text-center text-xs text-zinc-400 hover:text-zinc-600 mt-3"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

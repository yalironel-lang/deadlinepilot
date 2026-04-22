"use client";

import { useState } from "react";
import { CheckCircle, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDateInput } from "@/lib/utils";
import type { AssignmentFull, Course } from "@/types";

interface ExtractionReviewCardProps {
  assignment: AssignmentFull;
  courses: Course[];
  onConfirmed: (data: { id: string; courseName: string }) => void;
  onDeleted: (id: string) => void;
}

export function ExtractionReviewCard({ assignment, courses, onConfirmed, onDeleted }: ExtractionReviewCardProps) {
  const [title, setTitle] = useState(assignment.title);
  const [courseId, setCourseId] = useState(assignment.courseId);
  const [dueDate, setDueDate] = useState(formatDateInput(new Date(assignment.dueDate)));
  const [description, setDescription] = useState(assignment.description ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const confidence = assignment.extractionConfidence ?? 0;
  const isLowConfidence = confidence < 0.7;

  async function handleConfirm() {
    if (!title.trim() || !dueDate) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch(`/api/assignments/${assignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          courseId,
          dueDate: new Date(dueDate).toISOString(),
          description: description.trim() || null,
          reviewed: true,
        }),
      });
      if (!res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        const msg = ct.includes("application/json")
          ? ((await res.json()).error ?? "Failed to save")
          : "Failed to save";
        setSaveError(msg);
        return;
      }
      const saved = await res.json();
      const courseName = saved.course?.name ?? courses.find((c) => c.id === courseId)?.name ?? courseId;
      onConfirmed({ id: assignment.id, courseName });
    } catch {
      setSaveError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/assignments/${assignment.id}`, { method: "DELETE" });
      onDeleted(assignment.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden ${isLowConfidence ? "border-amber-200" : "border-zinc-200"}`}>
      {/* Confidence header */}
      <div className={`px-4 py-2.5 flex items-center gap-2 text-xs font-medium ${isLowConfidence ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
        {isLowConfidence ? (
          <>
            <AlertTriangle className="w-3.5 h-3.5" />
            Needs review ({Math.round(confidence * 100)}% confidence) — please verify the details below
          </>
        ) : (
          <>
            <CheckCircle className="w-3.5 h-3.5" />
            Ready to confirm ({Math.round(confidence * 100)}% confidence)
          </>
        )}
        {assignment.document?.filename && (
          <span className="ml-auto text-zinc-400 font-normal">from {assignment.document.filename}</span>
        )}
      </div>

      {/* Editable fields */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-zinc-600">Assignment title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Assignment title"
              className={isLowConfidence ? "border-amber-300 focus:ring-amber-400" : ""}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600">Course</label>
            <Select value={courseId} onValueChange={(v) => setCourseId(v ?? "")}>
              <SelectTrigger className={isLowConfidence ? "border-amber-300" : ""}>
                <SelectValue placeholder="Select course…" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-600">Due date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={isLowConfidence ? "border-amber-300 focus:ring-amber-400" : ""}
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-zinc-600">Notes (optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description…"
              rows={2}
              className="text-sm"
            />
          </div>
        </div>

        {/* Extracted tasks preview */}
        {assignment.tasks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-2">Extracted subtasks ({assignment.tasks.length})</p>
            <div className="space-y-1">
              {assignment.tasks.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-xs text-zinc-600">
                  <div className="w-1 h-1 rounded-full bg-zinc-300 flex-shrink-0" />
                  {t.title}
                </div>
              ))}
              {assignment.tasks.length > 4 && (
                <p className="text-xs text-zinc-400">+{assignment.tasks.length - 4} more</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            {deleting ? "Deleting…" : "Delete"}
          </Button>
          <div className="flex-1" />
          {saveError && <p className="text-xs text-red-600">{saveError}</p>}
          <Button size="sm" onClick={handleConfirm} disabled={saving || !title.trim() || !dueDate}>
            {saving ? "Saving…" : "Confirm & Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

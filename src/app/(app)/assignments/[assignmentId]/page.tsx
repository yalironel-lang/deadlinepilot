"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  CheckCircle,
  XCircle,
  Edit2,
  X,
  ArrowRight,
} from "lucide-react";
import { TaskList } from "@/components/assignments/TaskList";
import { RiskBadge } from "@/components/assignments/RiskBadge";
import { ResourcesSection } from "@/components/resources/ResourcesSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { computeRiskScore } from "@/lib/planning";
import { getRiskTier, formatDueDate, formatDateInput, getDaysUntil } from "@/lib/utils";
import type { AssignmentFull, Course, Task } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

const STATUS_STYLES: Record<string, string> = {
  not_started: "bg-zinc-100 text-zinc-600 border-zinc-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

// ─── Next Action ──────────────────────────────────────────────────────────────

type NextAction =
  | { kind: "completed" }
  | { kind: "mark_done" }
  | { kind: "start" }
  | { kind: "task"; task: Task };

function computeNextAction(assignment: AssignmentFull): NextAction {
  if (assignment.status === "done") return { kind: "completed" };
  const pending = assignment.tasks.filter((t: any) => t.status !== "done");
  if (assignment.tasks.length > 0 && pending.length === 0) return { kind: "mark_done" };
  if (pending.length > 0) return { kind: "task", task: pending[0] };
  return { kind: "start" };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<AssignmentFull | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tracks edit mode in a ref so fetchAssignment callbacks (useCallback) see
  // the current value without needing to be in the dependency array.
  const editModeRef = useRef(false);
  useEffect(() => { editModeRef.current = editMode; }, [editMode]);

  // Edit form mirrors server state — only written on save
  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [statusField, setStatusField] = useState("not_started");
  const [description, setDescription] = useState("");

  // ── Helpers ────────────────────────────────────────────────────────────────

  function showToast(message: string, type: "success" | "error") {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  function syncFormFields(a: AssignmentFull) {
    setTitle(a.title);
    setCourseId(a.courseId);
    setDueDate(formatDateInput(new Date(a.dueDate)));
    setStatusField(a.status);
    setDescription(a.description ?? "");
  }

  // Initial load — fetches assignment + courses together.
  const loadAll = useCallback(async () => {
    const [aRes, cRes] = await Promise.all([
      fetch(`/api/assignments/${assignmentId}`),
      fetch("/api/courses"),
    ]);
    if (!aRes.ok) { router.push("/dashboard"); return; }
    const a: AssignmentFull = await aRes.json();
    setAssignment(a);
    syncFormFields(a);
    if (cRes.ok) setCourses(await cRes.json());
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId, router]);

  // Called after task add — fetches only the assignment, skips courses.
  // Does NOT overwrite form fields while the edit form is open.
  const refreshAssignment = useCallback(async () => {
    const res = await fetch(`/api/assignments/${assignmentId}`);
    if (!res.ok) return;
    const a: AssignmentFull = await res.json();
    setAssignment(a);
    if (!editModeRef.current) syncFormFields(a);
  }, [assignmentId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Task mutations (hook) ──────────────────────────────────────────────────

  const { mutatingTaskId, handleTaskStatusChange, handleTaskDelete } = useTaskMutations(
    assignmentId,
    assignment,
    setAssignment,
    showToast,
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!title.trim() || !dueDate) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          courseId,
          dueDate: new Date(dueDate).toISOString(),
          status: statusField,
          description: description.trim() || null,
          reviewed: true,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAssignment((prev: any) => (prev ? { ...prev, ...updated } : null));
        setEditMode(false);
        showToast("Details saved.", "success");
      } else {
        showToast("Failed to save. Try again.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!assignment || assignment.status === newStatus) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setAssignment((prev: any) => (prev ? { ...prev, ...updated } : null));
        setStatusField(newStatus);
        if (newStatus === "done") showToast("Assignment marked complete.", "success");
        else if (newStatus === "in_progress") showToast("Assignment started.", "success");
      } else {
        showToast("Failed to update status. Try again.", "error");
      }
    } finally {
      setActionLoading(false);
    }
  }

  // ── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!assignment) return null;

  // ── Derived values ──────────────────────────────────────────────────────────

  const riskScore = computeRiskScore({ ...assignment, tasks: assignment.tasks });
  const tier = getRiskTier(riskScore, assignment.status);
  const doneCount = assignment.tasks.filter((t: any) => t.status === "done").length;
  const totalTasks = assignment.tasks.length;
  const nextAction = computeNextAction(assignment);
  const dueDateObj = new Date(assignment.dueDate);
  const daysLeft = getDaysUntil(dueDateObj);
  const dueDateUrgent = daysLeft < 0 || daysLeft <= 1;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: identity */}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-zinc-900 leading-snug mb-2">
              {assignment.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
              <Link
                href={`/courses/${assignment.courseId}`}
                className="font-medium text-zinc-700 hover:text-indigo-600 transition-colors"
              >
                {assignment.course.name}
              </Link>
              <span className="text-zinc-300">·</span>
              <span className={dueDateUrgent ? "font-medium text-red-600" : "text-zinc-500"}>
                {formatDueDate(dueDateObj)}
              </span>
              {assignment.document && (
                <>
                  <span className="text-zinc-300">·</span>
                  <span className="flex items-center gap-1 text-zinc-400 text-xs">
                    <ExternalLink className="w-3 h-3" />
                    {assignment.document.filename}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: badges + edit toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                STATUS_STYLES[assignment.status] ?? STATUS_STYLES.not_started
              }`}
            >
              {STATUS_LABELS[assignment.status] ?? assignment.status}
            </span>
            {assignment.status !== "done" && <RiskBadge tier={tier} />}
            <button
              onClick={() => setEditMode((v) => !v)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              title={editMode ? "Close" : "Edit details"}
            >
              {editMode ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Edit form — collapses inline */}
        {editMode && (
          <div className="mt-5 pt-5 border-t border-zinc-100 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-600">Course</label>
                <Select value={courseId} onValueChange={(v) => setCourseId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
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
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600">Status</label>
              <Select
                value={statusField}
                onValueChange={(v) => setStatusField(v ?? "not_started")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600">Notes</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="text-sm"
                placeholder="Brief description…"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                {saving ? "Saving…" : "Save changes"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Next Action ──────────────────────────────────────────────────────── */}
      <NextActionCard
        nextAction={nextAction}
        actionLoading={actionLoading}
        mutatingTaskId={mutatingTaskId}
        onMarkTaskDone={(task) =>
          handleTaskStatusChange(task.id, "done", task.title)
        }
        onMarkDone={() => handleStatusChange("done")}
        onStart={() => handleStatusChange("in_progress")}
      />

      {/* ── Tasks ────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 mb-4">
        {/* Progress bar — only shown when there are tasks */}
        {totalTasks > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-zinc-500">
                {doneCount} of {totalTasks} task{totalTasks !== 1 ? "s" : ""} done
              </span>
              <span className="text-xs font-medium text-zinc-700">
                {Math.round((doneCount / totalTasks) * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${(doneCount / totalTasks) * 100}%` }}
              />
            </div>
          </div>
        )}
        <TaskList
          assignmentId={assignmentId}
          tasks={assignment.tasks}
          mutatingTaskId={mutatingTaskId}
          onTaskStatusChange={handleTaskStatusChange}
          onTaskDelete={handleTaskDelete}
          onTaskAdded={refreshAssignment}
        />
      </div>

      {/* ── Resources ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6">
        <ResourcesSection
          baseUrl={`/api/assignments/${assignmentId}/resources`}
          label="Assignment Resources"
          emptyDescription="Add files, links, chat references, or notes specific to this assignment."
          courseResourcesUrl={`/api/courses/${assignment.courseId}/resources`}
          courseResourcesLabel="Course Resources"
          courseName={assignment.course.name}
          courseHref={`/courses/${assignment.courseId}`}
        />
      </div>

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 ${
            toast.type === "error" ? "bg-red-600" : "bg-zinc-900"
          }`}
        >
          {toast.type === "error" ? (
            <XCircle className="w-4 h-4 text-red-200 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ─── Next Action Card ─────────────────────────────────────────────────────────

interface NextActionCardProps {
  nextAction: NextAction;
  actionLoading: boolean;
  mutatingTaskId: string | null;
  onMarkTaskDone: (task: Task) => void;
  onMarkDone: () => void;
  onStart: () => void;
}

function NextActionCard({
  nextAction,
  actionLoading,
  mutatingTaskId,
  onMarkTaskDone,
  onMarkDone,
  onStart,
}: NextActionCardProps) {
  if (nextAction.kind === "completed") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 mb-4 flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-800">Completed</p>
          <p className="text-xs text-emerald-600 mt-0.5">
            This assignment is done. Nothing left to do.
          </p>
        </div>
      </div>
    );
  }

  if (nextAction.kind === "mark_done") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
            All tasks complete
          </p>
          <p className="text-sm text-zinc-700">
            Every task is checked off. Mark this assignment done.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onMarkDone}
          disabled={actionLoading}
          className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
        >
          {actionLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Mark complete
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </>
          )}
        </Button>
      </div>
    );
  }

  if (nextAction.kind === "task") {
    const { task } = nextAction;
    const isMutating = mutatingTaskId === task.id;
    return (
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 mb-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
            Next up
          </p>
          <p className="text-sm font-medium text-zinc-900 truncate">{task.title}</p>
          {task.estimatedMinutes != null && (
            <p className="text-xs text-zinc-500 mt-0.5">~{task.estimatedMinutes} min</p>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => onMarkTaskDone(task)}
          disabled={isMutating || mutatingTaskId !== null}
          className="flex-shrink-0"
        >
          {isMutating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Mark done
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </>
          )}
        </Button>
      </div>
    );
  }

  // kind === "start"
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 mb-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1">
          Ready to start
        </p>
        <p className="text-sm text-zinc-600">
          No tasks yet. Start when you&rsquo;re ready, or add subtasks first.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onStart}
        disabled={actionLoading}
        className="flex-shrink-0"
      >
        {actionLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Start assignment"
        )}
      </Button>
    </div>
  );
}

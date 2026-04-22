"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, BookOpen, ArrowRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

interface CourseWithMeta {
  id: string;
  name: string;
  createdAt: string;
  assignments: Array<{ dueDate: string }>;
  _count: { assignments: number };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function fetchCourses() {
    try {
      const res = await fetch("/api/courses");
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        const msg = ct.includes("application/json")
          ? ((await res.json()).error ?? "Failed to load courses")
          : "Failed to load courses";
        setError(msg);
        setLoading(false);
        return;
      }
      setCourses(await res.json());
    } catch {
      setError("Network error — could not load courses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCourses(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("application/json")) {
          const d = await res.json();
          setError(d.error || "Failed to create course");
        } else {
          setError("Failed to create course");
        }
        return;
      }
      setNewName("");
      setShowForm(false);
      fetchCourses();
    } catch {
      setError("Network error — please try again");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/courses/${id}`, { method: "DELETE" });
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Courses"
        description="Manage your courses and assignments"
        action={
          <Button onClick={() => setShowForm((v) => !v)} size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            New course
          </Button>
        }
      />

      {/* Inline create form */}
      {showForm && (
        <div className="mb-6 bg-white rounded-2xl border border-zinc-200 p-5">
          <h3 className="text-sm font-semibold text-zinc-800 mb-3">Add a course</h3>
          <form onSubmit={handleCreate} className="flex gap-3">
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. CS401 — Algorithms"
              className="flex-1"
            />
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </form>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-zinc-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-5 h-5" />}
          title="No courses yet"
          description="Add your first course to start tracking assignments."
          action={
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Add course
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {courses.map((course) => {
            const nextDeadline = course.assignments[0]?.dueDate;
            return (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-zinc-200 px-5 py-4 flex items-center gap-4 hover:border-zinc-300 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{course.name}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {course._count.assignments} assignment{course._count.assignments !== 1 ? "s" : ""}
                    {nextDeadline && ` · Next due ${formatDate(new Date(nextDeadline))}`}
                  </p>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDelete(course.id)}
                    disabled={deletingId === course.id}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    {deletingId === course.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                  <Link
                    href={`/inbox?courseId=${course.id}`}
                    className="text-xs font-medium text-zinc-500 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    Upload
                  </Link>
                </div>

                <Link href={`/courses/${course.id}`} className="ml-1 flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

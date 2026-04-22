"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { UploadDropzone } from "@/components/inbox/UploadDropzone";
import { ExtractionReviewCard } from "@/components/inbox/ExtractionReviewCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { CheckCircle, Inbox, ArrowRight } from "lucide-react";
import type { AssignmentFull, Course } from "@/types";

export default function InboxPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<AssignmentFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedItems, setSavedItems] = useState<Array<{ id: string; courseName: string }>>([]);

  const fetchData = useCallback(async () => {
    const [coursesRes, assignmentsRes] = await Promise.all([
      fetch("/api/courses"),
      fetch("/api/assignments?reviewed=false"),
    ]);
    if (coursesRes.ok) setCourses(await coursesRes.json());
    if (assignmentsRes.ok) setPendingAssignments(await assignmentsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleDocumentReady(_docId: string) {
    // Refresh pending assignments after extraction
    setTimeout(() => fetchData(), 500);
  }

  function handleConfirmed({ id, courseName }: { id: string; courseName: string }) {
    setPendingAssignments((prev) => prev.filter((a) => a.id !== id));
    setSavedItems((prev) => [...prev, { id, courseName }]);
    router.refresh(); // bust the RSC cache so dashboard shows the newly confirmed assignment
  }

  function handleDeleted(id: string) {
    setPendingAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Upload files and confirm extracted assignments before they appear in your plan."
      />

      {/* Upload area */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-zinc-700 mb-3">Upload a file</h2>
        <UploadDropzone courses={courses} onDocumentReady={handleDocumentReady} />
      </div>

      {/* Saved items banner */}
      {savedItems.length > 0 && (
        <div className="mb-6 space-y-2">
          {savedItems.map((item) => (
            <div
              key={item.id}
              className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 flex items-center gap-3"
            >
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-800 flex-1">
                Assignment saved
                {item.courseName ? ` to ${item.courseName}` : ""}.
                {" "}Find it in your Dashboard and Upcoming tasks.
              </p>
              <Link
                href={`/assignments/${item.id}`}
                className="flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 whitespace-nowrap"
              >
                View assignment
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pending review */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-700">
            Needs review
            {pendingAssignments.length > 0 && (
              <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-medium px-1.5 py-0.5 rounded-full">
                {pendingAssignments.length}
              </span>
            )}
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-48 bg-zinc-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : pendingAssignments.length === 0 ? (
          <EmptyState
            icon={<Inbox className="w-5 h-5" />}
            title={savedItems.length > 0 ? "All caught up" : "No items waiting for review"}
            description={
              savedItems.length > 0
                ? "Your confirmed assignments are now visible in Dashboard and Upcoming tasks."
                : "Upload a file above to extract assignments from your course materials."
            }
          />
        ) : (
          <div className="space-y-4">
            {pendingAssignments.map((assignment) => (
              <ExtractionReviewCard
                key={assignment.id}
                assignment={assignment}
                courses={courses}
                onConfirmed={handleConfirmed}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

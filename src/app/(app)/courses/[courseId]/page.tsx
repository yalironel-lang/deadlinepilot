"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ResourcesSection } from "@/components/resources/ResourcesSection";

interface CourseData {
  id: string;
  name: string;
  _count: { assignments: number; resources: number };
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCourse = useCallback(async () => {
    const res = await fetch(`/api/courses/${courseId}`);
    if (res.status === 401) { router.push("/login"); return; }
    if (!res.ok) { router.push("/courses"); return; }
    setCourse(await res.json());
    setLoading(false);
  }, [courseId, router]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-100 rounded-lg animate-pulse" />
        <div className="h-16 bg-zinc-100 rounded-2xl animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-zinc-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <>
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All courses
      </Link>

      <PageHeader
        title={course.name}
        description={`${course._count.assignments} assignment${course._count.assignments !== 1 ? "s" : ""}`}
        action={
          <Link
            href={`/inbox?courseId=${courseId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-zinc-50 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload files
          </Link>
        }
      />

      <ResourcesSection
        baseUrl={`/api/courses/${courseId}/resources`}
        label="Course Resources"
        emptyDescription="Add files, links, chat references, or notes to keep everything for this course in one place."
      />
    </>
  );
}

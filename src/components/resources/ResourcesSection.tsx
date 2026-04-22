"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  FileText,
  Link2,
  MessageSquare,
  StickyNote,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Resource } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ResourceType = "file" | "link" | "chat_reference" | "note";

interface ResourcesSectionProps {
  /** Base URL for GET (list) and POST (create). DELETE uses `${baseUrl}/${id}`. */
  baseUrl: string;
  /** Displayed as the section heading. e.g. "Course Resources", "Assignment Resources" */
  label: string;
  /** Shown in the empty state body. */
  emptyDescription?: string;
  /** Optional read-only section: course resources inherited from the parent course. */
  courseResourcesUrl?: string;
  courseResourcesLabel?: string;
  courseName?: string;
  courseHref?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const TYPE_META: Record<
  ResourceType,
  { label: string; pluralLabel: string; icon: React.ReactNode; color: string; bg: string }
> = {
  file: {
    label: "File",
    pluralLabel: "Files",
    icon: <FileText className="w-4 h-4" />,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  link: {
    label: "Link",
    pluralLabel: "Links",
    icon: <Link2 className="w-4 h-4" />,
    color: "text-emerald-600",
    bg: "bg-emerald-100",
  },
  chat_reference: {
    label: "AI / Chat Reference",
    pluralLabel: "AI / Chat References",
    icon: <MessageSquare className="w-4 h-4" />,
    color: "text-violet-600",
    bg: "bg-violet-100",
  },
  note: {
    label: "Note",
    pluralLabel: "Notes",
    icon: <StickyNote className="w-4 h-4" />,
    color: "text-amber-600",
    bg: "bg-amber-100",
  },
};

const GROUP_ORDER: ResourceType[] = ["file", "link", "chat_reference", "note"];

// ─── Component ────────────────────────────────────────────────────────────────

export function ResourcesSection({
  baseUrl,
  label,
  emptyDescription = "Add files, links, chat references, or notes to keep everything in one place.",
  courseResourcesUrl,
  courseResourcesLabel = "Course Resources",
  courseName,
  courseHref,
}: ResourcesSectionProps) {
  const router = useRouter();

  const [resources, setResources] = useState<Resource[]>([]);
  const [courseResources, setCourseResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [activeType, setActiveType] = useState<ResourceType>("link");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  // Form fields
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResources = useCallback(async () => {
    try {
      const fetches: Promise<Response>[] = [fetch(baseUrl)];
      if (courseResourcesUrl) fetches.push(fetch(courseResourcesUrl));

      const results = await Promise.all(fetches);

      if (results[0].status === 401) { router.push("/login"); return; }
      if (results[0].ok) setResources(await results[0].json());

      if (results[1]) {
        if (results[1].ok) setCourseResources(await results[1].json());
      }
    } finally {
      setLoading(false);
    }
  }, [baseUrl, courseResourcesUrl, router]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  function resetForm() {
    setTitle(""); setUrl(""); setDescription(""); setBody(""); setFile(null); setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleTypeChange(type: ResourceType) {
    setActiveType(type);
    resetForm();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setCreating(true);

    try {
      let res: Response;

      if (activeType === "file") {
        if (!file) { setFormError("Please select a file."); return; }
        if (!title.trim()) { setFormError("Title is required."); return; }
        const fd = new FormData();
        fd.append("file", file);
        fd.append("title", title.trim());
        if (description.trim()) fd.append("description", description.trim());
        res = await fetch(baseUrl, { method: "POST", body: fd });
      } else {
        if (!title.trim()) { setFormError("Title is required."); return; }
        if ((activeType === "link" || activeType === "chat_reference") && !url.trim()) {
          setFormError("URL is required."); return;
        }
        res = await fetch(baseUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: activeType,
            title: title.trim(),
            url: url.trim() || undefined,
            description: description.trim() || undefined,
            body: body.trim() || undefined,
          }),
        });
      }

      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        const msg = ct.includes("application/json")
          ? ((await res.json()).error ?? "Failed to add resource")
          : "Failed to add resource";
        setFormError(msg);
        return;
      }

      const created: Resource = await res.json();
      setResources((prev) => [created, ...prev]);
      setShowForm(false);
      resetForm();
    } catch {
      setFormError("Network error — please try again.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(resourceId: string) {
    setDeletingId(resourceId);
    try {
      const res = await fetch(`${baseUrl}/${resourceId}`, { method: "DELETE" });
      if (res.ok) setResources((prev) => prev.filter((r) => r.id !== resourceId));
    } finally {
      setDeletingId(null);
    }
  }

  const grouped = GROUP_ORDER.reduce<Record<ResourceType, Resource[]>>(
    (acc, type) => { acc[type] = resources.filter((r) => r.type === type); return acc; },
    { file: [], link: [], chat_reference: [], note: [] }
  );

  const hasCourseResources = courseResources.length > 0;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-700">{label}</h2>
        <Button size="sm" variant="outline" onClick={() => { setShowForm((v) => !v); resetForm(); }}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add resource
        </Button>
      </div>

      {/* Add resource form */}
      {showForm && (
        <div className="mb-6 bg-white rounded-2xl border border-zinc-200 p-5">
          {/* Type selector */}
          <div className="flex gap-1 mb-5 bg-zinc-100 rounded-xl p-1 w-fit flex-wrap">
            {(["link", "chat_reference", "file", "note"] as ResourceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeType === type
                    ? "bg-white shadow-sm text-zinc-900"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                <span className={activeType === type ? TYPE_META[type].color : ""}>
                  {TYPE_META[type].icon}
                </span>
                {TYPE_META[type].label}
              </button>
            ))}
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            {activeType === "file" && (
              <>
                <div>
                  <label className="text-xs font-medium text-zinc-600 block mb-1.5">
                    File <span className="text-zinc-400">(PDF or TXT, max 10 MB)</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,application/pdf,text/plain"
                    onChange={handleFileChange}
                    className="text-sm text-zinc-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 block mb-1.5">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Week 3 Lecture Notes" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 block mb-1.5">
                    Description <span className="text-zinc-400">(optional)</span>
                  </label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's in this file?" />
                </div>
              </>
            )}

            {activeType === "link" && (
              <>
                <div>
                  <label className="text-xs font-medium text-zinc-600 block mb-1.5">URL</label>
                  <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" autoFocus />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 block mb-1.5">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Course textbook" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 block mb-1.5">
                    Description <span className="text-zinc-400">(optional)</span>
                  </label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this link for?" />
                </div>
              </>
            )}

            {activeType === "chat_reference" && (
              <>
                <div>
                  <label className="text-xs font-medium text-zinc-600 block mb-1.5">Chat URL</label>
                  <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://claude.ai/chat/… or similar" autoFocus />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 block mb-1.5">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Study session — recursion explained" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 block mb-1.5">
                    Summary{" "}
                    <span className="text-violet-600 font-normal">— strongly recommended: chat links go stale</span>
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Briefly describe what you covered. e.g. 'Walkthrough of dynamic programming with memoization examples.'"
                    rows={2}
                    className="text-sm"
                  />
                </div>
              </>
            )}

            {activeType === "note" && (
              <>
                <div>
                  <label className="text-xs font-medium text-zinc-600 block mb-1.5">Title</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Key formulas for midterm" autoFocus />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 block mb-1.5">Note</label>
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your note here…" rows={4} className="text-sm" />
                </div>
              </>
            )}

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <div className="flex items-center gap-2 pt-1">
              <Button type="submit" size="sm" disabled={creating}>
                {creating && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                {creating ? "Saving…" : "Save resource"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => { setShowForm(false); resetForm(); }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Resource list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-12 bg-zinc-100 rounded-xl animate-pulse" />)}
        </div>
      ) : resources.length === 0 && !showForm ? (
        <EmptyState
          icon={<FileText className="w-5 h-5" />}
          title={`No ${label.toLowerCase()} yet`}
          description={emptyDescription}
          action={
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add resource
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {GROUP_ORDER.map((type) => {
            const items = grouped[type];
            if (items.length === 0) return null;
            const meta = TYPE_META[type];
            return (
              <section key={type}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-5 h-5 rounded-md ${meta.bg} flex items-center justify-center ${meta.color}`}>
                    {meta.icon}
                  </div>
                  <h3 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                    {meta.pluralLabel}
                  </h3>
                  <span className="text-xs text-zinc-400">{items.length}</span>
                </div>
                <ResourceList items={items} deletingId={deletingId} onDelete={handleDelete} />
              </section>
            );
          })}
        </div>
      )}

      {/* Inherited course resources — read-only */}
      {hasCourseResources && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
              {courseResourcesLabel}
              {courseName && <span className="font-normal normal-case ml-1">({courseName})</span>}
            </h3>
            {courseHref && (
              <Link href={courseHref} className="text-xs text-zinc-400 hover:text-indigo-600 transition-colors">
                View all →
              </Link>
            )}
          </div>
          <div className="bg-zinc-50 rounded-2xl border border-zinc-200 overflow-hidden">
            <ul className="divide-y divide-zinc-100">
              {courseResources.map((r) => {
                const meta = TYPE_META[r.type as ResourceType] ?? TYPE_META.link;
                const href =
                  r.type === "file" && r.storagePath ? r.storagePath : r.url ?? null;
                const subtitle = r.description ?? (r.type === "note" && r.body ? r.body.slice(0, 80) + "…" : r.url ?? null);
                return (
                  <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-6 h-6 rounded-md ${meta.bg} flex items-center justify-center flex-shrink-0 ${meta.color} opacity-75`}>
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-700 hover:text-indigo-600 transition-colors flex items-center gap-1 truncate">
                          {r.title}
                          <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
                        </a>
                      ) : (
                        <p className="text-sm text-zinc-700 truncate">{r.title}</p>
                      )}
                      {subtitle && <p className="text-xs text-zinc-400 truncate mt-0.5">{subtitle}</p>}
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${meta.bg} ${meta.color} flex-shrink-0`}>
                      {meta.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Resource list ─────────────────────────────────────────────────────────────

function ResourceList({
  items,
  deletingId,
  onDelete,
}: {
  items: Resource[];
  deletingId: string | null;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
      <ul className="divide-y divide-zinc-100">
        {items.map((r) => {
          const meta = TYPE_META[r.type as ResourceType] ?? TYPE_META.link;
          const href = r.type === "file" && r.storagePath ? r.storagePath : r.url ?? null;
          const subtitle =
            r.description ||
            (r.type === "note" && r.body
              ? r.body.slice(0, 120) + (r.body.length > 120 ? "…" : "")
              : r.url ?? null);

          return (
            <li key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors group">
              <div className={`w-7 h-7 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                {href ? (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-zinc-900 hover:text-indigo-600 transition-colors flex items-center gap-1 truncate">
                    {r.title}
                    <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                  </a>
                ) : (
                  <p className="text-sm font-medium text-zinc-900 truncate">{r.title}</p>
                )}
                {subtitle && <p className="text-xs text-zinc-400 truncate mt-0.5">{subtitle}</p>}
              </div>
              {r.type === "file" && r.fileSize != null && (
                <span className="text-xs text-zinc-400 flex-shrink-0">
                  {(r.fileSize / 1024).toFixed(0)} KB
                </span>
              )}
              <button
                onClick={() => onDelete(r.id)}
                disabled={deletingId === r.id}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                {deletingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

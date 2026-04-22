"use client";

import { useState, useRef } from "react";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Course } from "@/types";

interface UploadDropzoneProps {
  courses: Course[];
  onDocumentReady: (documentId: string) => void;
}

export function UploadDropzone({ courses, onDocumentReady }: UploadDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [courseId, setCourseId] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "extracting" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function handleFile(f: File) {
    if (!f.type.match(/^(application\/pdf|text\/plain)$/)) {
      setError("Only PDF and TXT files are supported");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB");
      return;
    }
    setFile(f);
    setError("");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file) return;

    // A course must be selected — required for FK integrity
    if (!courseId) {
      setError("Please select a course before uploading so we know where to save the extracted assignments.");
      return;
    }

    setUploading(true);
    setStatus("uploading");
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    if (courseId) formData.append("courseId", courseId);

    try {
      const res = await fetch("/api/documents", { method: "POST", body: formData });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Upload failed");
      }
      const doc = await res.json();
      setStatus("extracting");

      // Poll until extraction is done
      pollRef.current = setInterval(async () => {
        const pollRes = await fetch(`/api/documents/${doc.id}`);
        if (!pollRes.ok) return;
        const pollData = await pollRes.json();
        if (pollData.extractionStatus === "done") {
          clearInterval(pollRef.current!);
          setStatus("done");
          setFile(null);
          setCourseId("");
          onDocumentReady(doc.id);
        } else if (pollData.extractionStatus === "error") {
          clearInterval(pollRef.current!);
          setStatus("error");
          setError("Extraction failed: " + (pollData.errorMessage || "unknown error"));
        }
      }, 1500);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
          dragging ? "border-indigo-400 bg-indigo-50" : file ? "border-zinc-300 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-zinc-800 truncate max-w-xs">{file.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setStatus("idle"); }}
              className="text-zinc-400 hover:text-zinc-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 text-zinc-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-700">Drop a PDF or TXT file here</p>
            <p className="text-xs text-zinc-400 mt-1">or click to browse · Max 10 MB</p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* Course selector */}
      {file && (
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="text-xs font-medium text-zinc-600 block mb-1.5">Select a course (required)</label>
            <Select value={courseId} onValueChange={(v) => setCourseId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course…" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleUpload} disabled={uploading || status === "extracting" || !courseId}>
            {status === "extracting" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extracting…
              </>
            ) : (
              "Upload & Extract"
            )}
          </Button>
        </div>
      )}

      {status === "extracting" && (
        <div className="flex items-center gap-2 text-sm text-zinc-500 bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-200">
          <Loader2 className="w-4 h-4 animate-spin" />
          Extracting assignments from your file…
        </div>
      )}
    </div>
  );
}

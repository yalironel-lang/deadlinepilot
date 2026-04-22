"use client";

import { useState } from "react";
import { CheckSquare, Square, Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Task } from "@/types";

interface TaskListProps {
  assignmentId: string;
  tasks: Task[];
  mutatingTaskId: string | null;
  onTaskStatusChange: (taskId: string, newStatus: string) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  onTaskAdded: () => void;
}

export function TaskList({
  assignmentId,
  tasks,
  mutatingTaskId,
  onTaskStatusChange,
  onTaskDelete,
  onTaskAdded,
}: TaskListProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/assignments/${assignmentId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        setNewTitle("");
        setShowAdd(false);
        onTaskAdded();
      }
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-700">
          Subtasks
          {tasks.length > 0 && (
            <span className="ml-2 text-zinc-400 font-normal">
              {tasks.filter((t) => t.status === "done").length}/{tasks.length} done
            </span>
          )}
        </h3>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <Plus className="w-3.5 h-3.5 inline mr-0.5" />
          Add task
        </button>
      </div>

      {tasks.length === 0 && !showAdd && (
        <p className="text-sm text-zinc-400 py-3">No subtasks yet.</p>
      )}

      <ul className="space-y-1">
        {tasks.map((task) => {
          const isMutating = mutatingTaskId === task.id;
          const newStatus = task.status === "done" ? "not_started" : "done";
          return (
            <li key={task.id} className="flex items-center gap-2.5 py-1 group">
              <button
                onClick={() => onTaskStatusChange(task.id, newStatus)}
                disabled={isMutating || mutatingTaskId !== null}
                className="flex-shrink-0 text-zinc-400 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMutating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : task.status === "done" ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>
              <span
                className={`text-sm flex-1 ${
                  task.status === "done" ? "line-through text-zinc-400" : "text-zinc-700"
                }`}
              >
                {task.title}
              </span>
              {task.estimatedMinutes && (
                <span className="text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  ~{task.estimatedMinutes}m
                </span>
              )}
              <button
                onClick={() => onTaskDelete(task.id)}
                disabled={isMutating || mutatingTaskId !== null}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-300 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isMutating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {showAdd && (
        <form onSubmit={addTask} className="flex gap-2 mt-2">
          <Input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Task title…"
            className="text-sm flex-1"
          />
          <Button type="submit" size="sm" disabled={adding}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setShowAdd(false)}>
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
}

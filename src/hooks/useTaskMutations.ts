import { useState, useRef } from "react";
import type { AssignmentFull } from "@/types";

export function useTaskMutations(
  assignmentId: string,
  assignment: AssignmentFull | null,
  setAssignment: React.Dispatch<React.SetStateAction<AssignmentFull | null>>,
  showToast: (message: string, type: "success" | "error") => void,
) {
  const [mutatingTaskId, setMutatingTaskId] = useState<string | null>(null);
  const mutationGen = useRef(0);

  async function handleTaskStatusChange(
    taskId: string,
    newStatus: string,
    taskTitle?: string,
  ): Promise<void> {
    if (mutatingTaskId) return;
    const gen = ++mutationGen.current;
    const prevTasks = assignment!.tasks;

    setMutatingTaskId(taskId);
    setAssignment((prev) =>
      prev
        ? { ...prev, tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)) }
        : null,
    );

    const res = await fetch(`/api/assignments/${assignmentId}/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, status: newStatus }),
    });

    setMutatingTaskId(null);

    if (res.ok) {
      if (newStatus === "done" && taskTitle) {
        showToast(`"${taskTitle}" marked done.`, "success");
      }
    } else {
      if (mutationGen.current === gen) {
        setAssignment((prev) => (prev ? { ...prev, tasks: prevTasks } : null));
      }
      showToast("Failed to update task. Try again.", "error");
    }
  }

  async function handleTaskDelete(taskId: string): Promise<void> {
    if (mutatingTaskId) return;
    const gen = ++mutationGen.current;
    const prevTasks = assignment!.tasks;

    setMutatingTaskId(taskId);
    setAssignment((prev) =>
      prev ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) } : null,
    );

    const res = await fetch(`/api/assignments/${assignmentId}/tasks`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    });

    setMutatingTaskId(null);

    if (!res.ok) {
      if (mutationGen.current === gen) {
        setAssignment((prev) => (prev ? { ...prev, tasks: prevTasks } : null));
      }
      showToast("Failed to delete task. Try again.", "error");
    }
  }

  return { mutatingTaskId, handleTaskStatusChange, handleTaskDelete };
}

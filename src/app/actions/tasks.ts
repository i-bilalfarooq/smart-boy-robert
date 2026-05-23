"use server";

import { createClient } from "@/lib/supabase/server";
import { TaskStatus } from "@/types";

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating task status:", error);
    throw new Error("Failed to update task status");
  }
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting task:", error);
    throw new Error("Failed to delete task");
  }
}

export async function updateTaskDetails(
  taskId: string,
  data: { task_title: string; description: string; due_date: string; task_type: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      task_title: data.task_title,
      description: data.description,
      due_date: data.due_date,
      task_type: data.task_type,
    })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating task details:", error);
    throw new Error("Failed to update task details");
  }
}

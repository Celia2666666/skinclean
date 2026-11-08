import type { Metadata } from "next";
import { all } from "@/lib/crm/db";
import { ensureCrmSeeded } from "@/lib/crm/repo";
import { TasksView } from "@/components/crm/pages/TasksView";

export const metadata: Metadata = { title: "Tâches" };

export default async function TasksPage() {
  await ensureCrmSeeded();
  return <TasksView tasks={all("tasks").slice().sort((a, b) => a.due.localeCompare(b.due))} />;
}

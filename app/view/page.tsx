"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Task = {
  id: string;
  task_name: string;
  assigned_to: string | null;
  status: string | null;
  priority: string | null;
  deadline: string | null;
  total_quantity: number | null;
  completed_quantity: number | null;
  notes: string | null;
};

export default function PublicView() {
  const supabase = createClient();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTasks() {
    const { data } = await supabase
      .from("office_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    setTasks(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <main style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>OfficeFlow Pro</h1>
      <p>Office Work Status</p>

      <button
        onClick={loadTasks}
        style={{
          padding: "10px 16px",
          marginBottom: "20px",
          cursor: "pointer",
        }}
      >
        🔄 Refresh
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks found.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              background: "white",
            }}
          >
            <thead>
              <tr>
                <th style={th}>Task</th>
                <th style={th}>Employee</th>
                <th style={th}>Status</th>
                <th style={th}>Priority</th>
                <th style={th}>Deadline</th>
                <th style={th}>Progress</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((task) => {
                const total = Number(task.total_quantity || 0);
                const completed = Number(task.completed_quantity || 0);
                const progress =
                  total > 0
                    ? Math.min(100, Math.round((completed / total) * 100))
                    : 0;

                return (
                  <tr key={task.id}>
                    <td style={td}>{task.task_name}</td>
                    <td style={td}>{task.assigned_to || "-"}</td>
                    <td style={td}>
                      <strong>{task.status || "Pending"}</strong>
                    </td>
                    <td style={td}>{task.priority || "-"}</td>
                    <td style={td}>{task.deadline || "-"}</td>
                    <td style={td}>
                      {completed} / {total}
                      <div
                        style={{
                          height: "7px",
                          background: "#e5e7eb",
                          borderRadius: "5px",
                          marginTop: "5px",
                        }}
                      >
                        <div
                          style={{
                            width: `${progress}%`,
                            height: "100%",
                            background: "#2563eb",
                            borderRadius: "5px",
                          }}
                        />
                      </div>
                      <small>{progress}%</small>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const th = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom: "2px solid #ddd",
};

const td = {
  padding: "12px",
  borderBottom: "1px solid #eee",
};

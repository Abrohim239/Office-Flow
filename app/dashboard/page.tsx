"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();

type Task = {
  id: string;
  task_name: string;
  assigned_to: string | null;
  status: string;
  deadline: string | null;
  total_quantity: number;
  completed_quantity: number;
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTasks() {
    const { data, error } = await supabase
      .from("office_tasks")
      .select(
        "id, task_name, assigned_to, status, deadline, total_quantity, completed_quantity"
      )
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setTasks(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (t) => t.status.toLowerCase() === "completed"
  ).length;

  const pendingTasks = tasks.filter(
    (t) => t.status.toLowerCase() === "pending"
  ).length;

  const inProgressTasks = tasks.filter(
    (t) =>
      t.status.toLowerCase() !== "pending" &&
      t.status.toLowerCase() !== "completed"
  ).length;

  const overdueTasks = tasks.filter((t) => {
    if (!t.deadline) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(t.deadline);
    deadline.setHours(0, 0, 0, 0);

    return deadline < today && t.status.toLowerCase() !== "completed";
  }).length;

  const totalQuantity = tasks.reduce(
    (sum, t) => sum + Number(t.total_quantity || 0),
    0
  );

  const completedQuantity = tasks.reduce(
    (sum, t) => sum + Number(t.completed_quantity || 0),
    0
  );

  const employeeMap: Record<string, number> = {};

  tasks.forEach((task) => {
    const employee = task.assigned_to || "Unassigned";
    employeeMap[employee] = (employeeMap[employee] || 0) + 1;
  });

  const employees = Object.entries(employeeMap).sort(
    (a, b) => b[1] - a[1]
  );

  if (loading) {
    return (
      <main style={pageStyle}>
        <h1>Dashboard</h1>
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>OfficeFlow Dashboard</h1>
          <p style={subtitleStyle}>
            অফিসের সব কাজ এক নজরে দেখুন
          </p>
        </div>

        <button onClick={loadTasks} style={refreshButtonStyle}>
          🔄 Refresh
        </button>
      </div>

      {/* STATS */}
      <div style={gridStyle}>
        <StatCard
          title="Total Tasks"
          value={totalTasks}
          icon="📋"
        />

        <StatCard
          title="Pending"
          value={pendingTasks}
          icon="⏳"
        />

        <StatCard
          title="In Progress"
          value={inProgressTasks}
          icon="🔄"
        />

        <StatCard
          title="Completed"
          value={completedTasks}
          icon="✅"
        />

        <StatCard
          title="Overdue"
          value={overdueTasks}
          icon="⚠️"
        />

        <StatCard
          title="Total Quantity"
          value={totalQuantity}
          icon="📦"
        />

        <StatCard
          title="Completed Quantity"
          value={completedQuantity}
          icon="✔️"
        />
      </div>

      {/* QUANTITY PROGRESS */}
      <div style={sectionStyle}>
        <h2 style={sectionTitle}>📊 Overall Progress</h2>

        <div style={progressBackground}>
          <div
            style={{
              ...progressBar,
              width:
                totalQuantity > 0
                  ? `${Math.min(
                      (completedQuantity / totalQuantity) * 100,
                      100
                    )}%`
                  : "0%",
            }}
          />
        </div>

        <p style={progressText}>
          {totalQuantity > 0
            ? Math.round(
                (completedQuantity / totalQuantity) * 100
              )
            : 0}
          % Completed
        </p>
      </div>

      {/* EMPLOYEE TASKS */}
      <div style={sectionStyle}>
        <h2 style={sectionTitle}>👥 Employee-wise Tasks</h2>

        {employees.length === 0 ? (
          <p style={emptyStyle}>কোনো Task নেই</p>
        ) : (
          <div>
            {employees.map(([name, count]) => (
              <div key={name} style={employeeRow}>
                <strong>{name}</strong>

                <span style={employeeCount}>
                  {count} Task
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENT TASKS */}
      <div style={sectionStyle}>
        <h2 style={sectionTitle}>📝 Recent Tasks</h2>

        {tasks.length === 0 ? (
          <p style={emptyStyle}>
            এখনো কোনো office task নেই।
          </p>
        ) : (
          <div style={taskList}>
            {tasks.slice(0, 10).map((task) => (
              <div key={task.id} style={taskRow}>
                <div>
                  <strong>{task.task_name}</strong>

                  <div style={smallText}>
                    👤 {task.assigned_to || "Unassigned"}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={statusStyle}>
                    {task.status}
                  </div>

                  <div style={smallText}>
                    📦 {task.completed_quantity || 0} /{" "}
                    {task.total_quantity || 0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div style={cardStyle}>
      <div style={iconStyle}>{icon}</div>

      <div>
        <div style={cardTitle}>{title}</div>
        <div style={cardValue}>{value}</div>
      </div>
    </div>
  );
}

/* =========================
   STYLES
========================= */

const pageStyle = {
  padding: "30px",
  maxWidth: "1400px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "25px",
  gap: "15px",
};

const titleStyle = {
  fontSize: "30px",
  fontWeight: "700",
  margin: 0,
};

const subtitleStyle = {
  color: "#666",
  marginTop: "6px",
};

const refreshButtonStyle = {
  background: "#111",
  color: "#fff",
  border: "none",
  padding: "11px 18px",
  borderRadius: "8px",
  cursor: "pointer",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "16px",
  marginBottom: "25px",
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: "12px",
  padding: "20px",
  display: "flex",
  alignItems: "center",
  gap: "15px",
};

const iconStyle = {
  fontSize: "30px",
};

const cardTitle = {
  fontSize: "14px",
  color: "#666",
};

const cardValue = {
  fontSize: "28px",
  fontWeight: "700",
  marginTop: "3px",
};

const sectionStyle = {
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: "12px",
  padding: "22px",
  marginBottom: "22px",
};

const sectionTitle = {
  marginTop: 0,
  marginBottom: "18px",
  fontSize: "20px",
};

const progressBackground = {
  width: "100%",
  height: "18px",
  background: "#eee",
  borderRadius: "20px",
  overflow: "hidden" as const,
};

const progressBar = {
  height: "100%",
  background: "#111",
  borderRadius: "20px",
  transition: "width 0.4s ease",
};

const progressText = {
  marginBottom: 0,
  color: "#555",
  fontWeight: "600",
};

const employeeRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "13px 0",
  borderBottom: "1px solid #eee",
};

const employeeCount = {
  background: "#f1f1f1",
  padding: "6px 10px",
  borderRadius: "20px",
  fontSize: "13px",
};

const taskList = {
  display: "flex",
  flexDirection: "column" as const,
};

const taskRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  padding: "15px 0",
  borderBottom: "1px solid #eee",
};

const statusStyle = {
  fontWeight: "600",
  marginBottom: "5px",
};

const smallText = {
  fontSize: "13px",
  color: "#777",
  marginTop: "4px",
};

const emptyStyle = {
  textAlign: "center" as const,
  padding: "30px",
  color: "#777",
};

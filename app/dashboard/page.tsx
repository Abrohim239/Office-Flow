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

  // =========================
  // LOAD TASKS
  // =========================

  async function loadTasks() {
    setLoading(true);

    const { data, error } = await supabase
      .from("office_tasks")
      .select(
        "id, task_name, assigned_to, status, deadline, total_quantity, completed_quantity"
      )
      .order("created_at", { ascending: false });

    if (error) {
      alert("Dashboard Refresh Error: " + error.message);
      setLoading(false);
      return;
    }

    setTasks(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  // =========================
  // STATUS HELPERS
  // =========================

  function isCompleted(task: Task) {
    const status = (task.status || "")
      .trim()
      .toLowerCase();

    const total = Number(
      task.total_quantity || 0
    );

    const completed = Number(
      task.completed_quantity || 0
    );

    return (
      status === "completed" ||
      status === "complete" ||
      (total > 0 && completed >= total)
    );
  }

  function isPending(task: Task) {
    return (
      (task.status || "")
        .trim()
        .toLowerCase() === "pending"
    );
  }

  function isInProgress(task: Task) {
    return (
      !isPending(task) &&
      !isCompleted(task)
    );
  }

  // =========================
  // SUMMARY
  // =========================

  const totalTasks = tasks.length;

  const completedTasks =
    tasks.filter(isCompleted).length;

  const pendingTasks =
    tasks.filter(isPending).length;

  const inProgressTasks =
    tasks.filter(isInProgress).length;

  // =========================
  // OVERDUE
  // =========================

  const overdueTasks = tasks.filter((task) => {
    if (!task.deadline || isCompleted(task)) {
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = new Date(task.deadline);
    deadline.setHours(0, 0, 0, 0);

    return deadline < today;
  });

  // =========================
  // QUANTITY
  // =========================

  const totalQuantity = tasks.reduce(
    (sum, task) =>
      sum +
      Number(task.total_quantity || 0),
    0
  );

  const completedQuantity = tasks.reduce(
    (sum, task) =>
      sum +
      Number(task.completed_quantity || 0),
    0
  );

  const progress =
    totalQuantity > 0
      ? Math.min(
          Math.round(
            (completedQuantity /
              totalQuantity) *
              100
          ),
          100
        )
      : 0;

  // =========================
  // EMPLOYEE-WISE UNCOMPLETE
  // =========================

  const uncompleteEmployeeMap: Record<
    string,
    number
  > = {};

  tasks.forEach((task) => {
    if (isCompleted(task)) {
      return;
    }

    const employee =
      task.assigned_to || "Unassigned";

    uncompleteEmployeeMap[employee] =
      (uncompleteEmployeeMap[employee] || 0) +
      1;
  });

  const uncompleteEmployees =
    Object.entries(
      uncompleteEmployeeMap
    ).sort((a, b) => b[1] - a[1]);

  // =========================
  // EMPLOYEE-WISE COMPLETED
  // =========================

  const completedEmployeeMap: Record<
    string,
    number
  > = {};

  tasks.forEach((task) => {
    if (!isCompleted(task)) {
      return;
    }

    const employee =
      task.assigned_to || "Unassigned";

    completedEmployeeMap[employee] =
      (completedEmployeeMap[employee] || 0) +
      1;
  });

  const completedEmployees =
    Object.entries(
      completedEmployeeMap
    ).sort((a, b) => b[1] - a[1]);

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <main style={pageStyle}>
        <h1>OfficeFlow Dashboard</h1>
        <p>Loading...</p>
      </main>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <main style={pageStyle}>

      {/* HEADER */}
      <div style={headerStyle}>

        <div>
          <h1 style={titleStyle}>
            OfficeFlow Dashboard
          </h1>

          <p style={subtitleStyle}>
            অফিসের সব কাজ এক নজরে দেখুন
          </p>
        </div>

        <button
          type="button"
          onClick={loadTasks}
          disabled={loading}
          style={{
            ...refreshButtonStyle,
            opacity: loading ? 0.6 : 1,
            cursor: loading
              ? "not-allowed"
              : "pointer",
          }}
        >
          {loading
            ? "🔄 Refreshing..."
            : "🔄 Refresh"}
        </button>

      </div>

      {/* STAT CARDS */}
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
          value={overdueTasks.length}
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

      {/* STATUS REPORT */}
      <div style={sectionStyle}>

        <h2 style={sectionTitle}>
          📊 Status Report
        </h2>

        <ReportRow
          label="⏳ Pending"
          value={pendingTasks}
          total={totalTasks}
        />

        <ReportRow
          label="🔄 In Progress"
          value={inProgressTasks}
          total={totalTasks}
        />

        <ReportRow
          label="✅ Completed"
          value={completedTasks}
          total={totalTasks}
        />

        <ReportRow
          label="⚠️ Overdue"
          value={overdueTasks.length}
          total={totalTasks}
        />

      </div>

      {/* OVERALL PROGRESS */}
      <div style={sectionStyle}>

        <h2 style={sectionTitle}>
          📦 Overall Quantity Progress
        </h2>

        <div style={progressBackground}>

          <div
            style={{
              ...progressBar,
              width: `${progress}%`,
            }}
          />

        </div>

        <p style={progressText}>
          {progress}% Completed —{" "}
          {completedQuantity} / {totalQuantity}
        </p>

      </div>

      {/* OVERDUE TASKS */}
      <div style={sectionStyle}>

        <h2 style={sectionTitle}>
          ⚠️ Overdue Tasks
        </h2>

        {overdueTasks.length === 0 ? (

          <div style={successBox}>
            ✅ কোনো Overdue Task নেই
          </div>

        ) : (

          <div>

            {overdueTasks.map((task) => (

              <div
                key={task.id}
                style={overdueRow}
              >

                <div>

                  <strong>
                    {task.task_name}
                  </strong>

                  <div style={smallText}>
                    👤{" "}
                    {task.assigned_to ||
                      "Unassigned"}
                  </div>

                </div>

                <div style={overdueRight}>

                  <span style={overdueBadge}>
                    OVERDUE
                  </span>

                  <div style={smallText}>
                    Deadline:{" "}
                    {task.deadline}
                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* =========================
          UNCOMPLETE EMPLOYEE REPORT
      ========================= */}

      <div style={sectionStyle}>

        <h2 style={sectionTitle}>
          👥 Uncomplete Task by Employee
        </h2>

        <p style={employeeSubtitle}>
          কে কতগুলো কাজ এখনো শেষ করেনি
        </p>

        {uncompleteEmployees.length === 0 ? (

          <div style={successBox}>
            🎉 সব Employee-এর সব Task Complete!
          </div>

        ) : (

          uncompleteEmployees.map(
            ([name, count]) => (

              <div
                key={name}
                style={employeeRow}
              >

                <strong>
                  {name}
                </strong>

                <span
                  style={employeePendingCount}
                >
                  {count} Task বাকি
                </span>

              </div>

            )
          )

        )}

      </div>

      {/* =========================
          COMPLETED EMPLOYEE REPORT
      ========================= */}

      <div style={sectionStyle}>

        <h2 style={sectionTitle}>
          ✅ Completed Task by Employee
        </h2>

        <p style={employeeSubtitle}>
          কে কতগুলো কাজ Complete করেছে
        </p>

        {completedEmployees.length === 0 ? (

          <p style={emptyStyle}>
            এখনো কোনো Completed Task নেই।
          </p>

        ) : (

          completedEmployees.map(
            ([name, count]) => (

              <div
                key={name}
                style={employeeRow}
              >

                <strong>
                  {name}
                </strong>

                <span
                  style={employeeCompletedCount}
                >
                  {count} Task Complete
                </span>

              </div>

            )
          )

        )}

      </div>

      {/* RECENT TASKS */}
      <div style={sectionStyle}>

        <h2 style={sectionTitle}>
          📝 Recent Tasks
        </h2>

        {tasks.length === 0 ? (

          <p style={emptyStyle}>
            এখনো কোনো office task নেই।
          </p>

        ) : (

          tasks.slice(0, 10).map(
            (task) => (

              <div
                key={task.id}
                style={taskRow}
              >

                <div>

                  <strong>
                    {task.task_name}
                  </strong>

                  <div style={smallText}>
                    👤{" "}
                    {task.assigned_to ||
                      "Unassigned"}
                  </div>

                </div>

                <div style={taskRight}>

                  <div style={statusStyle}>

                    {isCompleted(task)
                      ? "Completed"
                      : task.status}

                  </div>

                  <div style={smallText}>

                    📦{" "}
                    {task.completed_quantity ||
                      0}

                    {" / "}

                    {task.total_quantity ||
                      0}

                  </div>

                </div>

              </div>

            )
          )

        )}

      </div>

    </main>
  );
}

/* =========================
   STAT CARD
========================= */

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

      <div style={iconStyle}>
        {icon}
      </div>

      <div>

        <div style={cardTitle}>
          {title}
        </div>

        <div style={cardValue}>
          {value}
        </div>

      </div>

    </div>
  );
}

/* =========================
   REPORT ROW
========================= */

function ReportRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percent =
    total > 0
      ? Math.round(
          (value / total) * 100
        )
      : 0;

  return (
    <div style={reportRow}>

      <div style={reportTop}>

        <strong>
          {label}
        </strong>

        <span>
          {value} ({percent}%)
        </span>

      </div>

      <div style={reportBackground}>

        <div
          style={{
            ...reportBar,
            width: `${percent}%`,
          }}
        />

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
  marginBottom: "10px",
  fontSize: "20px",
};

const employeeSubtitle = {
  color: "#777",
  fontSize: "14px",
  marginTop: 0,
  marginBottom: "15px",
};

const reportRow = {
  marginBottom: "18px",
};

const reportTop = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "7px",
  fontSize: "14px",
};

const reportBackground = {
  width: "100%",
  height: "10px",
  background: "#eee",
  borderRadius: "20px",
  overflow: "hidden" as const,
};

const reportBar = {
  height: "100%",
  background: "#111",
  borderRadius: "20px",
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

const overdueRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  padding: "15px",
  marginBottom: "10px",
  border: "1px solid #eee",
  borderRadius: "10px",
};

const overdueRight = {
  textAlign: "right" as const,
};

const overdueBadge = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "5px 9px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: "700",
};

const successBox = {
  background: "#ecfdf5",
  padding: "15px",
  borderRadius: "8px",
  color: "#166534",
};

const employeeRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "13px 0",
  borderBottom: "1px solid #eee",
};

const employeePendingCount = {
  background: "#fff7ed",
  color: "#c2410c",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "600",
};

const employeeCompletedCount = {
  background: "#dcfce7",
  color: "#166534",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: "600",
};

const taskRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "15px",
  padding: "15px 0",
  borderBottom: "1px solid #eee",
};

const taskRight = {
  textAlign: "right" as const,
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

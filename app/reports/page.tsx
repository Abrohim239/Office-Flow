"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();

type Task = {
  id: string;
  task_name: string;
  description?: string | null;
  assigned_to?: string | null;
  priority?: string | null;
  status?: string | null;
  start_date?: string | null;
  deadline?: string | null;
  total_quantity?: number | null;
  completed_quantity?: number | null;
  notes?: string | null;
  created_at?: string | null;
};

function getStatus(task: Task) {
  return (task.status || "Pending").trim().toLowerCase();
}

function isPending(task: Task) {
  return getStatus(task) === "pending";
}

function isCompleted(task: Task) {
  const status = getStatus(task);

  const total = Number(task.total_quantity || 0);
  const completed = Number(task.completed_quantity || 0);

  return (
    status === "completed" ||
    status === "complete" ||
    (total > 0 && completed >= total)
  );
}

function isInProgress(task: Task) {
  return !isPending(task) && !isCompleted(task);
}

function isOverdue(task: Task) {
  if (!task.deadline || isCompleted(task)) return false;

  const today = new Date().toISOString().split("T")[0];

  return task.deadline < today;
}


export default function ReportsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");

  async function loadTasks() {
    setLoading(true);

    const { data, error } = await supabase
      .from("office_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Task report load করতে সমস্যা হয়েছে");
    } else {
      setTasks(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const employees = useMemo(() => {
    const names = tasks
      .map((task) => task.assigned_to)
      .filter((name): name is string => Boolean(name));

    return Array.from(new Set(names)).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (fromDate) {
        if (!task.deadline || task.deadline < fromDate) {
          return false;
        }
      }

      if (toDate) {
        if (!task.deadline || task.deadline > toDate) {
          return false;
        }
      }

      if (
        employeeFilter !== "all" &&
        (task.assigned_to || "") !== employeeFilter
      ) {
        return false;
      }

      if (statusFilter === "pending" && !isPending(task)) {
        return false;
      }

      if (statusFilter === "in_progress" && !isInProgress(task)) {
        return false;
      }

      if (statusFilter === "completed" && !isCompleted(task)) {
        return false;
      }

      if (statusFilter === "overdue" && !isOverdue(task)) {
        return false;
      }

      return true;
    });
  }, [
    tasks,
    fromDate,
    toDate,
    statusFilter,
    employeeFilter,
  ]);

  const summary = useMemo(() => {
    const totalTasks = filteredTasks.length;

    const pending = filteredTasks.filter(isPending).length;

    const inProgress = filteredTasks.filter(isInProgress).length;

    const completed = filteredTasks.filter(isCompleted).length;

    const overdue = filteredTasks.filter(isOverdue).length;

    const totalQuantity = filteredTasks.reduce(
      (sum, task) => sum + Number(task.total_quantity || 0),
      0
    );

    const completedQuantity = filteredTasks.reduce(
      (sum, task) => sum + Number(task.completed_quantity || 0),
      0
    );

    const progress =
      totalQuantity > 0
        ? Math.min(
            100,
            Math.round((completedQuantity / totalQuantity) * 100)
          )
        : 0;

    return {
      totalTasks,
      pending,
      inProgress,
      completed,
      overdue,
      totalQuantity,
      completedQuantity,
      progress,
    };
  }, [filteredTasks]);

  const employeeReport = useMemo(() => {
    const report: Record<
      string,
      {
        tasks: number;
        completed: number;
        totalQuantity: number;
        completedQuantity: number;
      }
    > = {};

    filteredTasks.forEach((task) => {
      const employee = task.assigned_to || "Unassigned";

      if (!report[employee]) {
        report[employee] = {
          tasks: 0,
          completed: 0,
          totalQuantity: 0,
          completedQuantity: 0,
        };
      }

      report[employee].tasks += 1;

      if (isCompleted(task)) {
        report[employee].completed += 1;
      }

      report[employee].totalQuantity += Number(
        task.total_quantity || 0
      );

      report[employee].completedQuantity += Number(
        task.completed_quantity || 0
      );
    });

    return Object.entries(report).sort(
      (a, b) => b[1].tasks - a[1].tasks
    );
  }, [filteredTasks]);

  function resetFilters() {
    setFromDate("");
    setToDate("");
    setStatusFilter("all");
    setEmployeeFilter("all");
  }

  function printReport() {
    window.print();
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📊 Task Reports</h1>
            <p style={styles.subtitle}>
              Office Task-এর বিস্তারিত রিপোর্ট
            </p>
          </div>

          <div style={styles.headerButtons}>
            <button
              onClick={loadTasks}
              style={styles.refreshButton}
            >
              🔄 Refresh
            </button>

            <button
              onClick={printReport}
              style={styles.printButton}
            >
              🖨️ Print Report
            </button>
          </div>
        </div>

        {/* FILTER */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>
            🔎 Report Filter
          </h2>

          <div style={styles.filterGrid}>

            <div>
              <label style={styles.label}>
                From Deadline
              </label>

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>
                To Deadline
              </label>

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={styles.input}
              />
            </div>

            <div>
              <label style={styles.label}>
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                style={styles.input}
              >
                <option value="all">
                  All Status
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="overdue">
                  Overdue
                </option>
              </select>
            </div>

            <div>
              <label style={styles.label}>
                Employee
              </label>

              <select
                value={employeeFilter}
                onChange={(e) =>
                  setEmployeeFilter(e.target.value)
                }
                style={styles.input}
              >
                <option value="all">
                  All Employees
                </option>

                {employees.map((employee) => (
                  <option
                    key={employee}
                    value={employee}
                  >
                    {employee}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={resetFilters}
              style={styles.resetButton}
            >
              ✕ Reset Filter
            </button>
          </div>
        </section>

        {/* SUMMARY */}
        <h2 style={styles.sectionTitle}>
          📈 Summary
        </h2>

        <section style={styles.cards}>

          <div style={styles.card}>
            <div style={styles.icon}>📋</div>
            <div>
              <div style={styles.cardLabel}>
                Total Tasks
              </div>
              <div style={styles.cardNumber}>
                {summary.totalTasks}
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>⏳</div>
            <div>
              <div style={styles.cardLabel}>
                Pending
              </div>
              <div style={styles.cardNumber}>
                {summary.pending}
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>⚙️</div>
            <div>
              <div style={styles.cardLabel}>
                In Progress
              </div>
              <div style={styles.cardNumber}>
                {summary.inProgress}
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>✅</div>
            <div>
              <div style={styles.cardLabel}>
                Completed
              </div>
              <div style={styles.cardNumber}>
                {summary.completed}
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>⚠️</div>
            <div>
              <div style={styles.cardLabel}>
                Overdue
              </div>
              <div style={styles.cardNumber}>
                {summary.overdue}
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>📦</div>
            <div>
              <div style={styles.cardLabel}>
                Total Quantity
              </div>
              <div style={styles.cardNumber}>
                {summary.totalQuantity}
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>🎯</div>
            <div>
              <div style={styles.cardLabel}>
                Completed Quantity
              </div>
              <div style={styles.cardNumber}>
                {summary.completedQuantity}
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>📊</div>
            <div>
              <div style={styles.cardLabel}>
                Progress
              </div>
              <div style={styles.cardNumber}>
                {summary.progress}%
              </div>
            </div>
          </div>

        </section>

        {/* QUANTITY PROGRESS */}
        <section style={styles.panel}>
          <div style={styles.progressHeader}>
            <h2 style={styles.sectionTitle}>
              📊 Overall Quantity Progress
            </h2>

            <strong>
              {summary.progress}%
            </strong>
          </div>

          <div style={styles.progressBackground}>
            <div
              style={{
                ...styles.progressBar,
                width: `${summary.progress}%`,
              }}
            />
          </div>

          <p style={styles.smallText}>
            Completed {summary.completedQuantity} /{" "}
            {summary.totalQuantity} quantity
          </p>
        </section>

        {/* EMPLOYEE REPORT */}
        <section style={styles.panel}>
          <h2 style={styles.sectionTitle}>
            👥 Employee-wise Report
          </h2>

          {employeeReport.length === 0 ? (
            <p style={styles.empty}>
              কোনো employee data পাওয়া যায়নি।
            </p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      Employee
                    </th>

                    <th style={styles.th}>
                      Tasks
                    </th>

                    <th style={styles.th}>
                      Completed
                    </th>

                    <th style={styles.th}>
                      Total Qty
                    </th>

                    <th style={styles.th}>
                      Completed Qty
                    </th>

                    <th style={styles.th}>
                      Progress
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {employeeReport.map(
                    ([employee, data]) => {
                      const progress =
                        data.totalQuantity > 0
                          ? Math.min(
                              100,
                              Math.round(
                                (data.completedQuantity /
                                  data.totalQuantity) *
                                  100
                              )
                            )
                          : 0;

                      return (
                        <tr key={employee}>
                          <td style={styles.td}>
                            <strong>
                              {employee}
                            </strong>
                          </td>

                          <td style={styles.td}>
                            {data.tasks}
                          </td>

                          <td style={styles.td}>
                            {data.completed}
                          </td>

                          <td style={styles.td}>
                            {data.totalQuantity}
                          </td>

                          <td style={styles.td}>
                            {data.completedQuantity}
                          </td>

                          <td style={styles.td}>
                            <div
                              style={
                                styles.miniProgressBackground
                              }
                            >
                              <div
                                style={{
                                  ...styles.miniProgress,
                                  width: `${progress}%`,
                                }}
                              />
                            </div>

                            {progress}%
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* TASK REPORT */}
        <section style={styles.panel}>
          <div style={styles.progressHeader}>
            <h2 style={styles.sectionTitle}>
              📋 Task Report
            </h2>

            <span style={styles.badge}>
              {filteredTasks.length} Tasks
            </span>
          </div>

          {loading ? (
            <p style={styles.empty}>
              Loading...
            </p>
          ) : filteredTasks.length === 0 ? (
            <p style={styles.empty}>
              এই filter অনুযায়ী কোনো Task পাওয়া যায়নি।
            </p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      Task
                    </th>

                    <th style={styles.th}>
                      Employee
                    </th>

                    <th style={styles.th}>
                      Status
                    </th>

                    <th style={styles.th}>
                      Start
                    </th>

                    <th style={styles.th}>
                      Deadline
                    </th>

                    <th style={styles.th}>
                      Total Qty
                    </th>

                    <th style={styles.th}>
                      Completed
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTasks.map((task) => {
                    const completed =
                      isCompleted(task);

                    const overdue =
                      isOverdue(task);

                    return (
                      <tr key={task.id}>

                        <td style={styles.td}>
                          <strong>
                            {task.task_name}
                          </strong>

                          {task.description && (
                            <div
                              style={
                                styles.description
                              }
                            >
                              {task.description}
                            </div>
                          )}
                        </td>

                        <td style={styles.td}>
                          {task.assigned_to ||
                            "Unassigned"}
                        </td>

                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              ...(completed
                                ? styles.completedBadge
                                : overdue
                                ? styles.overdueBadge
                                : isPending(task)
                                ? styles.pendingBadge
                                : styles.progressBadge),
                            }}
                          >
                            {overdue
                              ? "Overdue"
                              : task.status ||
                                "Pending"}
                          </span>
                        </td>

                        <td style={styles.td}>
                          {task.start_date || "-"}
                        </td>

                        <td style={styles.td}>
                          {task.deadline || "-"}
                        </td>

                        <td style={styles.td}>
                          {Number(
                            task.total_quantity || 0
                          )}
                        </td>

                        <td style={styles.td}>
                          {Number(
                            task.completed_quantity || 0
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>

      <style jsx global>{`
        @media print {
          button,
          input,
          select {
            display: none !important;
          }

          body {
            background: white !important;
          }
        }
      `}</style>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "30px 20px",
  },

  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "25px",
    flexWrap: "wrap" as const,
  },

  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: 800,
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#667085",
  },

  headerButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap" as const,
  },

  refreshButton: {
    border: "none",
    padding: "11px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    background: "#111827",
    color: "#fff",
    fontWeight: 600,
  },

  printButton: {
    border: "none",
    padding: "11px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
  },

  panel: {
    background: "#fff",
    borderRadius: "16px",
    padding: "22px",
    marginBottom: "25px",
    boxShadow:
      "0 4px 18px rgba(0,0,0,0.05)",
  },

  sectionTitle: {
    margin: "0 0 15px",
    fontSize: "20px",
    fontWeight: 800,
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "15px",
    alignItems: "end",
  },

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "7px",
    color: "#344054",
  },

  input: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "11px 12px",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    background: "#fff",
    fontSize: "14px",
  },

  resetButton: {
    padding: "11px 15px",
    border: "1px solid #d0d5dd",
    borderRadius: "9px",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "15px",
    marginBottom: "25px",
  },

  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
    boxShadow:
      "0 4px 18px rgba(0,0,0,0.05)",
  },

  icon: {
    fontSize: "28px",
  },

  cardLabel: {
    color: "#667085",
    fontSize: "13px",
    marginBottom: "3px",
  },

  cardNumber: {
    fontSize: "25px",
    fontWeight: 800,
  },

  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
  },

  progressBackground: {
    width: "100%",
    height: "14px",
    background: "#eaecf0",
    borderRadius: "20px",
    overflow: "hidden" as const,
  },

  progressBar: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "20px",
    transition: "width 0.3s ease",
  },

  smallText: {
    color: "#667085",
    fontSize: "13px",
    marginBottom: 0,
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto" as const,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    minWidth: "850px",
  },

  th: {
    textAlign: "left" as const,
    padding: "13px 12px",
    borderBottom: "2px solid #eaecf0",
    fontSize: "13px",
    color: "#475467",
    background: "#f9fafb",
  },

  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #eaecf0",
    fontSize: "14px",
    verticalAlign: "middle" as const,
  },

  description: {
    color: "#667085",
    fontSize: "12px",
    marginTop: "4px",
  },

  statusBadge: {
    display: "inline-block",
    padding: "5px 9px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 700,
  },

  completedBadge: {
    background: "#dcfce7",
    color: "#166534",
  },

  overdueBadge: {
    background: "#fee2e2",
    color: "#b91c1c",
  },

  pendingBadge: {
    background: "#fef3c7",
    color: "#92400e",
  },

  progressBadge: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },

  badge: {
    background: "#eef2ff",
    color: "#3730a3",
    padding: "7px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 700,
  },

  miniProgressBackground: {
    display: "inline-block",
    width: "100px",
    height: "7px",
    background: "#eaecf0",
    borderRadius: "10px",
    overflow: "hidden" as const,
    marginRight: "8px",
    verticalAlign: "middle",
  },

  miniProgress: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "10px",
  },

  empty: {
    color: "#667085",
    padding: "20px 0",
    textAlign: "center" as const,
  },
};

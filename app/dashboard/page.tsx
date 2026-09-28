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

type History = {
  id: string;
  task_id: string;
  previous_status?: string | null;
  new_status: string;
  completed_quantity?: number | null;
  note?: string | null;
  created_at: string;
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
  const completed = Number(
    task.completed_quantity || 0
  );

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
  if (!task.deadline || isCompleted(task)) {
    return false;
  }

  const today = new Date()
    .toISOString()
    .split("T")[0];

  return task.deadline < today;
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");

  return new Date(
    Number(year),
    Number(month) - 1,
    1
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getMonthStart(key: string) {
  return `${key}-01`;
}

function getMonthEnd(key: string) {
  const [year, month] = key.split("-");

  const date = new Date(
    Number(year),
    Number(month),
    0
  );

  return date.toISOString().split("T")[0];
}

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] =
    useState("");

  // =========================
  // LOAD DATA
  // =========================

  async function loadData() {
    setLoading(true);

    const [taskResult, historyResult] =
      await Promise.all([
        supabase
          .from("office_tasks")
          .select("*")
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("office_task_updates")
          .select("*")
          .order("created_at", {
            ascending: true,
          }),
      ]);

    if (taskResult.error) {
      alert(
        "Task Load Error: " +
          taskResult.error.message
      );

      setLoading(false);
      return;
    }

    if (historyResult.error) {
      alert(
        "History Load Error: " +
          historyResult.error.message
      );

      setLoading(false);
      return;
    }

    const loadedTasks = taskResult.data || [];
    const loadedHistory =
      historyResult.data || [];

    setTasks(loadedTasks);
    setHistory(loadedHistory);

    // Latest month automatically select
    const allMonths = [
      ...loadedTasks
        .map((task) =>
          task.created_at
            ? monthKey(task.created_at)
            : ""
        )
        .filter(Boolean),

      ...loadedHistory.map((item) =>
        monthKey(item.created_at)
      ),
    ];

    const uniqueMonths = Array.from(
      new Set(allMonths)
    ).sort();

    if (
      uniqueMonths.length > 0 &&
      !selectedMonth
    ) {
      setSelectedMonth(
        uniqueMonths[uniqueMonths.length - 1]
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // AVAILABLE MONTHS
  // =========================

  const months = useMemo(() => {
    const monthSet = new Set<string>();

    tasks.forEach((task) => {
      if (task.created_at) {
        monthSet.add(
          monthKey(task.created_at)
        );
      }
    });

    history.forEach((item) => {
      if (item.created_at) {
        monthSet.add(
          monthKey(item.created_at)
        );
      }
    });

    const result = Array.from(monthSet).sort();

    return result.reverse();
  }, [tasks, history]);

  // =========================
  // TASK SNAPSHOT
  // =========================

  function getTaskSnapshot(
    task: Task,
    endDate: string
  ) {
    const taskHistory = history
      .filter(
        (item) =>
          item.task_id === task.id &&
          item.created_at.slice(0, 10) <=
            endDate
      )
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
      );

    if (taskHistory.length === 0) {
      return {
        status: task.status || "Pending",
        completed_quantity:
          Number(
            task.completed_quantity || 0
          ),
      };
    }

    const latest =
      taskHistory[taskHistory.length - 1];

    return {
      status:
        latest.new_status ||
        task.status ||
        "Pending",

      completed_quantity:
        Number(
          latest.completed_quantity ??
            task.completed_quantity ??
            0
        ),
    };
  }

  function snapshotIsCompleted(
    task: Task,
    snapshot: {
      status: string;
      completed_quantity: number;
    }
  ) {
    const status =
      snapshot.status
        .trim()
        .toLowerCase();

    const total = Number(
      task.total_quantity || 0
    );

    return (
      status === "completed" ||
      status === "complete" ||
      (total > 0 &&
        snapshot.completed_quantity >=
          total)
    );
  }

  // =========================
  // MONTH DATA
  // =========================

  const monthData = useMemo(() => {
    if (!selectedMonth) {
      return {
        monthTasks: [],
        completedTasks: [],
        uncompleteTasks: [],
        carryoverTasks: [],
      };
    }

    const monthStart =
      getMonthStart(selectedMonth);

    const monthEnd =
      getMonthEnd(selectedMonth);

    // Tasks existing by month end
    const monthTasks = tasks.filter(
      (task) => {
        if (!task.created_at) {
          return false;
        }

        return (
          task.created_at.slice(0, 10) <=
          monthEnd
        );
      }
    );

    // Completed during selected month
    const completedTasks = monthTasks.filter(
      (task) => {
        const completedHistory =
          history.filter(
            (item) =>
              item.task_id === task.id &&
              item.created_at.slice(0, 7) ===
                selectedMonth &&
              snapshotIsCompleted(task, {
                status:
                  item.new_status,
                completed_quantity:
                  Number(
                    item.completed_quantity ||
                      0
                  ),
              })
          );

        return completedHistory.length > 0;
      }
    );

    // Tasks still incomplete at month end
    const uncompleteTasks =
      monthTasks.filter((task) => {
        const snapshot =
          getTaskSnapshot(
            task,
            monthEnd
          );

        return !snapshotIsCompleted(
          task,
          snapshot
        );
      });

    // Tasks from previous period which
    // were still pending when month started
    const carryoverTasks =
      tasks.filter((task) => {
        if (!task.created_at) {
          return false;
        }

        const createdDate =
          task.created_at.slice(0, 10);

        if (createdDate >= monthStart) {
          return false;
        }

        const beforeMonthEndSnapshot =
          getTaskSnapshot(
            task,
            getPreviousDay(monthStart)
          );

        return !snapshotIsCompleted(
          task,
          beforeMonthEndSnapshot
        );
      });

    return {
      monthTasks,
      completedTasks,
      uncompleteTasks,
      carryoverTasks,
    };
  }, [tasks, history, selectedMonth]);

  // =========================
  // PREVIOUS DAY
  // =========================

  function getPreviousDay(date: string) {
    const d = new Date(date);

    d.setDate(d.getDate() - 1);

    return d
      .toISOString()
      .split("T")[0];
  }

  // =========================
  // SELECTED MONTH SUMMARY
  // =========================

  const summary = useMemo(() => {
    const selectedTasks =
      monthData.monthTasks;

    const totalTasks =
      selectedTasks.length;

    let pending = 0;
    let inProgress = 0;
    let completed = 0;

    let totalQuantity = 0;
    let completedQuantity = 0;

    selectedTasks.forEach((task) => {
      const snapshot =
        getTaskSnapshot(
          task,
          selectedMonth
            ? getMonthEnd(selectedMonth)
            : ""
        );

      totalQuantity += Number(
        task.total_quantity || 0
      );

      completedQuantity +=
        snapshot.completed_quantity;

      if (
        snapshotIsCompleted(
          task,
          snapshot
        )
      ) {
        completed++;
      } else if (
        snapshot.status
          .trim()
          .toLowerCase() ===
        "pending"
      ) {
        pending++;
      } else {
        inProgress++;
      }
    });

    const overdue =
      selectedTasks.filter((task) => {
        const snapshot =
          getTaskSnapshot(
            task,
            getMonthEnd(selectedMonth)
          );

        if (
          snapshotIsCompleted(
            task,
            snapshot
          )
        ) {
          return false;
        }

        return (
          task.deadline &&
          task.deadline <
            getMonthEnd(selectedMonth)
        );
      }).length;

    const progress =
      totalQuantity > 0
        ? Math.min(
            100,
            Math.round(
              (completedQuantity /
                totalQuantity) *
                100
            )
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
  }, [
    monthData.monthTasks,
    selectedMonth,
    history,
  ]);

  // =========================
  // EMPLOYEE-WISE UNCOMPLETE
  // =========================

  const employeePending = useMemo(() => {
    const map: Record<
      string,
      number
    > = {};

    monthData.uncompleteTasks.forEach(
      (task) => {
        const name =
          task.assigned_to ||
          "Unassigned";

        map[name] =
          (map[name] || 0) + 1;
      }
    );

    return Object.entries(map).sort(
      (a, b) => b[1] - a[1]
    );
  }, [monthData.uncompleteTasks]);

  // =========================
  // EMPLOYEE-WISE COMPLETED
  // =========================

  const employeeCompleted = useMemo(() => {
    const map: Record<
      string,
      number
    > = {};

    monthData.completedTasks.forEach(
      (task) => {
        const name =
          task.assigned_to ||
          "Unassigned";

        map[name] =
          (map[name] || 0) + 1;
      }
    );

    return Object.entries(map).sort(
      (a, b) => b[1] - a[1]
    );
  }, [monthData.completedTasks]);

  // =========================
  // REFRESH
  // =========================

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <h1 style={styles.title}>
            OfficeFlow Dashboard
          </h1>

          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}

        <div style={styles.header}>

          <div>
            <h1 style={styles.title}>
              OfficeFlow Dashboard
            </h1>

            <p style={styles.subtitle}>
              Office Task Management Dashboard
            </p>
          </div>

          <button
            onClick={loadData}
            style={styles.refreshButton}
          >
            🔄 Refresh
          </button>

        </div>

        {/* MONTH SELECT */}

        <section style={styles.monthPanel}>

          <div>

            <h2 style={styles.monthTitle}>
              📅 Monthly Task Dashboard
            </h2>

            <p style={styles.monthSubtitle}>
              যে মাস select করবেন সেই মাসের
              Task Report দেখাবে
            </p>

          </div>

          <select
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(
                e.target.value
              )
            }
            style={styles.monthSelect}
          >

            <option value="">
              -- Month Select করুন --
            </option>

            {months.map((month) => (
              <option
                key={month}
                value={month}
              >
                {monthLabel(month)}
              </option>
            ))}

          </select>

        </section>

        {selectedMonth && (
          <div style={styles.selectedMonthBadge}>
            📅 Showing:{" "}
            <strong>
              {monthLabel(selectedMonth)}
            </strong>
          </div>
        )}

        {/* SUMMARY CARDS */}

        <section style={styles.cards}>

          <StatCard
            title="Total Tasks"
            value={summary.totalTasks}
            icon="📋"
          />

          <StatCard
            title="Pending"
            value={summary.pending}
            icon="⏳"
          />

          <StatCard
            title="In Progress"
            value={summary.inProgress}
            icon="⚙️"
          />

          <StatCard
            title="Completed"
            value={summary.completed}
            icon="✅"
          />

          <StatCard
            title="Overdue"
            value={summary.overdue}
            icon="⚠️"
          />

          <StatCard
            title="Total Quantity"
            value={summary.totalQuantity}
            icon="📦"
          />

          <StatCard
            title="Completed Quantity"
            value={summary.completedQuantity}
            icon="🎯"
          />

          <StatCard
            title="Progress"
            value={`${summary.progress}%`}
            icon="📊"
          />

        </section>

        {/* =========================
            COMPLETED TASKS
        ========================= */}

        <section style={styles.panel}>

          <div style={styles.sectionHeader}>

            <div>
              <h2 style={styles.sectionTitle}>
                ✅ {monthLabel(
                  selectedMonth
                )} — Completed Tasks
              </h2>

              <p style={styles.sectionSubtitle}>
                এই মাসে Complete হওয়া কাজ
              </p>
            </div>

            <span
              style={styles.completedBadge}
            >
              {monthData.completedTasks.length}
            </span>

          </div>

          {monthData.completedTasks.length ===
          0 ? (

            <div style={styles.empty}>
              এই মাসে কোনো Task Complete হয়নি।
            </div>

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
                      Quantity
                    </th>

                    <th style={styles.th}>
                      Deadline
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {monthData.completedTasks.map(
                    (task) => (

                      <tr key={task.id}>

                        <td style={styles.td}>
                          <strong>
                            {task.task_name}
                          </strong>
                        </td>

                        <td style={styles.td}>
                          {task.assigned_to ||
                            "Unassigned"}
                        </td>

                        <td style={styles.td}>
                          {Number(
                            task.completed_quantity ||
                              0
                          )}{" "}
                          /{" "}
                          {Number(
                            task.total_quantity ||
                              0
                          )}
                        </td>

                        <td style={styles.td}>
                          {task.deadline ||
                            "-"}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* =========================
            UNCOMPLETE TASKS
        ========================= */}

        <section style={styles.panel}>

          <div style={styles.sectionHeader}>

            <div>
              <h2 style={styles.sectionTitle}>
                🟠 {monthLabel(
                  selectedMonth
                )} — Uncomplete Tasks
              </h2>

              <p style={styles.sectionSubtitle}>
                মাস শেষ হওয়ার সময় যেসব কাজ
                Complete হয়নি
              </p>
            </div>

            <span
              style={styles.pendingBadge}
            >
              {monthData.uncompleteTasks.length}
            </span>

          </div>

          {monthData.uncompleteTasks.length ===
          0 ? (

            <div style={styles.successBox}>
              🎉 এই মাসে কোনো Uncomplete Task নেই।
            </div>

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
                      Deadline
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {monthData.uncompleteTasks.map(
                    (task) => {

                      const snapshot =
                        getTaskSnapshot(
                          task,
                          getMonthEnd(
                            selectedMonth
                          )
                        );

                      return (
                        <tr key={task.id}>

                          <td style={styles.td}>
                            <strong>
                              {task.task_name}
                            </strong>
                          </td>

                          <td style={styles.td}>
                            {task.assigned_to ||
                              "Unassigned"}
                          </td>

                          <td style={styles.td}>

                            <span
                              style={
                                styles.statusBadge
                              }
                            >
                              {snapshot.status ||
                                "Pending"}
                            </span>

                          </td>

                          <td style={styles.td}>
                            {task.deadline ||
                              "-"}
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

        {/* =========================
            CARRYOVER
        ========================= */}

        <section style={styles.carryoverPanel}>

          <div style={styles.sectionHeader}>

            <div>

              <h2 style={styles.sectionTitle}>
                🔴 Previous Month Carryover
              </h2>

              <p style={styles.sectionSubtitle}>
                {monthLabel(
                  selectedMonth
                )} শুরু হওয়ার আগেই যেসব কাজ
                Pending ছিল
              </p>

            </div>

            <span
              style={styles.carryoverBadge}
            >
              {monthData.carryoverTasks.length}
            </span>

          </div>

          {monthData.carryoverTasks.length ===
          0 ? (

            <div style={styles.successBox}>
              ✅ আগের মাস থেকে কোনো Pending
              Task Carryover হয়নি।
            </div>

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
                      Deadline
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {monthData.carryoverTasks.map(
                    (task) => (

                      <tr key={task.id}>

                        <td style={styles.td}>
                          <strong>
                            {task.task_name}
                          </strong>
                        </td>

                        <td style={styles.td}>
                          {task.assigned_to ||
                            "Unassigned"}
                        </td>

                        <td style={styles.td}>
                          {task.deadline ||
                            "-"}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* =========================
            EMPLOYEE PENDING
        ========================= */}

        <section style={styles.panel}>

          <h2 style={styles.sectionTitle}>
            👥 Employee-wise Uncomplete Task
          </h2>

          <p style={styles.sectionSubtitle}>
            {monthLabel(
              selectedMonth
            )} অনুযায়ী Employee-এর বাকি কাজ
          </p>

          {employeePending.length ===
          0 ? (

            <div style={styles.successBox}>
              🎉 কোনো Uncomplete Task নেই।
            </div>

          ) : (

            employeePending.map(
              ([employee, count]) => (

                <div
                  key={employee}
                  style={styles.employeeRow}
                >

                  <strong>
                    {employee}
                  </strong>

                  <span
                    style={
                      styles.employeePending
                    }
                  >
                    {count} Task বাকি
                  </span>

                </div>

              )
            )

          )}

        </section>

        {/* =========================
            EMPLOYEE COMPLETED
        ========================= */}

        <section style={styles.panel}>

          <h2 style={styles.sectionTitle}>
            ✅ Employee-wise Completed Task
          </h2>

          <p style={styles.sectionSubtitle}>
            {monthLabel(
              selectedMonth
            )} অনুযায়ী Employee-এর Complete
            কাজ
          </p>

          {employeeCompleted.length ===
          0 ? (

            <div style={styles.empty}>
              এই মাসে কোনো Completed Task নেই।
            </div>

          ) : (

            employeeCompleted.map(
              ([employee, count]) => (

                <div
                  key={employee}
                  style={styles.employeeRow}
                >

                  <strong>
                    {employee}
                  </strong>

                  <span
                    style={
                      styles.employeeCompleted
                    }
                  >
                    {count} Task Complete
                  </span>

                </div>

              )
            )

          )}

        </section>

        {/* =========================
            STATUS REPORT
        ========================= */}

        <section style={styles.panel}>

          <h2 style={styles.sectionTitle}>
            📊 {monthLabel(
              selectedMonth
            )} Status Report
          </h2>

          <ReportRow
            label="⏳ Pending"
            value={summary.pending}
            total={summary.totalTasks}
          />

          <ReportRow
            label="⚙️ In Progress"
            value={summary.inProgress}
            total={summary.totalTasks}
          />

          <ReportRow
            label="✅ Completed"
            value={summary.completed}
            total={summary.totalTasks}
          />

          <ReportRow
            label="⚠️ Overdue"
            value={summary.overdue}
            total={summary.totalTasks}
          />

        </section>

        {/* =========================
            QUANTITY PROGRESS
        ========================= */}

        <section style={styles.panel}>

          <div
            style={styles.sectionHeader}
          >

            <h2 style={styles.sectionTitle}>
              📦 Quantity Progress
            </h2>

            <strong>
              {summary.progress}%
            </strong>

          </div>

          <div
            style={
              styles.progressBackground
            }
          >

            <div
              style={{
                ...styles.progressBar,
                width: `${summary.progress}%`,
              }}
            />

          </div>

          <p style={styles.smallText}>
            Completed{" "}
            {summary.completedQuantity} /{" "}
            {summary.totalQuantity} quantity
          </p>

        </section>

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
  value: number | string;
  icon: string;
}) {
  return (
    <div style={styles.card}>

      <div style={styles.icon}>
        {icon}
      </div>

      <div>

        <div style={styles.cardLabel}>
          {title}
        </div>

        <div style={styles.cardNumber}>
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
    <div style={styles.reportRow}>

      <div
        style={styles.reportHeader}
      >

        <strong>
          {label}
        </strong>

        <span>
          {value} ({percent}%)
        </span>

      </div>

      <div
        style={
          styles.reportBackground
        }
      >

        <div
          style={{
            ...styles.reportBar,
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

const styles: Record<
  string,
  React.CSSProperties
> = {

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
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 800,
  },

  subtitle: {
    marginTop: "6px",
    color: "#667085",
  },

  refreshButton: {
    border: "none",
    background: "#111827",
    color: "#fff",
    padding: "11px 18px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: 600,
  },

  monthPanel: {
    background: "#fff",
    padding: "20px",
    borderRadius: "14px",
    marginBottom: "12px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.05)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },

  monthTitle: {
    margin: 0,
    fontSize: "21px",
  },

  monthSubtitle: {
    margin: "5px 0 0",
    color: "#667085",
    fontSize: "13px",
  },

  monthSelect: {
    minWidth: "220px",
    padding: "12px",
    border:
      "1px solid #d0d5dd",
    borderRadius: "9px",
    background: "#fff",
    fontSize: "14px",
    fontWeight: 600,
  },

  selectedMonthBadge: {
    background: "#eef2ff",
    color: "#3730a3",
    padding: "10px 15px",
    borderRadius: "9px",
    marginBottom: "20px",
    display: "inline-block",
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
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.05)",
  },

  icon: {
    fontSize: "30px",
  },

  cardLabel: {
    color: "#667085",
    fontSize: "13px",
  },

  cardNumber: {
    fontSize: "26px",
    fontWeight: 800,
    marginTop: "4px",
  },

  panel: {
    background: "#fff",
    padding: "22px",
    borderRadius: "14px",
    marginBottom: "25px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.05)",
  },

  carryoverPanel: {
    background: "#fff7ed",
    padding: "22px",
    borderRadius: "14px",
    marginBottom: "25px",
    border: "1px solid #fed7aa",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "15px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 800,
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    color: "#667085",
    fontSize: "13px",
  },

  completedBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "7px 13px",
    borderRadius: "20px",
    fontWeight: 700,
  },

  pendingBadge: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "7px 13px",
    borderRadius: "20px",
    fontWeight: 700,
  },

  carryoverBadge: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "7px 13px",
    borderRadius: "20px",
    fontWeight: 700,
  },

  successBox: {
    background: "#ecfdf3",
    color: "#166534",
    padding: "15px",
    borderRadius: "9px",
    fontWeight: 600,
  },

  empty: {
    color: "#667085",
    textAlign: "center",
    padding: "25px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f9fafb",
    borderBottom:
      "1px solid #e5e7eb",
    fontSize: "13px",
    color: "#475467",
  },

  td: {
    padding: "13px 12px",
    borderBottom:
      "1px solid #eee",
    fontSize: "14px",
  },

  statusBadge: {
    display: "inline-block",
    background: "#fef3c7",
    color: "#92400e",
    padding: "5px 10px",
    borderRadius: "15px",
    fontSize: "12px",
    fontWeight: 700,
  },

  employeeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "13px 0",
    borderBottom:
      "1px solid #eee",
  },

  employeePending: {
    background: "#fff7ed",
    color: "#c2410c",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 700,
  },

  employeeCompleted: {
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: 700,
  },

  reportRow: {
    marginBottom: "17px",
  },

  reportHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "7px",
    fontSize: "14px",
  },

  reportBackground: {
    width: "100%",
    height: "10px",
    background: "#eaecf0",
    borderRadius: "20px",
    overflow: "hidden",
  },

  reportBar: {
    height: "100%",
    background: "#2563eb",
    borderRadius: "20px",
  },

  progressBackground: {
    width: "100%",
    height: "16px",
    background: "#eaecf0",
    borderRadius: "20px",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    background: "#16a34a",
    borderRadius: "20px",
    transition:
      "width 0.3s ease",
  },

  smallText: {
    color: "#667085",
    fontSize: "13px",
    marginTop: "10px",
  },
};

"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();

type Employee = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  task_name: string;
  description: string | null;
  assigned_to: string | null;
  priority: string;
  status: string;
  start_date: string | null;
  deadline: string | null;
  total_quantity: number;
  completed_quantity: number;
  notes: string | null;
  created_at?: string;
};

type TaskUpdate = {
  id: string;
  previous_status: string | null;
  new_status: string;
  completed_quantity: number;
  note: string | null;
  created_at: string;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [historyTask, setHistoryTask] = useState<Task | null>(null);
  const [history, setHistory] = useState<TaskUpdate[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [form, setForm] = useState({
    task_name: "",
    description: "",
    assigned_to: "",
    priority: "medium",
    status: "Pending",
    start_date: "",
    deadline: "",
    total_quantity: "",
    completed_quantity: "0",
    notes: "",
  });

  // =========================
  // LOAD DATA
  // =========================

  async function loadData() {
    setRefreshing(true);

    const { data, error } = await supabase
      .from("office_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Task Load Error: " + error.message);
      setRefreshing(false);
      return;
    }

    const { data: emp, error: empError } = await supabase
      .from("employees")
      .select("id,name")
      .eq("active", true)
      .order("name");

    if (empError) {
      alert("Employee Load Error: " + empError.message);
      setRefreshing(false);
      return;
    }

    setTasks(data || []);
    setEmployees(emp || []);

    setRefreshing(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // =========================
  // STATUS HELPERS
  // =========================

  function normalizedStatus(task: Task) {
    return (task.status || "Pending").trim().toLowerCase();
  }

  function isCompleted(task: Task) {
    const status = normalizedStatus(task);

    const total = Number(task.total_quantity || 0);
    const completed = Number(task.completed_quantity || 0);

    return (
      status === "completed" ||
      status === "complete" ||
      (total > 0 && completed >= total)
    );
  }

  function isUncomplete(task: Task) {
    return !isCompleted(task);
  }

  // =========================
  // SEARCH
  // =========================

  function matchesSearch(task: Task) {
    const q = search.trim().toLowerCase();

    if (!q) return true;

    return (
      task.task_name?.toLowerCase().includes(q) ||
      task.assigned_to?.toLowerCase().includes(q) ||
      task.status?.toLowerCase().includes(q) ||
      task.priority?.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q)
    );
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter(matchesSearch);
  }, [tasks, search]);

  const uncompleteTasks = useMemo(() => {
    return filteredTasks.filter(isUncomplete);
  }, [filteredTasks]);

  const completedTasks = useMemo(() => {
    return filteredTasks.filter(isCompleted);
  }, [filteredTasks]);

  // =========================
  // FORM
  // =========================

  function resetForm() {
    setForm({
      task_name: "",
      description: "",
      assigned_to: "",
      priority: "medium",
      status: "Pending",
      start_date: "",
      deadline: "",
      total_quantity: "",
      completed_quantity: "0",
      notes: "",
    });
  }

  function openAddForm() {
    setEditingTask(null);
    resetForm();
    setShowForm(true);
  }

  function openEditForm(task: Task) {
    setEditingTask(task);

    setForm({
      task_name: task.task_name || "",
      description: task.description || "",
      assigned_to: task.assigned_to || "",
      priority: task.priority || "medium",
      status: task.status || "Pending",
      start_date: task.start_date || "",
      deadline: task.deadline || "",
      total_quantity: String(task.total_quantity ?? 0),
      completed_quantity: String(task.completed_quantity ?? 0),
      notes: task.notes || "",
    });

    setShowForm(true);
  }

  // =========================
  // SAVE TASK
  // =========================

  async function saveTask(e: React.FormEvent) {
    e.preventDefault();

    if (!form.task_name.trim()) {
      alert("Task Name দিন");
      return;
    }

    setLoading(true);

    const taskData = {
      task_name: form.task_name.trim(),
      description: form.description.trim(),
      assigned_to: form.assigned_to,
      priority: form.priority,
      status: form.status.trim() || "Pending",
      start_date: form.start_date || null,
      deadline: form.deadline || null,
      total_quantity: Number(form.total_quantity) || 0,
      completed_quantity: Number(form.completed_quantity) || 0,
      notes: form.notes.trim(),
    };

    let error;

    if (editingTask) {
      const result = await supabase
        .from("office_tasks")
        .update(taskData)
        .eq("id", editingTask.id);

      error = result.error;

      if (!error) {
        const { error: historyError } = await supabase.rpc(
          "add_office_task_history",
          {
            p_task_id: editingTask.id,
            p_previous_status: editingTask.status,
            p_new_status: taskData.status,
            p_completed_quantity: taskData.completed_quantity,
            p_note: "Task edited",
          }
        );

        if (historyError) {
          alert(
            "Task updated, but History save হয়নি: " +
              historyError.message
          );
        }
      }
    } else {
      const result = await supabase
        .from("office_tasks")
        .insert([taskData]);

      error = result.error;
    }

    setLoading(false);

    if (error) {
      alert("Error: " + error.message);
      return;
    }

    alert(
      editingTask
        ? "Task Updated Successfully! ✅"
        : "Task Added Successfully! ✅"
    );

    setShowForm(false);
    setEditingTask(null);
    resetForm();

    await loadData();
  }

  // =========================
  // QUICK STATUS UPDATE
  // =========================

  async function updateTaskStatus(task: Task) {
    const newStatus = prompt(
      "নতুন Status লিখুন:",
      task.status || "Pending"
    );

    if (!newStatus || !newStatus.trim()) return;

    const qty = prompt(
      "Completed Quantity:",
      String(task.completed_quantity || 0)
    );

    if (qty === null) return;

    const newQty = Number(qty);

    if (Number.isNaN(newQty) || newQty < 0) {
      alert("সঠিক Completed Quantity দিন।");
      return;
    }

    const finalQty = newQty;

    const { error } = await supabase
      .from("office_tasks")
      .update({
        status: newStatus.trim(),
        completed_quantity: finalQty,
      })
      .eq("id", task.id);

    if (error) {
      alert("Update Error: " + error.message);
      return;
    }

    const { error: historyError } = await supabase.rpc(
      "add_office_task_history",
      {
        p_task_id: task.id,
        p_previous_status: task.status,
        p_new_status: newStatus.trim(),
        p_completed_quantity: finalQty,
        p_note: "Quick status update",
      }
    );

    if (historyError) {
      alert(
        "Status updated, but History save হয়নি: " +
          historyError.message
      );
    } else {
      alert("Status Updated! ✅");
    }

    await loadData();
  }

  // =========================
  // HISTORY
  // =========================

  async function showHistory(task: Task) {
    setHistoryTask(task);
    setHistory([]);
    setHistoryLoading(true);

    const { data, error } = await supabase
      .from("office_task_updates")
      .select(
        "id, previous_status, new_status, completed_quantity, note, created_at"
      )
      .eq("task_id", task.id)
      .order("created_at", { ascending: false });

    setHistoryLoading(false);

    if (error) {
      alert("History Error: " + error.message);
      return;
    }

    setHistory(data || []);
  }

  // =========================
  // DELETE
  // =========================

  async function deleteTask(id: string) {
    if (!confirm("এই Task টি Delete করতে চান?")) return;

    const { data, error } = await supabase.rpc(
      "delete_office_task",
      {
        task_id: id,
      }
    );

    if (error) {
      alert("Delete Error: " + error.message);
      return;
    }

    if (!data) {
      alert("Task Delete হয়নি।");
      return;
    }

    alert("Task Deleted! 🗑️");

    await loadData();
  }

  // =========================
  // TASK CARD
  // =========================

  function TaskTable({
    taskList,
    emptyText,
  }: {
    taskList: Task[];
    emptyText: string;
  }) {
    if (taskList.length === 0) {
      return (
        <div style={emptyBoxStyle}>
          {emptyText}
        </div>
      );
    }

    return (
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Task</th>
              <th style={thStyle}>Assigned To</th>
              <th style={thStyle}>Priority</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Quantity</th>
              <th style={thStyle}>Deadline</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>

          <tbody>
            {taskList.map((task) => {
              const completed = isCompleted(task);

              return (
                <tr
                  key={task.id}
                  style={
                    completed
                      ? completedRowStyle
                      : uncompleteRowStyle
                  }
                >
                  <td style={tdStyle}>
                    <strong>{task.task_name}</strong>

                    {task.description && (
                      <div style={descriptionStyle}>
                        {task.description}
                      </div>
                    )}

                    {task.notes && (
                      <div style={notesStyle}>
                        📝 {task.notes}
                      </div>
                    )}
                  </td>

                  <td style={tdStyle}>
                    {task.assigned_to || "-"}
                  </td>

                  <td style={tdStyle}>
                    <span
                      style={{
                        ...priorityBadgeStyle,
                        ...(task.priority === "urgent"
                          ? urgentBadgeStyle
                          : task.priority === "high"
                          ? highBadgeStyle
                          : {}),
                      }}
                    >
                      {task.priority}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    <span
                      style={{
                        ...statusBadgeStyle,
                        ...(completed
                          ? completedBadgeStyle
                          : {}),
                      }}
                    >
                      {task.status || "Pending"}
                    </span>
                  </td>

                  <td style={tdStyle}>
                    <strong>
                      {task.completed_quantity || 0}
                    </strong>
                    {" / "}
                    {task.total_quantity || 0}
                  </td>

                  <td style={tdStyle}>
                    {task.deadline || "-"}
                  </td>

                  <td style={tdStyle}>
                    <div style={actionWrapStyle}>
                      <button
                        onClick={() =>
                          updateTaskStatus(task)
                        }
                        style={updateButtonStyle}
                      >
                        🔄 Update
                      </button>

                      <button
                        onClick={() =>
                          showHistory(task)
                        }
                        style={historyButtonStyle}
                      >
                        📜 History
                      </button>

                      <button
                        onClick={() =>
                          openEditForm(task)
                        }
                        style={editButtonStyle}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteTask(task.id)
                        }
                        style={deleteButtonStyle}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <main style={pageStyle}>
      {/* =========================
          HEADER
      ========================= */}

      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Office Tasks</h1>

          <p style={subtitleStyle}>
            Manage all office work
          </p>
        </div>

        <div style={headerButtonsStyle}>
          <button
            onClick={() => loadData()}
            disabled={refreshing}
            style={refreshButtonStyle}
          >
            {refreshing ? "Refreshing..." : "🔄 Refresh"}
          </button>

          <button
            onClick={openAddForm}
            style={buttonStyle}
          >
            + Add Task
          </button>
        </div>
      </div>

      {/* =========================
          SEARCH
      ========================= */}

      <div style={searchBoxStyle}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Task, Employee, Status দিয়ে Search করুন..."
          style={searchInputStyle}
        />

        {search && (
          <button
            onClick={() => setSearch("")}
            style={clearSearchStyle}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* =========================
          SUMMARY
      ========================= */}

      <div style={summaryGridStyle}>
        <div style={summaryCardStyle}>
          <div style={summaryNumberStyle}>
            {uncompleteTasks.length}
          </div>

          <div style={summaryLabelStyle}>
            🔴 Uncomplete / In Process
          </div>
        </div>

        <div style={completedSummaryCardStyle}>
          <div style={summaryNumberStyle}>
            {completedTasks.length}
          </div>

          <div style={summaryLabelStyle}>
            🟢 Completed
          </div>
        </div>

        <div style={totalSummaryCardStyle}>
          <div style={summaryNumberStyle}>
            {filteredTasks.length}
          </div>

          <div style={summaryLabelStyle}>
            📋 Total Tasks
          </div>
        </div>
      </div>

      {/* =========================
          ADD / EDIT FORM
      ========================= */}

      {showForm && (
        <form
          onSubmit={saveTask}
          style={formStyle}
        >
          <div style={formHeader}>
            <h2 style={{ margin: 0 }}>
              {editingTask
                ? "Edit Task"
                : "Add New Office Task"}
            </h2>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingTask(null);
                resetForm();
              }}
              style={closeButtonStyle}
            >
              ✕
            </button>
          </div>

          <label style={labelStyle}>
            Task Name *
          </label>

          <input
            value={form.task_name}
            placeholder="যেমন: Cutting Order #101"
            onChange={(e) =>
              setForm({
                ...form,
                task_name: e.target.value,
              })
            }
            style={inputStyle}
          />

          <label style={labelStyle}>
            Description
          </label>

          <textarea
            value={form.description}
            placeholder="কাজের বিস্তারিত"
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
            style={textareaStyle}
          />

          <label style={labelStyle}>
            Assigned To
          </label>

          <select
            value={form.assigned_to}
            onChange={(e) =>
              setForm({
                ...form,
                assigned_to: e.target.value,
              })
            }
            style={inputStyle}
          >
            <option value="">
              -- Employee Select করুন --
            </option>

            {employees.map((employee) => (
              <option
                key={employee.id}
                value={employee.name}
              >
                {employee.name}
              </option>
            ))}
          </select>

          <label style={labelStyle}>
            Priority
          </label>

          <select
            value={form.priority}
            onChange={(e) =>
              setForm({
                ...form,
                priority: e.target.value,
              })
            }
            style={inputStyle}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <label style={labelStyle}>
            Current Status
          </label>

          <input
            value={form.status}
            placeholder="যেমন: Cutting চলছে"
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value,
              })
            }
            style={inputStyle}
          />

          <div style={twoColumnStyle}>
            <div>
              <label style={labelStyle}>
                Start Date
              </label>

              <input
                type="date"
                value={form.start_date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    start_date: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Deadline
              </label>

              <input
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm({
                    ...form,
                    deadline: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </div>
          </div>

          <div style={twoColumnStyle}>
            <div>
              <label style={labelStyle}>
                Total Quantity
              </label>

              <input
                type="number"
                min="0"
                value={form.total_quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    total_quantity: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Completed Quantity
              </label>

              <input
                type="number"
                min="0"
                value={form.completed_quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    completed_quantity:
                      e.target.value,
                  })
                }
                style={inputStyle}
              />
            </div>
          </div>

          <label style={labelStyle}>
            Notes
          </label>

          <textarea
            value={form.notes}
            placeholder="অতিরিক্ত তথ্য"
            onChange={(e) =>
              setForm({
                ...form,
                notes: e.target.value,
              })
            }
            style={textareaStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={saveButtonStyle}
          >
            {loading
              ? "Saving..."
              : editingTask
              ? "✓ Update Task"
              : "✓ Save Task"}
          </button>
        </form>
      )}

      {/* ==================================================
          🔴 UNCOMPLETE / IN PROCESS — TOP
      ================================================== */}

      <section style={sectionStyle}>
        <div style={uncompleteSectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>
              🔴 Uncomplete / In Process Tasks
            </h2>

            <p style={sectionSubtitleStyle}>
              Pending এবং চলমান সব কাজ এখানে থাকবে
            </p>
          </div>

          <div style={countBadgeRedStyle}>
            {uncompleteTasks.length}
          </div>
        </div>

        <TaskTable
          taskList={uncompleteTasks}
          emptyText={
            search
              ? "এই Search অনুযায়ী কোনো Pending / In Process Task পাওয়া যায়নি।"
              : "🎉 কোনো Pending বা In Process Task নেই।"
          }
        />
      </section>

      {/* ==================================================
          🟢 COMPLETED — BOTTOM
      ================================================== */}

      <section style={sectionStyle}>
        <div style={completedSectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>
              🟢 Completed Tasks
            </h2>

            <p style={sectionSubtitleStyle}>
              সম্পূর্ণ হয়ে যাওয়া সব কাজ এখানে থাকবে
            </p>
          </div>

          <div style={countBadgeGreenStyle}>
            {completedTasks.length}
          </div>
        </div>

        <TaskTable
          taskList={completedTasks}
          emptyText={
            search
              ? "এই Search অনুযায়ী কোনো Completed Task পাওয়া যায়নি।"
              : "এখনো কোনো Completed Task নেই।"
          }
        />
      </section>

      {/* =========================
          HISTORY POPUP
      ========================= */}

      {historyTask && (
        <div style={overlayStyle}>
          <div style={historyModalStyle}>
            <div style={historyHeaderStyle}>
              <div>
                <h2 style={{ margin: 0 }}>
                  📜 Update History
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#666",
                  }}
                >
                  {historyTask.task_name}
                </p>
              </div>

              <button
                onClick={() =>
                  setHistoryTask(null)
                }
                style={closeButtonStyle}
              >
                ✕
              </button>
            </div>

            {historyLoading ? (
              <div style={historyEmptyStyle}>
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div style={historyEmptyStyle}>
                এই Task-এর কোনো update history নেই।
              </div>
            ) : (
              <div>
                {history.map((item) => (
                  <div
                    key={item.id}
                    style={historyItemStyle}
                  >
                    <div
                      style={{
                        fontWeight: "700",
                        marginBottom: "7px",
                      }}
                    >
                      {item.previous_status || "New"}
                      {" → "}
                      {item.new_status}
                    </div>

                    <div
                      style={{
                        fontSize: "14px",
                        color: "#555",
                      }}
                    >
                      📦 Completed Quantity:{" "}
                      <strong>
                        {item.completed_quantity}
                      </strong>
                    </div>

                    {item.note && (
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#555",
                          marginTop: "5px",
                        }}
                      >
                        📝 {item.note}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: "12px",
                        color: "#888",
                        marginTop: "7px",
                      }}
                    >
                      🕒{" "}
                      {new Date(
                        item.created_at
                      ).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

/* =====================================================
   STYLES
===================================================== */

const pageStyle = {
  padding: "30px",
  maxWidth: "1500px",
  margin: "0 auto",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  gap: "15px",
  flexWrap: "wrap" as const,
};

const headerButtonsStyle = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
};

const titleStyle = {
  fontSize: "30px",
  fontWeight: "700",
  margin: 0,
};

const subtitleStyle = {
  color: "#666",
  marginTop: "5px",
};

const buttonStyle = {
  background: "#111",
  color: "#fff",
  padding: "12px 20px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const refreshButtonStyle = {
  background: "#f1f5f9",
  color: "#111",
  padding: "12px 18px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const searchBoxStyle = {
  display: "flex",
  gap: "10px",
  marginBottom: "20px",
  background: "#fff",
  padding: "15px",
  borderRadius: "12px",
  border: "1px solid #ddd",
};

const searchInputStyle = {
  flex: 1,
  padding: "12px 14px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontSize: "15px",
  boxSizing: "border-box" as const,
};

const clearSearchStyle = {
  background: "#eee",
  border: "none",
  borderRadius: "8px",
  padding: "0 15px",
  cursor: "pointer",
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "15px",
  marginBottom: "25px",
};

const summaryCardStyle = {
  background: "#fff1f2",
  border: "1px solid #fecdd3",
  borderRadius: "12px",
  padding: "20px",
};

const completedSummaryCardStyle = {
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: "12px",
  padding: "20px",
};

const totalSummaryCardStyle = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "12px",
  padding: "20px",
};

const summaryNumberStyle = {
  fontSize: "30px",
  fontWeight: "800",
};

const summaryLabelStyle = {
  marginTop: "5px",
  fontSize: "14px",
  color: "#555",
};

const formStyle = {
  background: "#fff",
  padding: "25px",
  borderRadius: "12px",
  marginBottom: "25px",
  border: "1px solid #ddd",
  maxWidth: "850px",
};

const formHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const closeButtonStyle = {
  background: "#eee",
  border: "none",
  borderRadius: "6px",
  padding: "7px 10px",
  cursor: "pointer",
};

const labelStyle = {
  display: "block",
  fontSize: "14px",
  fontWeight: "600",
  marginBottom: "6px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "15px",
  border: "1px solid #ccc",
  borderRadius: "7px",
  boxSizing: "border-box" as const,
};

const textareaStyle = {
  ...inputStyle,
  minHeight: "90px",
  resize: "vertical" as const,
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "15px",
};

const saveButtonStyle = {
  background: "#111",
  color: "#fff",
  padding: "13px 25px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const sectionStyle = {
  marginBottom: "35px",
};

const uncompleteSectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#fff1f2",
  border: "1px solid #fecdd3",
  padding: "18px 20px",
  borderRadius: "12px 12px 0 0",
};

const completedSectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  padding: "18px 20px",
  borderRadius: "12px 12px 0 0",
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: "21px",
  fontWeight: "700",
};

const sectionSubtitleStyle = {
  margin: "5px 0 0",
  color: "#666",
  fontSize: "13px",
};

const countBadgeRedStyle = {
  background: "#dc2626",
  color: "#fff",
  minWidth: "42px",
  height: "42px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
};

const countBadgeGreenStyle = {
  background: "#16a34a",
  color: "#fff",
  minWidth: "42px",
  height: "42px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
};

const tableWrapperStyle = {
  background: "#fff",
  borderRadius: "0 0 12px 12px",
  overflow: "auto" as const,
  border: "1px solid #ddd",
  borderTop: "none",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  minWidth: "1250px",
};

const thStyle = {
  padding: "14px",
  textAlign: "left" as const,
  borderBottom: "1px solid #ddd",
  background: "#f8fafc",
  fontWeight: "700",
};

const tdStyle = {
  padding: "14px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top" as const,
};

const uncompleteRowStyle = {
  background: "#fff",
};

const completedRowStyle = {
  background: "#fafffb",
};

const descriptionStyle = {
  color: "#777",
  fontSize: "13px",
  marginTop: "4px",
};

const notesStyle = {
  color: "#777",
  fontSize: "12px",
  marginTop: "5px",
};

const statusBadgeStyle = {
  display: "inline-block",
  background: "#fff7ed",
  color: "#c2410c",
  padding: "5px 9px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: "700",
};

const completedBadgeStyle = {
  background: "#dcfce7",
  color: "#15803d",
};

const priorityBadgeStyle = {
  display: "inline-block",
  background: "#f1f5f9",
  color: "#475569",
  padding: "5px 9px",
  borderRadius: "6px",
  fontSize: "12px",
  fontWeight: "700",
};

const urgentBadgeStyle = {
  background: "#fee2e2",
  color: "#b91c1c",
};

const highBadgeStyle = {
  background: "#ffedd5",
  color: "#c2410c",
};

const actionWrapStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "5px",
};

const updateButtonStyle = {
  background: "#e0f2fe",
  border: "none",
  padding: "7px 10px",
  borderRadius: "6px",
  cursor: "pointer",
};

const historyButtonStyle = {
  background: "#ede9fe",
  border: "none",
  padding: "7px 10px",
  borderRadius: "6px",
  cursor: "pointer",
};

const editButtonStyle = {
  background: "#eee",
  border: "none",
  padding: "7px 10px",
  borderRadius: "6px",
  cursor: "pointer",
};

const deleteButtonStyle = {
  background: "#fee2e2",
  border: "none",
  padding: "7px 10px",
  borderRadius: "6px",
  cursor: "pointer",
};

const emptyBoxStyle = {
  background: "#fff",
  border: "1px solid #ddd",
  borderTop: "none",
  borderRadius: "0 0 12px 12px",
  padding: "40px",
  textAlign: "center" as const,
  color: "#777",
};

const overlayStyle = {
  position: "fixed" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "20px",
  zIndex: 9999,
};

const historyModalStyle = {
  background: "#fff",
  width: "100%",
  maxWidth: "650px",
  maxHeight: "80vh",
  overflowY: "auto" as const,
  borderRadius: "14px",
  padding: "25px",
  boxSizing: "border-box" as const,
};

const historyHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const historyItemStyle = {
  border: "1px solid #ddd",
  borderRadius: "10px",
  padding: "15px",
  marginBottom: "10px",
  background: "#fafafa",
};

const historyEmptyStyle = {
  padding: "40px 10px",
  textAlign: "center" as const,
  color: "#777",
};

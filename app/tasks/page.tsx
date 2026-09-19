"use client";

import { useEffect, useState } from "react";
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

  async function loadData() {
    const { data, error } = await supabase
      .from("office_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    const { data: emp, error: empError } = await supabase
      .from("employees")
      .select("id,name")
      .eq("active", true)
      .order("name");

    if (empError) {
      alert(empError.message);
      return;
    }

    setTasks(data || []);
    setEmployees(emp || []);
  }

  useEffect(() => {
    loadData();
  }, []);

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
        const { error: historyError } = await supabase
          .from("office_task_updates")
          .insert({
            task_id: editingTask.id,
            previous_status: editingTask.status,
            new_status: taskData.status,
            completed_quantity: taskData.completed_quantity,
            note: "Task edited",
          });

        if (historyError) {
          alert("Task updated, but History save হয়নি: " + historyError.message);
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
    loadData();
  }

  async function updateTaskStatus(task: Task) {
    const newStatus = prompt("নতুন Status লিখুন:", task.status);

    if (!newStatus || !newStatus.trim()) return;

    const qty = prompt(
      "Completed Quantity:",
      String(task.completed_quantity || 0)
    );

    const newQty = Number(qty);

    const finalQty = Number.isNaN(newQty)
      ? 0
      : newQty;

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

    const { error: historyError } = await supabase
      .from("office_task_updates")
      .insert({
        task_id: task.id,
        previous_status: task.status,
        new_status: newStatus.trim(),
        completed_quantity: finalQty,
        note: "Quick status update",
      });

    if (historyError) {
      alert(
        "Status updated, but History save হয়নি: " +
          historyError.message
      );
    } else {
      alert("Status Updated! ✅");
    }

    loadData();
  }

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

async function deleteTask(id: string) {
  if (!confirm("এই Task টি Delete করতে চান?")) return;

  const { data, error } = await supabase
    .from("office_tasks")
    .delete()
    .eq("id", id)
    .select();

  if (error) {
    alert("Delete Error: " + error.message);
    return;
  }

  if (!data || data.length === 0) {
    alert("Task Delete হয়নি। Database থেকে কোনো row delete হয়নি।");
    return;
  }

  // Tasks page থেকে remove
  setTasks((prev) => prev.filter((task) => task.id !== id));

  // History popup খোলা থাকলে বন্ধ
  if (historyTask?.id === id) {
    setHistoryTask(null);
    setHistory([]);
  }

  alert("Task Deleted! 🗑️");
  }


  return (
    <main style={pageStyle}>

      {/* HEADER */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Office Tasks</h1>

          <p style={subtitleStyle}>
            Manage all office work
          </p>
        </div>

        <button
          onClick={openAddForm}
          style={buttonStyle}
        >
          + Add Task
        </button>
      </div>

      {/* FORM */}
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
            <option value="low">
              Low
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="high">
              High
            </option>

            <option value="urgent">
              Urgent
            </option>
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

      {/* TASK TABLE */}
      <div style={tableWrapperStyle}>
        <table style={tableStyle}>

          <thead>
            <tr>
              <th style={thStyle}>
                Task
              </th>

              <th style={thStyle}>
                Assigned To
              </th>

              <th style={thStyle}>
                Priority
              </th>

              <th style={thStyle}>
                Status
              </th>

              <th style={thStyle}>
                Quantity
              </th>

              <th style={thStyle}>
                Deadline
              </th>

              <th style={thStyle}>
                Action
              </th>
            </tr>
          </thead>

          <tbody>

            {tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={emptyStyle}
                >
                  No office tasks yet
                </td>
              </tr>
            ) : (
              tasks.map((task) => (

                <tr key={task.id}>

                  <td style={tdStyle}>
                    <strong>
                      {task.task_name}
                    </strong>

                    {task.description && (
                      <div
                        style={descriptionStyle}
                      >
                        {task.description}
                      </div>
                    )}
                  </td>

                  <td style={tdStyle}>
                    {task.assigned_to || "-"}
                  </td>

                  <td style={tdStyle}>
                    {task.priority}
                  </td>

                  <td style={tdStyle}>
                    <strong>
                      {task.status}
                    </strong>
                  </td>

                  <td style={tdStyle}>
                    {task.completed_quantity}
                    {" / "}
                    {task.total_quantity}
                  </td>

                  <td style={tdStyle}>
                    {task.deadline || "-"}
                  </td>

                  <td style={tdStyle}>

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

                  </td>

                </tr>

              ))
            )}

          </tbody>

        </table>
      </div>

      {/* HISTORY POPUP */}
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
  marginTop: "5px",
};

const buttonStyle = {
  background: "#111",
  color: "#fff",
  padding: "12px 20px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const formStyle = {
  background: "#fff",
  padding: "25px",
  borderRadius: "12px",
  marginBottom: "25px",
  border: "1px solid #ddd",
  maxWidth: "800px",
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

const tableWrapperStyle = {
  background: "#fff",
  borderRadius: "12px",
  overflow: "auto" as const,
  border: "1px solid #ddd",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  minWidth: "1200px",
};

const thStyle = {
  padding: "14px",
  textAlign: "left" as const,
  borderBottom: "1px solid #ddd",
  background: "#f7f7f7",
};

const tdStyle = {
  padding: "14px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top" as const,
};

const descriptionStyle = {
  color: "#777",
  fontSize: "13px",
  marginTop: "4px",
};

const emptyStyle = {
  padding: "40px",
  textAlign: "center" as const,
  color: "#777",
};

const updateButtonStyle = {
  background: "#e0f2fe",
  border: "none",
  padding: "7px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  marginRight: "6px",
  marginBottom: "5px",
};

const historyButtonStyle = {
  background: "#ede9fe",
  border: "none",
  padding: "7px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  marginRight: "6px",
  marginBottom: "5px",
};

const editButtonStyle = {
  background: "#eee",
  border: "none",
  padding: "7px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  marginRight: "6px",
  marginBottom: "5px",
};

const deleteButtonStyle = {
  background: "#fee2e2",
  border: "none",
  padding: "7px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  marginBottom: "5px",
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

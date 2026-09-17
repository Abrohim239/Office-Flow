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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Load Tasks + Employees
  async function loadData() {
    const { data: taskData, error: taskError } = await supabase
      .from("office_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (taskError) {
      alert("Task Load Error: " + taskError.message);
      return;
    }

    const { data: employeeData, error: employeeError } =
      await supabase
        .from("employees")
        .select("id, name")
        .eq("active", true)
        .order("name", { ascending: true });

    if (employeeError) {
      alert("Employee Load Error: " + employeeError.message);
      return;
    }

    setTasks(taskData || []);
    setEmployees(employeeData || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Add Task
  async function addTask(e: React.FormEvent) {
    e.preventDefault();

    if (!form.task_name.trim()) {
      alert("Task Name দিন");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("office_tasks")
      .insert([
        {
          task_name: form.task_name.trim(),
          description: form.description.trim(),
          assigned_to: form.assigned_to,
          priority: form.priority,
          status: form.status.trim() || "Pending",
          start_date: form.start_date || null,
          deadline: form.deadline || null,
          total_quantity: Number(form.total_quantity) || 0,
          completed_quantity:
            Number(form.completed_quantity) || 0,
          notes: form.notes.trim(),
        },
      ]);

    setLoading(false);

    if (error) {
      alert("Task Save Error: " + error.message);
      return;
    }

    alert("Task successfully added! ✅");

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

    setShowForm(false);
    loadData();
  }

  return (
    <main style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Office Tasks</h1>
          <p style={subtitleStyle}>
            Manage all office work
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={buttonStyle}
        >
          {showForm ? "✕ Close" : "+ Add Task"}
        </button>
      </div>

      {/* Add Task Form */}
      {showForm && (
        <form onSubmit={addTask} style={formStyle}>
          <h2 style={formTitleStyle}>
            Add New Office Task
          </h2>

          {/* Task Name */}
          <label style={labelStyle}>
            Task Name *
          </label>

          <input
            type="text"
            placeholder="যেমন: Cutting Order #101"
            value={form.task_name}
            onChange={(e) =>
              setForm({
                ...form,
                task_name: e.target.value,
              })
            }
            style={inputStyle}
          />

          {/* Description */}
          <label style={labelStyle}>
            Description
          </label>

          <textarea
            placeholder="কাজের বিস্তারিত লিখুন"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
            style={textareaStyle}
          />

          {/* Assigned Employee */}
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

          {employees.length === 0 && (
            <p
              style={{
                color: "#d97706",
                fontSize: "13px",
                marginTop: "-5px",
                marginBottom: "12px",
              }}
            >
              কোনো active employee পাওয়া যায়নি।
            </p>
          )}

          {/* Priority */}
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

          {/* Status */}
          <label style={labelStyle}>
            Current Status
          </label>

          <input
            type="text"
            placeholder="যেমন: Cutting চলছে"
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value,
              })
            }
            style={inputStyle}
          />

          {/* Dates */}
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

          {/* Quantity */}
          <div style={twoColumnStyle}>
            <div>
              <label style={labelStyle}>
                Total Quantity
              </label>

              <input
                type="number"
                min="0"
                placeholder="1000"
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
                placeholder="0"
                value={form.completed_quantity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    completed_quantity: e.target.value,
                  })
                }
                style={inputStyle}
              />
            </div>
          </div>

          {/* Notes */}
          <label style={labelStyle}>
            Notes
          </label>

          <textarea
            placeholder="অতিরিক্ত কোনো তথ্য"
            value={form.notes}
            onChange={(e) =>
              setForm({
                ...form,
                notes: e.target.value,
              })
            }
            style={textareaStyle}
          />

          {/* Save */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...saveButtonStyle,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Saving..." : "✓ Save Task"}
          </button>
        </form>
      )}

      {/* Task Table */}
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
            </tr>
          </thead>

          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  style={emptyStyle}
                >
                  No office tasks yet
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td style={tdStyle}>
                    <strong>{task.task_name}</strong>

                    {task.description && (
                      <div
                        style={{
                          color: "#777",
                          fontSize: "13px",
                          marginTop: "4px",
                        }}
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
                    {task.status}
                  </td>

                  <td style={tdStyle}>
                    {task.completed_quantity} /{" "}
                    {task.total_quantity}
                  </td>

                  <td style={tdStyle}>
                    {task.deadline || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

/* ---------- STYLES ---------- */

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
  fontSize: "15px",
};

const formStyle = {
  background: "#fff",
  padding: "25px",
  borderRadius: "12px",
  marginBottom: "25px",
  border: "1px solid #ddd",
  maxWidth: "800px",
};

const formTitleStyle = {
  fontSize: "22px",
  marginTop: 0,
  marginBottom: "20px",
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
  fontSize: "14px",
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
  fontSize: "15px",
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
  minWidth: "850px",
};

const thStyle = {
  padding: "14px",
  textAlign: "left" as const,
  borderBottom: "1px solid #ddd",
  background: "#f7f7f7",
  fontSize: "14px",
};

const tdStyle = {
  padding: "14px",
  borderBottom: "1px solid #eee",
  fontSize: "14px",
};

const emptyStyle = {
  padding: "40px",
  textAlign: "center" as const,
  color: "#777",
};

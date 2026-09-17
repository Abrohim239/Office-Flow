"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

  async function loadData() {
    const [tasksResult, employeesResult] = await Promise.all([
      supabase
        .from("office_tasks")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("employees")
        .select("id, name")
        .eq("active", true)
        .order("name"),
    ]);

    if (tasksResult.error) {
      alert(tasksResult.error.message);
      return;
    }

    if (employeesResult.error) {
      alert(employeesResult.error.message);
      return;
    }

    setTasks(tasksResult.data || []);
    setEmployees(employeesResult.data || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();

    if (!form.task_name.trim()) {
      alert("Task name দিন");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("office_tasks").insert([
      {
        task_name: form.task_name,
        description: form.description,
        assigned_to: form.assigned_to,
        priority: form.priority,
        status: form.status,
        start_date: form.start_date || null,
        deadline: form.deadline || null,
        total_quantity: Number(form.total_quantity) || 0,
        completed_quantity: Number(form.completed_quantity) || 0,
        notes: form.notes,
      },
    ]);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

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
    <main style={{ padding: "30px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "25px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "30px", fontWeight: "700" }}>
            Office Tasks
          </h1>
          <p style={{ color: "#666" }}>
            Manage all office work
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={buttonStyle}
        >
          + Add Task
        </button>
      </div>

      {showForm && (
        <form onSubmit={addTask} style={formStyle}>
          <h2 style={{ marginBottom: "20px" }}>Add New Task</h2>

          <input
            placeholder="Task Name *"
            value={form.task_name}
            onChange={(e) =>
              setForm({ ...form, task_name: e.target.value })
            }
            style={inputStyle}
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            style={inputStyle}
          />

          {/* EMPLOYEE DROPDOWN */}
          <select
            value={form.assigned_to}
            onChange={(e) =>
              setForm({ ...form, assigned_to: e.target.value })
            }
            style={inputStyle}
          >
            <option value="">Select Employee</option>

            {employees.map((employee) => (
              <option key={employee.id} value={employee.name}>
                {employee.name}
              </option>
            ))}
          </select>

          <select
            value={form.priority}
            onChange={(e) =>
              setForm({ ...form, priority: e.target.value })
            }
            style={inputStyle}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <input
            placeholder="Status"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value })
            }
            style={inputStyle}
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) =>
                setForm({ ...form, start_date: e.target.value })
              }
              style={inputStyle}
            />

            <input
              type="date"
              value={form.deadline}
              onChange={(e) =>
                setForm({ ...form, deadline: e.target.value })
              }
              style={inputStyle}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="number"
              placeholder="Total Quantity"
              value={form.total_quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  total_quantity: e.target.value,
                })
              }
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Completed Quantity"
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

          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) =>
              setForm({ ...form, notes: e.target.value })
            }
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={buttonStyle}
          >
            {loading ? "Saving..." : "Save Task"}
          </button>
        </form>
      )}

      <div style={tableWrapper}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                <td colSpan={6} style={emptyStyle}>
                  No tasks yet
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id}>
                  <td style={tdStyle}>{task.task_name}</td>
                  <td style={tdStyle}>
                    {task.assigned_to || "-"}
                  </td>
                  <td style={tdStyle}>{task.priority}</td>
                  <td style={tdStyle}>{task.status}</td>
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
  maxWidth: "750px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "12px",
  border: "1px solid #ccc",
  borderRadius: "7px",
  boxSizing: "border-box" as const,
};

const tableWrapper = {
  background: "#fff",
  borderRadius: "12px",
  overflow: "auto" as const,
  border: "1px solid #ddd",
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
};

const emptyStyle = {
  padding: "30px",
  textAlign: "center" as const,
};

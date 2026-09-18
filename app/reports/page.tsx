"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();

type Task = {
  id: string;
  task_name: string;
  assigned_to: string | null;
  status: string | null;
  deadline: string | null;
  total_quantity: number | null;
  completed_quantity: number | null;
};

export default function ReportsPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  async function loadTasks() {
    setLoading(true);

    const { data, error } = await supabase
      .from("office_tasks")
      .select(
        "id, task_name, assigned_to, status, deadline, total_quantity, completed_quantity"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Task load করতে সমস্যা হয়েছে");
    } else {
      setTasks(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (fromDate && (!task.deadline || task.deadline < fromDate)) {
      return false;
    }

    if (toDate && (!task.deadline || task.deadline > toDate)) {
      return false;
    }

    return true;
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "30px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <h1>📊 Task Reports</h1>

        <p style={{ color: "#667085" }}>
          Deadline অনুযায়ী Task Report
        </p>

        {/* FILTER */}
        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            marginTop: "25px",
            marginBottom: "25px",
          }}
        >
          <h2>🔎 Report Filter</h2>

          <div
            style={{
              display: "flex",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <label>From Date</label>
              <br />

              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{
                  padding: "10px",
                  marginTop: "5px",
                }}
              />
            </div>

            <div>
              <label>To Date</label>
              <br />

              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{
                  padding: "10px",
                  marginTop: "5px",
                }}
              />
            </div>

            <div style={{ paddingTop: "22px" }}>
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                style={{
                  padding: "10px 18px",
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* RESULT */}
        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          <h2>📋 Tasks ({filteredTasks.length})</h2>

          {loading ? (
            <p>Loading...</p>
          ) : filteredTasks.length === 0 ? (
            <p>কোনো Task পাওয়া যায়নি।</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th style={thStyle}>Task</th>
                    <th style={thStyle}>Employee</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Deadline</th>
                    <th style={thStyle}>Total Qty</th>
                    <th style={thStyle}>Completed</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td style={tdStyle}>{task.task_name}</td>

                      <td style={tdStyle}>
                        {task.assigned_to || "-"}
                      </td>

                      <td style={tdStyle}>
                        {task.status || "Pending"}
                      </td>

                      <td style={tdStyle}>
                        {task.deadline || "-"}
                      </td>

                      <td style={tdStyle}>
                        {task.total_quantity || 0}
                      </td>

                      <td style={tdStyle}>
                        {task.completed_quantity || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

const thStyle = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom: "2px solid #ddd",
  background: "#f5f5f5",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee",
};

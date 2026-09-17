"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Employee = {
  id: string;
  name: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  active: boolean;
};

export default function EmployeesPage() {
  const supabase = createClient();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");

  async function loadEmployees() {
    setLoading(true);

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setEmployees(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function addEmployee(e: FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage("Employee name দিন");
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.from("employees").insert({
      name: name.trim(),
      phone: phone.trim(),
      department: department.trim(),
      designation: designation.trim(),
      active: true,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Employee successfully added ✅");

      setName("");
      setPhone("");
      setDepartment("");
      setDesignation("");
      setShowForm(false);

      await loadEmployees();
    }

    setSaving(false);
  }

  return (
    <main className="container">
      <div className="pagehead">
        <div>
          <h1>Employees</h1>
          <p className="muted">Employee information</p>
        </div>

        <button
          className="btn"
          onClick={() => {
            setShowForm(!showForm);
            setMessage("");
          }}
        >
          {showForm ? "Close" : "+ Add Employee"}
        </button>
      </div>

      {message && <div className="error">{message}</div>}

      {showForm && (
        <section className="card">
          <h2>Add Employee</h2>

          <form className="form" onSubmit={addEmployee}>
            <div>
              <label className="label">Employee Name</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Employee name"
                required
              />
            </div>

            <div>
              <label className="label">Phone</label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>

            <div>
              <label className="label">Department</label>
              <input
                className="input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Production / Sales / Accounts"
              />
            </div>

            <div>
              <label className="label">Designation</label>
              <input
                className="input"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="Manager / Worker / Staff"
              />
            </div>

            <button className="btn" disabled={saving}>
              {saving ? "Saving..." : "Save Employee"}
            </button>
          </form>
        </section>
      )}

      <section className="card">
        <h2>Employee List</h2>

        {loading ? (
          <p>Loading...</p>
        ) : employees.length === 0 ? (
          <p className="muted">No employees added yet.</p>
        ) : (
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>{employee.phone || "-"}</td>
                    <td>{employee.department || "-"}</td>
                    <td>{employee.designation || "-"}</td>
                    <td>{employee.active ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

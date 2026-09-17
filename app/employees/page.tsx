"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Employee = {
  id: string;
  full_name: string | null;
  phone: string | null;
  department: string | null;
  role: string | null;
  active: boolean | null;
};

export default function EmployeesPage() {
  const supabase = createClient();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");

  async function loadEmployees() {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("id,full_name,phone,department,role,active")
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

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setMessage("আপনি Login করা নেই");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        phone,
        department,
      })
      .eq("id", userData.user.id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "এই মুহূর্তে আপনার নিজের profile-এ Employee তথ্য update হয়েছে।"
      );

      setName("");
      setPhone("");
      setDepartment("");
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
          <p className="muted">Employee information management</p>
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
          <p className="muted">No employees found.</p>
        ) : (
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.full_name || "-"}</td>
                    <td>{employee.phone || "-"}</td>
                    <td>{employee.department || "-"}</td>
                    <td>{employee.role || "-"}</td>
                    <td>
                      {employee.active === false ? "Inactive" : "Active"}
                    </td>
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

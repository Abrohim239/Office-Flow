"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();

type MoneyOut = {
  id: string;
  paid_to: string;
  amount: number;
  currency: string;
  category: string;
  payment_date: string;
  payment_method: string | null;
  note: string | null;
};

export default function MoneyOutPage() {
  const [records, setRecords] = useState<MoneyOut[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    paid_to: "",
    amount: "",
    currency: "BDT",
    category: "Other",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "Cash",
    note: "",
  });

  async function loadData() {
    setLoading(true);

    const { data, error } = await supabase
      .from("money_out")
      .select("*")
      .order("payment_date", { ascending: false });

    if (error) {
      alert("Load Error: " + error.message);
      setLoading(false);
      return;
    }

    setRecords(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function addMoneyOut(e: React.FormEvent) {
    e.preventDefault();

    if (!form.paid_to.trim()) {
      alert("Paid To দিন");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      alert("Amount দিন");
      return;
    }

    const { error } = await supabase
      .from("money_out")
      .insert([
        {
          paid_to: form.paid_to.trim(),
          amount: Number(form.amount),
          currency: form.currency,
          category: form.category,
          payment_date: form.payment_date,
          payment_method: form.payment_method,
          note: form.note.trim() || null,
        },
      ]);

    if (error) {
      alert("Money Out Error: " + error.message);
      return;
    }

    alert("Money Out Added Successfully! 💸");

    setForm({
      paid_to: "",
      amount: "",
      currency: "BDT",
      category: "Other",
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "Cash",
      note: "",
    });

    loadData();
  }

  async function deleteRecord(id: string) {
    if (!confirm("এই Expense Delete করতে চান?")) return;

    const { error } = await supabase
      .from("money_out")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Delete Error: " + error.message);
      return;
    }

    alert("Expense Deleted! 🗑️");
    loadData();
  }

  const totalBDT = records
    .filter((item) => item.currency === "BDT")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalUSD = records
    .filter((item) => item.currency === "USD")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>💸 Money Out</h1>
            <p style={styles.subtitle}>
              Office Expense & Payment Management
            </p>
          </div>
        </div>

        {/* SUMMARY */}
        <div style={styles.summaryGrid}>

          <div style={styles.card}>
            <div style={styles.icon}>💸</div>
            <div>
              <div style={styles.label}>Total Money Out</div>
              <div style={styles.value}>
                ৳{totalBDT.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>💵</div>
            <div>
              <div style={styles.label}>USD Out</div>
              <div style={styles.value}>
                ${totalUSD.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>🧾</div>
            <div>
              <div style={styles.label}>Total Entries</div>
              <div style={styles.value}>
                {records.length}
              </div>
            </div>
          </div>

        </div>

        {/* ADD FORM */}
        <form onSubmit={addMoneyOut} style={styles.formCard}>

          <h2 style={styles.formTitle}>
            ➕ Add Money Out
          </h2>

          <div style={styles.formGrid}>

            <input
              placeholder="Paid To *"
              value={form.paid_to}
              onChange={(e) =>
                setForm({
                  ...form,
                  paid_to: e.target.value,
                })
              }
              style={styles.input}
            />

            <input
              type="number"
              placeholder="Amount *"
              value={form.amount}
              onChange={(e) =>
                setForm({
                  ...form,
                  amount: e.target.value,
                })
              }
              style={styles.input}
            />

            <select
              value={form.currency}
              onChange={(e) =>
                setForm({
                  ...form,
                  currency: e.target.value,
                })
              }
              style={styles.input}
            >
              <option value="BDT">BDT (৳)</option>
              <option value="USD">USD ($)</option>
            </select>

            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                })
              }
              style={styles.input}
            >
              <option value="Supplier">Supplier</option>
              <option value="Worker">Worker</option>
              <option value="Salary">Salary</option>
              <option value="Transport">Transport</option>
              <option value="Office">Office Expense</option>
              <option value="Rent">Rent</option>
              <option value="Utility">Utility</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="date"
              value={form.payment_date}
              onChange={(e) =>
                setForm({
                  ...form,
                  payment_date: e.target.value,
                })
              }
              style={styles.input}
            />

            <select
              value={form.payment_method}
              onChange={(e) =>
                setForm({
                  ...form,
                  payment_method: e.target.value,
                })
              }
              style={styles.input}
            >
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>

            <input
              placeholder="Note"
              value={form.note}
              onChange={(e) =>
                setForm({
                  ...form,
                  note: e.target.value,
                })
              }
              style={styles.input}
            />

          </div>

          <button type="submit" style={styles.button}>
            💸 Save Money Out
          </button>

        </form>

        {/* HISTORY */}
        <section style={styles.section}>

          <h2 style={styles.sectionTitle}>
            📋 Money Out History
          </h2>

          {loading ? (
            <p>Loading...</p>
          ) : records.length === 0 ? (
            <p style={styles.empty}>
              এখনো কোনো Expense Entry নেই।
            </p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>

                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Paid To</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Method</th>
                    <th style={styles.th}>Note</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((item) => (
                    <tr key={item.id}>

                      <td style={styles.td}>
                        {item.payment_date}
                      </td>

                      <td style={styles.td}>
                        <strong>{item.paid_to}</strong>
                      </td>

                      <td style={styles.td}>
                        {item.category}
                      </td>

                      <td style={styles.td}>
                        <strong>
                          {item.currency === "USD"
                            ? "$"
                            : "৳"}
                          {Number(
                            item.amount
                          ).toLocaleString()}
                        </strong>
                      </td>

                      <td style={styles.td}>
                        {item.payment_method || "-"}
                      </td>

                      <td style={styles.td}>
                        {item.note || "-"}
                      </td>

                      <td style={styles.td}>
                        <button
                          onClick={() =>
                            deleteRecord(item.id)
                          }
                          style={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

        </section>

      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "30px",
    background: "#f5f7fb",
  },

  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "25px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
  },

  subtitle: {
    marginTop: "6px",
    color: "#666",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
    marginBottom: "25px",
  },

  card: {
    background: "white",
    padding: "20px",
    borderRadius: "14px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
    display: "flex",
    gap: "15px",
    alignItems: "center",
  },

  icon: {
    fontSize: "30px",
  },

  label: {
    color: "#666",
    fontSize: "14px",
  },

  value: {
    fontSize: "24px",
    fontWeight: 700,
    marginTop: "5px",
  },

  formCard: {
    background: "white",
    padding: "25px",
    borderRadius: "14px",
    marginBottom: "25px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
  },

  formTitle: {
    marginTop: 0,
    marginBottom: "20px",
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginBottom: "18px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    background: "white",
  },

  button: {
    border: "none",
    background: "#dc2626",
    color: "white",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
  },

  section: {
    background: "white",
    padding: "25px",
    borderRadius: "14px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "18px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "900px",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f3f4f6",
    borderBottom: "1px solid #ddd",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #eee",
  },

  deleteButton: {
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    padding: "7px 10px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  empty: {
    color: "#777",
    textAlign: "center",
    padding: "25px",
  },
};

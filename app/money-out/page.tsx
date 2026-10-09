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
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [categoryCurrency, setCategoryCurrency] = useState("ALL");
  const [categorySort, setCategorySort] = useState("amount");

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

  const { data, error } = await supabase.rpc(
    "add_money_out",
    {
      p_paid_to: form.paid_to.trim(),
      p_amount: Number(form.amount),
      p_currency: form.currency,
      p_category: form.category,
      p_payment_date: form.payment_date,
      p_payment_method: form.payment_method,
      p_note: form.note.trim() || null,
    }
  );

  if (error) {
    alert("Money Out Error: " + error.message);
    return;
  }

  if (!data) {
    alert("Money Out Save হয়নি।");
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

  const monthOptions = Array.from(
    new Set([
      new Date().toISOString().slice(0, 7),
      ...records.map((item) => (item.payment_date || "").slice(0, 7)).filter(Boolean),
    ])
  ).sort((a, b) => b.localeCompare(a));

  const monthlyRecords = records.filter(
    (item) => (item.payment_date || "").slice(0, 7) === selectedMonth
  );

  const totalBDT = monthlyRecords
    .filter((item) => item.currency === "BDT")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const totalUSD = monthlyRecords
    .filter((item) => item.currency === "USD")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // Selected month's expense totals grouped by category and currency
  const categoryTotals = Object.values(
    monthlyRecords.reduce<Record<string, { category: string; bdt: number; usd: number; count: number }>>(
      (groups, item) => {
        const category = item.category || "Other";
        if (!groups[category]) {
          groups[category] = { category, bdt: 0, usd: 0, count: 0 };
        }
        const amount = Number(item.amount || 0);
        if (item.currency === "USD") groups[category].usd += amount;
        else groups[category].bdt += amount;
        groups[category].count += 1;
        return groups;
      },
      {}
    )
  );

  const visibleCategoryTotals = [...categoryTotals]
    .filter((item) => categoryCurrency === "ALL" || (categoryCurrency === "BDT" ? item.bdt > 0 : item.usd > 0))
    .sort((a, b) => {
      if (categorySort === "count") return b.count - a.count;
      if (categorySort === "name") return a.category.localeCompare(b.category);
      if (categoryCurrency === "USD") return b.usd - a.usd;
      if (categoryCurrency === "BDT") return b.bdt - a.bdt;
      return (b.bdt + b.usd) - (a.bdt + a.usd);
    });
  const categoryEntryCount = categoryTotals.reduce((sum, item) => sum + item.count, 0);
  const categoryCount = categoryTotals.length;
  const maxCategoryValue = Math.max(1, ...visibleCategoryTotals.map((item) => categoryCurrency === "USD" ? item.usd : categoryCurrency === "BDT" ? item.bdt : item.count));

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
              <div style={styles.label}>Selected Month Money Out (BDT)</div>
              <div style={styles.value}>
                ৳{totalBDT.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.icon}>💵</div>
            <div>
              <div style={styles.label}>Selected Month USD Out</div>
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
                {monthlyRecords.length}
              </div>
            </div>
          </div>

        </div>

        {/* MONTHLY EXPENSE BY CATEGORY */}
        <section style={{ ...styles.categorySection, marginBottom: "25px" }}>
          <div style={styles.categoryHeader}>
            <div>
              <div style={styles.categoryEyebrow}>MONTHLY BREAKDOWN</div>
              <h2 style={styles.categoryTitle}>📊 Monthly Expense By Category</h2>
              <p style={styles.categorySubtitle}>
                {new Date(`${selectedMonth}-01T12:00:00`).toLocaleDateString("en-US", {
                  month: "long", year: "numeric",
                })} — ক্যাটাগরি অনুযায়ী মাসিক খরচের বিস্তারিত
              </p>
            </div>
            <div style={styles.categoryControls}>
              <label style={styles.controlLabel}>Month</label>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={styles.monthSelect}>
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {new Date(`${month}-01T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.categoryKpiGrid}>
            <div style={styles.categoryKpi}>
              <span style={styles.kpiIcon}>🧾</span>
              <div><div style={styles.kpiLabel}>Expense Entries</div><div style={styles.kpiValue}>{categoryEntryCount}</div></div>
            </div>
            <div style={styles.categoryKpi}>
              <span style={styles.kpiIcon}>🗂️</span>
              <div><div style={styles.kpiLabel}>Active Categories</div><div style={styles.kpiValue}>{categoryCount}</div></div>
            </div>
            <div style={styles.categoryKpi}>
              <span style={styles.kpiIcon}>💵</span>
              <div><div style={styles.kpiLabel}>Total BDT</div><div style={{ ...styles.kpiValue, color: "#047857" }}>৳{totalBDT.toLocaleString()}</div></div>
            </div>
            <div style={styles.categoryKpi}>
              <span style={styles.kpiIcon}>💲</span>
              <div><div style={styles.kpiLabel}>Total USD</div><div style={{ ...styles.kpiValue, color: "#1d4ed8" }}>${totalUSD.toLocaleString()}</div></div>
            </div>
          </div>

          <div style={styles.categoryToolbar}>
            <div>
              <div style={styles.toolbarTitle}>Category overview</div>
              <div style={styles.toolbarHint}>প্রতিটি ক্যাটাগরির মোট খরচ ও এন্ট্রি দেখুন</div>
            </div>
            <div style={styles.toolbarControls}>
              <select value={categoryCurrency} onChange={(e) => setCategoryCurrency(e.target.value)} style={styles.filterSelect} aria-label="Filter category currency">
                <option value="ALL">All currencies</option>
                <option value="BDT">BDT only</option>
                <option value="USD">USD only</option>
              </select>
              <select value={categorySort} onChange={(e) => setCategorySort(e.target.value)} style={styles.filterSelect} aria-label="Sort categories">
                <option value="amount">Highest expense</option>
                <option value="count">Most entries</option>
                <option value="name">Category name</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p style={styles.empty}>Category হিসাব লোড হচ্ছে...</p>
          ) : visibleCategoryTotals.length === 0 ? (
            <div style={styles.categoryEmpty}>
              <div style={{ fontSize: "34px", marginBottom: "8px" }}>📭</div>
              <strong>এই মাসে কোনো Expense Entry নেই</strong>
              <p style={{ margin: "7px 0 0", color: "#64748b" }}>অন্য মাস নির্বাচন করুন অথবা Money Out যোগ করুন।</p>
            </div>
          ) : (
            <div style={styles.categoryGrid}>
              {visibleCategoryTotals.map((item, index) => {
                const value = categoryCurrency === "USD" ? item.usd : categoryCurrency === "BDT" ? item.bdt : item.count;
                const percent = Math.round((value / maxCategoryValue) * 100);
                const accents = ["#2563eb", "#059669", "#7c3aed", "#ea580c", "#0891b2", "#db2777", "#4f46e5", "#65a30d"];
                const accent = accents[index % accents.length];
                return (
                  <div key={item.category} style={styles.categoryCard}>
                    <div style={styles.categoryCardTop}>
                      <div style={{ ...styles.categoryDot, background: accent }} />
                      <div style={styles.categoryName}>{item.category}</div>
                      <span style={styles.entryPill}>{item.count} {item.count === 1 ? "entry" : "entries"}</span>
                    </div>
                    <div style={styles.categoryAmounts}>
                      {categoryCurrency !== "USD" && <div><div style={styles.amountCaption}>BDT total</div><div style={styles.amountBDT}>৳{item.bdt.toLocaleString()}</div></div>}
                      {categoryCurrency !== "BDT" && <div><div style={styles.amountCaption}>USD total</div><div style={styles.amountUSD}>${item.usd.toLocaleString()}</div></div>}
                    </div>
                    <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${percent}%`, background: accent }} /></div>
                    <div style={styles.progressCaption}><span>{categoryCurrency === "ALL" ? "Share of entries" : "Relative expense"}</span><strong>{percent}%</strong></div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

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

          <div style={styles.historyHeader}>
            <h2 style={styles.sectionTitle}>
              📋 Money Out History (Monthly Wise)
            </h2>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={styles.monthSelect}
              aria-label="Select month for Money Out History"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {new Date(`${month}-01T12:00:00`).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : monthlyRecords.length === 0 ? (
            <p style={styles.empty}>
              এই মাসে কোনো Expense Entry নেই। অন্য মাস দেখতে উপরের Month dropdown ব্যবহার করুন।
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
                  {monthlyRecords.map((item) => (
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

  categorySection: {
    background: "linear-gradient(145deg, #ffffff 0%, #f8fbff 100%)",
    padding: "26px",
    borderRadius: "20px",
    border: "1px solid #e5eaf3",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.07)",
  },
  categoryHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    gap: "18px", flexWrap: "wrap", marginBottom: "22px",
  },
  categoryEyebrow: { fontSize: "11px", letterSpacing: "1.8px", fontWeight: 800, color: "#2563eb", marginBottom: "7px" },
  categoryTitle: { margin: 0, fontSize: "24px", color: "#0f172a" },
  categorySubtitle: { color: "#64748b", margin: "8px 0 0", fontSize: "14px" },
  categoryControls: { display: "flex", flexDirection: "column", gap: "6px", minWidth: "190px" },
  controlLabel: { fontSize: "12px", color: "#64748b", fontWeight: 700 },
  categoryKpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: "12px", marginBottom: "24px" },
  categoryKpi: { display: "flex", alignItems: "center", gap: "12px", padding: "16px", background: "#fff", border: "1px solid #e8edf5", borderRadius: "14px" },
  kpiIcon: { width: "42px", height: "42px", borderRadius: "12px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "21px", flexShrink: 0 },
  kpiLabel: { color: "#64748b", fontSize: "12px", fontWeight: 600 },
  kpiValue: { color: "#0f172a", fontSize: "21px", fontWeight: 800, marginTop: "3px" },
  categoryToolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "14px", flexWrap: "wrap", padding: "16px 0", borderTop: "1px solid #e8edf5", borderBottom: "1px solid #e8edf5", marginBottom: "17px" },
  toolbarTitle: { color: "#0f172a", fontSize: "15px", fontWeight: 800 },
  toolbarHint: { color: "#64748b", fontSize: "12px", marginTop: "4px" },
  toolbarControls: { display: "flex", gap: "8px", flexWrap: "wrap" },
  filterSelect: { padding: "10px 12px", border: "1px solid #dbe3ef", borderRadius: "9px", background: "#fff", color: "#334155", fontSize: "13px" },
  categoryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))", gap: "14px" },
  categoryCard: { background: "#fff", border: "1px solid #e5eaf3", borderRadius: "15px", padding: "17px", boxShadow: "0 3px 10px rgba(15,23,42,0.025)" },
  categoryCardTop: { display: "flex", alignItems: "center", gap: "9px", marginBottom: "18px" },
  categoryDot: { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 },
  categoryName: { color: "#0f172a", fontWeight: 800, fontSize: "15px", flex: 1 },
  entryPill: { fontSize: "10px", fontWeight: 700, color: "#475569", background: "#f1f5f9", padding: "5px 7px", borderRadius: "20px", whiteSpace: "nowrap" },
  categoryAmounts: { display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "18px" },
  amountCaption: { color: "#94a3b8", fontSize: "11px", marginBottom: "4px" },
  amountBDT: { color: "#047857", fontWeight: 800, fontSize: "19px" },
  amountUSD: { color: "#1d4ed8", fontWeight: 800, fontSize: "19px" },
  progressTrack: { height: "7px", background: "#eef2f7", borderRadius: "20px", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: "20px", transition: "width 180ms ease" },
  progressCaption: { display: "flex", justifyContent: "space-between", marginTop: "8px", color: "#94a3b8", fontSize: "11px" },
  categoryEmpty: { textAlign: "center", padding: "35px 15px", background: "#fff", border: "1px dashed #cbd5e1", borderRadius: "14px", color: "#334155" },

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

  historyHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },

  monthSelect: {
    minWidth: "190px",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    background: "white",
    fontSize: "14px",
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

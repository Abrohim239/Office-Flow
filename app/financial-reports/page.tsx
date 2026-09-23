"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();

type Bill = {
  id: string;
  bill_amount: number;
  currency: string;
  bill_date: string;
};

type Payment = {
  id: string;
  amount: number;
  currency: string;
  payment_date: string;
};

type MoneyOut = {
  id: string;
  amount: number;
  currency: string;
  payment_date: string;
};

function monthKey(date: string) {
  return date.slice(0, 7);
}

function monthName(key: string) {
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

export default function FinancialReportsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [moneyOut, setMoneyOut] = useState<MoneyOut[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);

    const [billResult, paymentResult, moneyOutResult] =
      await Promise.all([
        supabase
          .from("client_bills")
          .select("id,bill_amount,currency,bill_date"),

        supabase
          .from("client_payments")
          .select("id,amount,currency,payment_date"),

        supabase
          .from("money_out")
          .select("id,amount,currency,payment_date"),
      ]);

    if (billResult.error) {
      alert("Bill Error: " + billResult.error.message);
    }

    if (paymentResult.error) {
      alert("Payment Error: " + paymentResult.error.message);
    }

    if (moneyOutResult.error) {
      alert("Money Out Error: " + moneyOutResult.error.message);
    }

    setBills(billResult.data || []);
    setPayments(paymentResult.data || []);
    setMoneyOut(moneyOutResult.data || []);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const totalBillBDT = bills
    .filter((x) => x.currency === "BDT")
    .reduce(
      (sum, x) => sum + Number(x.bill_amount || 0),
      0
    );

  const totalBillUSD = bills
    .filter((x) => x.currency === "USD")
    .reduce(
      (sum, x) => sum + Number(x.bill_amount || 0),
      0
    );

  const totalReceivedBDT = payments
    .filter((x) => x.currency === "BDT")
    .reduce(
      (sum, x) => sum + Number(x.amount || 0),
      0
    );

  const totalReceivedUSD = payments
    .filter((x) => x.currency === "USD")
    .reduce(
      (sum, x) => sum + Number(x.amount || 0),
      0
    );

  const totalMoneyOutBDT = moneyOut
    .filter((x) => x.currency === "BDT")
    .reduce(
      (sum, x) => sum + Number(x.amount || 0),
      0
    );

  const totalMoneyOutUSD = moneyOut
    .filter((x) => x.currency === "USD")
    .reduce(
      (sum, x) => sum + Number(x.amount || 0),
      0
    );

  const dueBDT = totalBillBDT - totalReceivedBDT;
  const dueUSD = totalBillUSD - totalReceivedUSD;

  const surplusBDT =
    totalReceivedBDT - totalMoneyOutBDT;

  const surplusUSD =
    totalReceivedUSD - totalMoneyOutUSD;

  const months = useMemo(() => {
    const set = new Set<string>();

    bills.forEach((x) => {
      if (x.bill_date) set.add(monthKey(x.bill_date));
    });

    payments.forEach((x) => {
      if (x.payment_date) set.add(monthKey(x.payment_date));
    });

    moneyOut.forEach((x) => {
      if (x.payment_date) set.add(monthKey(x.payment_date));
    });

    return Array.from(set).sort().reverse();
  }, [bills, payments, moneyOut]);

  function getMonthlyData(month: string) {
    const billBDT = bills
      .filter(
        (x) =>
          x.currency === "BDT" &&
          monthKey(x.bill_date) === month
      )
      .reduce(
        (sum, x) => sum + Number(x.bill_amount || 0),
        0
      );

    const receivedBDT = payments
      .filter(
        (x) =>
          x.currency === "BDT" &&
          monthKey(x.payment_date) === month
      )
      .reduce(
        (sum, x) => sum + Number(x.amount || 0),
        0
      );

    const outBDT = moneyOut
      .filter(
        (x) =>
          x.currency === "BDT" &&
          monthKey(x.payment_date) === month
      )
      .reduce(
        (sum, x) => sum + Number(x.amount || 0),
        0
      );

    const billUSD = bills
      .filter(
        (x) =>
          x.currency === "USD" &&
          monthKey(x.bill_date) === month
      )
      .reduce(
        (sum, x) => sum + Number(x.bill_amount || 0),
        0
      );

    const receivedUSD = payments
      .filter(
        (x) =>
          x.currency === "USD" &&
          monthKey(x.payment_date) === month
      )
      .reduce(
        (sum, x) => sum + Number(x.amount || 0),
        0
      );

    const outUSD = moneyOut
      .filter(
        (x) =>
          x.currency === "USD" &&
          monthKey(x.payment_date) === month
      )
      .reduce(
        (sum, x) => sum + Number(x.amount || 0),
        0
      );

    return {
      billBDT,
      receivedBDT,
      outBDT,
      dueBDT: billBDT - receivedBDT,
      surplusBDT: receivedBDT - outBDT,

      billUSD,
      receivedUSD,
      outUSD,
      dueUSD: billUSD - receivedUSD,
      surplusUSD: receivedUSD - outUSD,
    };
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>
              📊 Financial Reports
            </h1>

            <p style={styles.subtitle}>
              Business Cash Flow & Client Account Summary
            </p>
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>
            Loading Financial Data...
          </div>
        ) : (
          <>
            {/* BDT SUMMARY */}
            <h2 style={styles.heading}>
              🇧🇩 BDT Summary
            </h2>

            <div style={styles.grid}>

              <div style={styles.card}>
                <span style={styles.icon}>🧾</span>
                <div>
                  <div style={styles.label}>
                    Total Client Bill
                  </div>
                  <div style={styles.value}>
                    ৳{totalBillBDT.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <span style={styles.icon}>💰</span>
                <div>
                  <div style={styles.label}>
                    Total Received
                  </div>
                  <div style={styles.valueGreen}>
                    ৳{totalReceivedBDT.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <span style={styles.icon}>⚠️</span>
                <div>
                  <div style={styles.label}>
                    Total Due
                  </div>
                  <div style={styles.valueRed}>
                    ৳{dueBDT.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <span style={styles.icon}>💸</span>
                <div>
                  <div style={styles.label}>
                    Total Money Out
                  </div>
                  <div style={styles.valueRed}>
                    ৳{totalMoneyOutBDT.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={styles.bigCard}>
                <span style={styles.icon}>📈</span>
                <div>
                  <div style={styles.label}>
                    Cash Surplus / Deficit
                  </div>

                  <div
                    style={
                      surplusBDT >= 0
                        ? styles.bigGreen
                        : styles.bigRed
                    }
                  >
                    {surplusBDT >= 0 ? "+" : "-"}৳
                    {Math.abs(
                      surplusBDT
                    ).toLocaleString()}
                  </div>

                  <small>
                    Received − Money Out
                  </small>
                </div>
              </div>

            </div>

            {/* USD SUMMARY */}
            <h2 style={styles.heading}>
              🇺🇸 USD Summary
            </h2>

            <div style={styles.grid}>

              <div style={styles.card}>
                <span style={styles.icon}>🧾</span>
                <div>
                  <div style={styles.label}>
                    Total Client Bill
                  </div>
                  <div style={styles.value}>
                    ${totalBillUSD.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <span style={styles.icon}>💰</span>
                <div>
                  <div style={styles.label}>
                    Total Received
                  </div>
                  <div style={styles.valueGreen}>
                    ${totalReceivedUSD.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <span style={styles.icon}>⚠️</span>
                <div>
                  <div style={styles.label}>
                    Total Due
                  </div>
                  <div style={styles.valueRed}>
                    ${dueUSD.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <span style={styles.icon}>💸</span>
                <div>
                  <div style={styles.label}>
                    Total Money Out
                  </div>
                  <div style={styles.valueRed}>
                    ${totalMoneyOutUSD.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={styles.bigCard}>
                <span style={styles.icon}>📈</span>
                <div>
                  <div style={styles.label}>
                    Cash Surplus / Deficit
                  </div>

                  <div
                    style={
                      surplusUSD >= 0
                        ? styles.bigGreen
                        : styles.bigRed
                    }
                  >
                    {surplusUSD >= 0 ? "+" : "-"}$
                    {Math.abs(
                      surplusUSD
                    ).toLocaleString()}
                  </div>

                  <small>
                    Received − Money Out
                  </small>
                </div>
              </div>

            </div>

            {/* MONTHLY REPORT */}
            <section style={styles.section}>

              <h2 style={styles.heading}>
                📅 Monthly Financial Report
              </h2>

              {months.length === 0 ? (
                <p style={styles.empty}>
                  এখনো কোনো Financial Data নেই।
                </p>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>

                    <thead>
                      <tr>
                        <th style={styles.th}>
                          Month
                        </th>

                        <th style={styles.th}>
                          Bill
                        </th>

                        <th style={styles.th}>
                          Received
                        </th>

                        <th style={styles.th}>
                          Due
                        </th>

                        <th style={styles.th}>
                          Money Out
                        </th>

                        <th style={styles.th}>
                          Surplus / Deficit
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {months.map((month) => {
                        const data =
                          getMonthlyData(month);

                        return (
                          <tr key={month}>

                            <td style={styles.td}>
                              <strong>
                                {monthName(month)}
                              </strong>
                            </td>

                            <td style={styles.td}>
                              ৳
                              {data.billBDT.toLocaleString()}
                            </td>

                            <td
                              style={{
                                ...styles.td,
                                color: "#16a34a",
                                fontWeight: 600,
                              }}
                            >
                              ৳
                              {data.receivedBDT.toLocaleString()}
                            </td>

                            <td
                              style={{
                                ...styles.td,
                                color:
                                  data.dueBDT > 0
                                    ? "#dc2626"
                                    : "#16a34a",
                                fontWeight: 600,
                              }}
                            >
                              ৳
                              {data.dueBDT.toLocaleString()}
                            </td>

                            <td style={styles.td}>
                              ৳
                              {data.outBDT.toLocaleString()}
                            </td>

                            <td
                              style={{
                                ...styles.td,
                                color:
                                  data.surplusBDT >= 0
                                    ? "#16a34a"
                                    : "#dc2626",
                                fontWeight: 700,
                              }}
                            >
                              {data.surplusBDT >= 0
                                ? "+"
                                : "-"}
                              ৳
                              {Math.abs(
                                data.surplusBDT
                              ).toLocaleString()}
                            </td>

                          </tr>
                        );
                      })}
                    </tbody>

                  </table>
                </div>
              )}

            </section>

            {/* NOTE */}
            <div style={styles.note}>
              <strong>নোট:</strong> Cash Surplus/Deficit =
              Total Received − Total Money Out.
              <br />
              BDT ও USD আলাদাভাবে হিসাব করা হচ্ছে।
            </div>
          </>
        )}

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
    marginBottom: "30px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
  },

  subtitle: {
    marginTop: "6px",
    color: "#666",
  },

  heading: {
    marginTop: "25px",
    marginBottom: "15px",
  },

  grid: {
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

  bigCard: {
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
    fontSize: "23px",
    fontWeight: 700,
    marginTop: "5px",
  },

  valueGreen: {
    fontSize: "23px",
    fontWeight: 700,
    marginTop: "5px",
    color: "#16a34a",
  },

  valueRed: {
    fontSize: "23px",
    fontWeight: 700,
    marginTop: "5px",
    color: "#dc2626",
  },

  bigGreen: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#16a34a",
    marginTop: "5px",
  },

  bigRed: {
    fontSize: "28px",
    fontWeight: 800,
    color: "#dc2626",
    marginTop: "5px",
  },

  section: {
    background: "white",
    padding: "25px",
    borderRadius: "14px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.06)",
    marginTop: "25px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "850px",
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

  empty: {
    textAlign: "center",
    color: "#777",
    padding: "30px",
  },

  loading: {
    background: "white",
    padding: "40px",
    textAlign: "center",
    borderRadius: "14px",
  },

  note: {
    marginTop: "20px",
    padding: "18px",
    background: "#eef6ff",
    borderRadius: "10px",
    color: "#374151",
    lineHeight: 1.7,
  },
};

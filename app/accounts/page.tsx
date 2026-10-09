"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/client";

const supabase = createClient();

type Client = {
  id: string;
  client_name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

type Bill = {
  id: string;
  client_id: string;
  bill_number: string | null;
  bill_amount: number;
  currency: string;
  bill_date: string;
  note: string | null;
};

type Payment = {
  id: string;
  client_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: string | null;
  payment_status: string | null;
  note: string | null;
};

type PaymentHistory = {
  id: string;
  payment_id: string;
  previous_status: string | null;
  new_status: string;
  created_at: string;
};

export default function AccountsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);

  const [showClientForm, setShowClientForm] =
    useState(false);

  const [showBillForm, setShowBillForm] =
    useState(false);

  const [showPaymentForm, setShowPaymentForm] =
    useState(false);

  const [historyPayment, setHistoryPayment] =
    useState<Payment | null>(null);

  const [paymentHistory, setPaymentHistory] =
    useState<PaymentHistory[]>([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  // Bill History search: client/buyer name, bill number, date, amount
  const [billSearch, setBillSearch] = useState("");

  // =====================================================
  // FORMS
  // =====================================================

  const [clientForm, setClientForm] = useState({
    client_name: "",
    phone: "",
    address: "",
    notes: "",
  });

  const [billForm, setBillForm] = useState({
    client_id: "",
    bill_number: "",
    bill_amount: "",
    currency: "BDT",
    bill_date: new Date()
      .toISOString()
      .split("T")[0],
    note: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    client_id: "",
    amount: "",
    currency: "BDT",
    payment_date: new Date()
      .toISOString()
      .split("T")[0],
    payment_method: "Cash",
    payment_status: "Factory Pending",
    note: "",
  });

  // =====================================================
  // LOAD DATA
  // =====================================================

  async function loadData() {
    setLoading(true);

    const [
      clientResult,
      billResult,
      paymentResult,
    ] = await Promise.all([
      supabase
        .from("client_accounts")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("client_bills")
        .select("*")
        .order("bill_date", {
          ascending: false,
        }),

      supabase
        .from("client_payments")
        .select("*")
        .order("payment_date", {
          ascending: false,
        }),
    ]);

    if (clientResult.error) {
      alert(
        "Client Load Error: " +
          clientResult.error.message
      );
    }

    if (billResult.error) {
      alert(
        "Bill Load Error: " +
          billResult.error.message
      );
    }

    if (paymentResult.error) {
      alert(
        "Payment Load Error: " +
          paymentResult.error.message
      );
    }

    setClients(clientResult.data || []);
    setBills(billResult.data || []);
    setPayments(paymentResult.data || []);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // =====================================================
  // ADD CLIENT
  // =====================================================

  async function addClient(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!clientForm.client_name.trim()) {
      alert("Client Name দিন");
      return;
    }

    const { data, error } =
      await supabase.rpc(
        "add_client_account",
        {
          p_client_name:
            clientForm.client_name.trim(),

          p_phone:
            clientForm.phone.trim(),

          p_address:
            clientForm.address.trim(),

          p_notes:
            clientForm.notes.trim() ||
            null,
        }
      );

    if (error) {
      alert(
        "Client Add Error: " +
          error.message
      );
      return;
    }

    if (!data) {
      alert("Client Save হয়নি।");
      return;
    }

    alert(
      "Client Added Successfully! 👤"
    );

    setClientForm({
      client_name: "",
      phone: "",
      address: "",
      notes: "",
    });

    setShowClientForm(false);

    loadData();
  }

  // =====================================================
  // ADD BILL
  // =====================================================

  async function addBill(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!billForm.client_id) {
      alert("Client Select করুন");
      return;
    }

    if (
      !billForm.bill_amount ||
      Number(billForm.bill_amount) <= 0
    ) {
      alert("Bill Amount দিন");
      return;
    }

    const { error } =
      await supabase
        .from("client_bills")
        .insert([
          {
            client_id:
              billForm.client_id,

            bill_number:
              billForm.bill_number.trim() ||
              null,

            bill_amount:
              Number(
                billForm.bill_amount
              ),

            currency:
              billForm.currency,

            bill_date:
              billForm.bill_date,

            note:
              billForm.note.trim() ||
              null,
          },
        ]);

    if (error) {
      alert(
        "Bill Add Error: " +
          error.message
      );
      return;
    }

    alert(
      "Bill Added Successfully! ✅"
    );

    setBillForm({
      client_id: "",
      bill_number: "",
      bill_amount: "",
      currency: "BDT",
      bill_date: new Date()
        .toISOString()
        .split("T")[0],
      note: "",
    });

    setShowBillForm(false);

    loadData();
  }

  // =====================================================
  // ADD PAYMENT
  // =====================================================

  async function addPayment(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!paymentForm.client_id) {
      alert("Client Select করুন");
      return;
    }

    if (
      !paymentForm.amount ||
      Number(paymentForm.amount) <= 0
    ) {
      alert("Payment Amount দিন");
      return;
    }

    const { data, error } =
      await supabase
        .from("client_payments")
        .insert([
          {
            client_id:
              paymentForm.client_id,

            amount:
              Number(
                paymentForm.amount
              ),

            currency:
              paymentForm.currency,

            payment_date:
              paymentForm.payment_date,

            payment_method:
              paymentForm.payment_method,

            payment_status:
              paymentForm.payment_status,

            note:
              paymentForm.note.trim() ||
              null,
          },
        ])
        .select()
        .single();

    if (error) {
      alert(
        "Payment Add Error: " +
          error.message
      );
      return;
    }

    // Initial history
    if (data) {
      const {
        error: historyError,
      } = await supabase
        .from(
          "client_payment_history"
        )
        .insert([
          {
            payment_id: data.id,
            previous_status: null,
            new_status:
              paymentForm.payment_status,
          },
        ]);

      if (historyError) {
        console.log(
          "Initial payment history error:",
          historyError.message
        );
      }
    }

    alert(
      "Payment Received Added! 💰"
    );

    setPaymentForm({
      client_id: "",
      amount: "",
      currency: "BDT",
      payment_date: new Date()
        .toISOString()
        .split("T")[0],
      payment_method: "Cash",
      payment_status:
        "Factory Pending",
      note: "",
    });

    setShowPaymentForm(false);

    loadData();
  }

  // =====================================================
  // UPDATE PAYMENT STATUS
  // =====================================================

  async function updatePaymentStatus(
    payment: Payment,
    newStatus: string
  ) {
    const oldStatus =
      payment.payment_status ||
      "Factory Pending";

    if (oldStatus === newStatus) {
      return;
    }

    const { data, error } =
      await supabase.rpc(
        "update_client_payment_status",
        {
          p_payment_id: payment.id,
          p_new_status: newStatus,
        }
      );

    if (error) {
      alert(
        "Payment Status Update Error: " +
          error.message
      );
      return;
    }

    if (!data) {
      alert(
        "Payment Status Update হয়নি।"
      );
      return;
    }

    alert(
      "Payment Status Updated! ✅"
    );

    loadData();
  }

  // =====================================================
  // SHOW PAYMENT HISTORY
  // =====================================================

  async function showPaymentHistory(
    payment: Payment
  ) {
    setHistoryPayment(payment);
    setPaymentHistory([]);
    setHistoryLoading(true);

    const {
      data,
      error,
    } = await supabase
      .from(
        "client_payment_history"
      )
      .select(
        "id, payment_id, previous_status, new_status, created_at"
      )
      .eq(
        "payment_id",
        payment.id
      )
      .order("created_at", {
        ascending: false,
      });

    setHistoryLoading(false);

    if (error) {
      alert(
        "Payment History Error: " +
          error.message
      );
      return;
    }

    setPaymentHistory(
      data || []
    );
  }

  // =====================================================
  // DELETE CLIENT
  // =====================================================

  async function deleteClient(
    id: string
  ) {
    if (
      !confirm(
        "এই Client এবং তার হিসাব Delete করতে চান?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("client_accounts")
        .delete()
        .eq("id", id);

    if (error) {
      alert(
        "Delete Error: " +
          error.message
      );
      return;
    }

    alert(
      "Client Deleted! 🗑️"
    );

    loadData();
  }

  // =====================================================
  // DELETE BILL
  // =====================================================

  async function deleteBill(
    id: string
  ) {
    if (
      !confirm(
        "এই Bill Delete করতে চান?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("client_bills")
        .delete()
        .eq("id", id);

    if (error) {
      alert(
        "Delete Error: " +
          error.message
      );
      return;
    }

    loadData();
  }

  // =====================================================
  // DELETE PAYMENT
  // =====================================================

  async function deletePayment(
    id: string
  ) {
    if (
      !confirm(
        "এই Payment Entry Delete করতে চান?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("client_payments")
        .delete()
        .eq("id", id);

    if (error) {
      alert(
        "Delete Error: " +
          error.message
      );
      return;
    }

    if (
      historyPayment?.id === id
    ) {
      setHistoryPayment(null);
      setPaymentHistory([]);
    }

    loadData();
  }

  // =====================================================
  // HELPERS
  // =====================================================

  function getClientName(
    id: string
  ) {
    return (
      clients.find(
        (client) =>
          client.id === id
      )?.client_name ||
      "Unknown Client"
    );
  }

  // =====================================================
  // CLIENT BDT
  // =====================================================

  function getClientTotalBillBDT(
    clientId: string
  ) {
    return bills
      .filter(
        (bill) =>
          bill.client_id ===
            clientId &&
          bill.currency === "BDT"
      )
      .reduce(
        (sum, bill) =>
          sum +
          Number(
            bill.bill_amount || 0
          ),
        0
      );
  }

  function getClientReceivedBDT(
    clientId: string
  ) {
    return payments
      .filter(
        (payment) =>
          payment.client_id ===
            clientId &&
          payment.currency ===
            "BDT"
      )
      .reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );
  }

  function getClientDueBDT(
    clientId: string
  ) {
    return (
      getClientTotalBillBDT(
        clientId
      ) -
      getClientReceivedBDT(
        clientId
      )
    );
  }

  // =====================================================
  // CLIENT USD
  // =====================================================

  function getClientTotalBillUSD(
    clientId: string
  ) {
    return bills
      .filter(
        (bill) =>
          bill.client_id ===
            clientId &&
          bill.currency === "USD"
      )
      .reduce(
        (sum, bill) =>
          sum +
          Number(
            bill.bill_amount || 0
          ),
        0
      );
  }

  function getClientReceivedUSD(
    clientId: string
  ) {
    return payments
      .filter(
        (payment) =>
          payment.client_id ===
            clientId &&
          payment.currency ===
            "USD"
      )
      .reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );
  }

  function getClientDueUSD(
    clientId: string
  ) {
    return (
      getClientTotalBillUSD(
        clientId
      ) -
      getClientReceivedUSD(
        clientId
      )
    );
  }

  // =====================================================
  // TOTAL BDT
  // =====================================================

  const totalBillBDT = bills
    .filter(
      (bill) =>
        bill.currency === "BDT"
    )
    .reduce(
      (sum, bill) =>
        sum +
        Number(
          bill.bill_amount || 0
        ),
      0
    );

  const totalReceivedBDT =
    payments
      .filter(
        (payment) =>
          payment.currency ===
          "BDT"
      )
      .reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );

  const totalDueBDT =
    totalBillBDT -
    totalReceivedBDT;

  // =====================================================
  // TOTAL USD
  // =====================================================

  const totalBillUSD = bills
    .filter(
      (bill) =>
        bill.currency === "USD"
    )
    .reduce(
      (sum, bill) =>
        sum +
        Number(
          bill.bill_amount || 0
        ),
      0
    );

  const totalReceivedUSD =
    payments
      .filter(
        (payment) =>
          payment.currency ===
          "USD"
      )
      .reduce(
        (sum, payment) =>
          sum +
          Number(
            payment.amount || 0
          ),
        0
      );

  const totalDueUSD =
    totalBillUSD -
    totalReceivedUSD;

  // =====================================================
  // BILL HISTORY SEARCH
  // =====================================================

  const filteredBills = bills.filter((bill) => {
    const query = billSearch.trim().toLowerCase();
    if (!query) return true;

    const clientName = getClientName(bill.client_id).toLowerCase();
    const billNumber = (bill.bill_number || "").toLowerCase();
    const billDate = (bill.bill_date || "").toLowerCase();
    const amount = String(bill.bill_amount ?? "").toLowerCase();
    const currency = (bill.currency || "").toLowerCase();

    return (
      clientName.includes(query) ||
      billNumber.includes(query) ||
      billDate.includes(query) ||
      amount.includes(query) ||
      currency.includes(query)
    );
  });

  // =====================================================
  // STATUS STYLE
  // =====================================================

  function getStatusStyle(
    status: string | null
  ) {
    switch (status) {
      case "Factory Pending":
        return styles.statusFactory;

      case "LC Accepted":
        return styles.statusAccepted;

      case "Purchase Done":
        return styles.statusPurchase;

      case "On Hold":
        return styles.statusHold;

      case "Payment Received":
        return styles.statusReceived;

      default:
        return styles.statusDefault;
    }
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>

          <div>
            <h1 style={styles.title}>
              💰 Client Accounts
            </h1>

            <p style={styles.subtitle}>
              Client Bill, Payment & Due
              Management
            </p>
          </div>

          <div
            style={
              styles.headerButtons
            }
          >

            <button
              onClick={() =>
                setShowClientForm(
                  !showClientForm
                )
              }
              style={
                styles.primaryButton
              }
            >
              + Add Client
            </button>

            <button
              onClick={() =>
                setShowBillForm(
                  !showBillForm
                )
              }
              style={
                styles.secondaryButton
              }
            >
              + Add Bill
            </button>

            <button
              onClick={() =>
                setShowPaymentForm(
                  !showPaymentForm
                )
              }
              style={
                styles.successButton
              }
            >
              + Payment Received
            </button>

          </div>
        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div
          style={
            styles.summaryGrid
          }
        >

          {/* CLIENTS */}

          <div style={styles.card}>

            <div style={styles.cardIcon}>
              👥
            </div>

            <div>

              <div
                style={
                  styles.cardLabel
                }
              >
                Total Clients
              </div>

              <div
                style={
                  styles.cardValue
                }
              >
                {clients.length}
              </div>

            </div>

          </div>

          {/* TOTAL BILL */}

          <div style={styles.card}>

            <div style={styles.cardIcon}>
              🧾
            </div>

            <div>

              <div
                style={
                  styles.cardLabel
                }
              >
                Total Bill
              </div>

              <div
                style={
                  styles.cardValue
                }
              >
                ৳
                {totalBillBDT.toLocaleString()}
              </div>

              <div
                style={
                  styles.usdValue
                }
              >
                $
                {totalBillUSD.toLocaleString()}
              </div>

            </div>

          </div>

          {/* TOTAL RECEIVED */}

          <div style={styles.card}>

            <div style={styles.cardIcon}>
              💰
            </div>

            <div>

              <div
                style={
                  styles.cardLabel
                }
              >
                Total Received
              </div>

              <div
                style={
                  styles.cardValue
                }
              >
                ৳
                {totalReceivedBDT.toLocaleString()}
              </div>

              <div
                style={
                  styles.usdValue
                }
              >
                $
                {totalReceivedUSD.toLocaleString()}
              </div>

            </div>

          </div>

          {/* TOTAL DUE */}

          <div style={styles.card}>

            <div style={styles.cardIcon}>
              ⚠️
            </div>

            <div>

              <div
                style={
                  styles.cardLabel
                }
              >
                Total Due
              </div>

              <div
                style={
                  styles.dueValue
                }
              >
                ৳
                {totalDueBDT.toLocaleString()}
              </div>

              <div
                style={
                  styles.usdDueValue
                }
              >
                $
                {totalDueUSD.toLocaleString()}
              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            ADD CLIENT FORM
        ================================================= */}

        {showClientForm && (

          <form
            onSubmit={addClient}
            style={
              styles.formCard
            }
          >

            <h2
              style={
                styles.formTitle
              }
            >
              Add New Client
            </h2>

            <div
              style={
                styles.formGrid
              }
            >

              <input
                placeholder="Client Name *"
                value={
                  clientForm.client_name
                }
                onChange={(e) =>
                  setClientForm({
                    ...clientForm,
                    client_name:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              />

              <input
                placeholder="Phone"
                value={
                  clientForm.phone
                }
                onChange={(e) =>
                  setClientForm({
                    ...clientForm,
                    phone:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              />

              <input
                placeholder="Address"
                value={
                  clientForm.address
                }
                onChange={(e) =>
                  setClientForm({
                    ...clientForm,
                    address:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              />

              <input
                placeholder="Notes"
                value={
                  clientForm.notes
                }
                onChange={(e) =>
                  setClientForm({
                    ...clientForm,
                    notes:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              />

            </div>

            <button
              type="submit"
              style={
                styles.primaryButton
              }
            >
              Save Client
            </button>

          </form>
        )}

        {/* =================================================
            ADD BILL FORM
        ================================================= */}

        {showBillForm && (

          <form
            onSubmit={addBill}
            style={
              styles.formCard
            }
          >

            <h2
              style={
                styles.formTitle
              }
            >
              🧾 Add Client Bill
            </h2>

            <div
              style={
                styles.formGrid
              }
            >

              <select
                value={
                  billForm.client_id
                }
                onChange={(e) =>
                  setBillForm({
                    ...billForm,
                    client_id:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              >
                <option value="">
                  -- Select Client --
                </option>

                {clients.map(
                  (client) => (
                    <option
                      key={
                        client.id
                      }
                      value={
                        client.id
                      }
                    >
                      {
                        client.client_name
                      }
                    </option>
                  )
                )}

              </select>

              <input
                placeholder="Bill Number"
                value={
                  billForm.bill_number
                }
                onChange={(e) =>
                  setBillForm({
                    ...billForm,
                    bill_number:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              />

              <input
                type="number"
                step="0.01"
                placeholder="Bill Amount"
                value={
                  billForm.bill_amount
                }
                onChange={(e) =>
                  setBillForm({
                    ...billForm,
                    bill_amount:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              />

              <select
                value={
                  billForm.currency
                }
                onChange={(e) =>
                  setBillForm({
                    ...billForm,
                    currency:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              >
                <option value="BDT">
                  BDT (৳)
                </option>

                <option value="USD">
                  USD ($)
                </option>
              </select>

              <input
                type="date"
                value={
                  billForm.bill_date
                }
                onChange={(e) =>
                  setBillForm({
                    ...billForm,
                    bill_date:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              />

              <input
                placeholder="Note"
                value={
                  billForm.note
                }
                onChange={(e) =>
                  setBillForm({
                    ...billForm,
                    note:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              />

            </div>

            <button
              type="submit"
              style={
                styles.secondaryButton
              }
            >
              Save Bill
            </button>

          </form>
        )}

        {/* =================================================
            ADD PAYMENT FORM
        ================================================= */}

        {showPaymentForm && (

          <form
            onSubmit={addPayment}
            style={
              styles.formCard
            }
          >

            <h2
              style={
                styles.formTitle
              }
            >
              💰 Add Payment Received
            </h2>

            <div
              style={
                styles.formGrid
              }
            >

              <select
                value={
                  paymentForm.client_id
                }
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    client_id:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              >

                <option value="">
                  -- Select Client --
                </option>

                {clients.map(
                  (client) => (
                    <option
                      key={
                        client.id
                      }
                      value={
                        client.id
                      }
                    >
                      {
                        client.client_name
                      }
                    </option>
                  )
                )}

              </select>

              <input
                type="number"
                step="0.01"
                placeholder="Received Amount"
                value={
                  paymentForm.amount
                }
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    amount:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              />

              <select
                value={
                  paymentForm.currency
                }
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    currency:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              >

                <option value="BDT">
                  BDT (৳)
                </option>

                <option value="USD">
                  USD ($)
                </option>

              </select>

              <input
                type="date"
                value={
                  paymentForm.payment_date
                }
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    payment_date:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              />

              <select
                value={
                  paymentForm.payment_method
                }
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    payment_method:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              >

                <option>
                  Cash
                </option>

                <option>
                  Bank
                </option>

                <option>
                  bKash
                </option>

                <option>
                  Nagad
                </option>

                <option>
                  LC Payment
                </option>

                <option>
                  Other
                </option>

              </select>

              <select
                value={
                  paymentForm.payment_status
                }
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    payment_status:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              >

                <option>
                  Factory Pending
                </option>

                <option>
                  LC Accepted
                </option>

                <option>
                  Purchase Done
                </option>

                <option>
                  On Hold
                </option>

                <option>
                  Payment Received
                </option>

              </select>

              <input
                placeholder="Note"
                value={
                  paymentForm.note
                }
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    note:
                      e.target.value,
                  })
                }
                style={
                  styles.input
                }
              />

            </div>

            <button
              type="submit"
              style={
                styles.successButton
              }
            >
              Save Payment
            </button>

          </form>
        )}

        {/* =================================================
            CLIENT ACCOUNTS
        ================================================= */}

        <section
          style={
            styles.section
          }
        >

          <h2
            style={
              styles.sectionTitle
            }
          >
            👥 Client Accounts
          </h2>

          {loading ? (

            <p>Loading...</p>

          ) : clients.length === 0 ? (

            <p
              style={
                styles.empty
              }
            >
              এখনো কোনো Client নেই।
            </p>

          ) : (

            <div
              style={
                styles.tableWrapper
              }
            >

              <table
                style={
                  styles.table
                }
              >

                <thead>

                  <tr>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Client
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Phone
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Total Bill
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Received
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Due
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {clients.map(
                    (client) => {

                      const billBDT =
                        getClientTotalBillBDT(
                          client.id
                        );

                      const receivedBDT =
                        getClientReceivedBDT(
                          client.id
                        );

                      const dueBDT =
                        getClientDueBDT(
                          client.id
                        );

                      const billUSD =
                        getClientTotalBillUSD(
                          client.id
                        );

                      const receivedUSD =
                        getClientReceivedUSD(
                          client.id
                        );

                      const dueUSD =
                        getClientDueUSD(
                          client.id
                        );

                      return (

                        <tr
                          key={
                            client.id
                          }
                        >

                          <td
                            style={
                              styles.td
                            }
                          >
                            <strong>
                              {
                                client.client_name
                              }
                            </strong>
                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >
                            {
                              client.phone ||
                              "-"
                            }
                          </td>

                          {/* BILL */}

                          <td
                            style={
                              styles.td
                            }
                          >

                            <div
                              style={
                                styles.bdtAmount
                              }
                            >
                              ৳
                              {billBDT.toLocaleString(
                                "en-BD",
                                {
                                  minimumFractionDigits:
                                    2,
                                  maximumFractionDigits:
                                    2,
                                }
                              )}
                            </div>

                            {billUSD >
                              0 && (
                              <div
                                style={
                                  styles.usdText
                                }
                              >
                                $
                                {billUSD.toLocaleString(
                                  "en-US",
                                  {
                                    minimumFractionDigits:
                                      2,
                                    maximumFractionDigits:
                                      2,
                                  }
                                )}
                              </div>
                            )}

                          </td>

                          {/* RECEIVED */}

                          <td
                            style={
                              styles.td
                            }
                          >

                            <div
                              style={
                                styles.received
                              }
                            >
                              ৳
                              {receivedBDT.toLocaleString(
                                "en-BD",
                                {
                                  minimumFractionDigits:
                                    2,
                                  maximumFractionDigits:
                                    2,
                                }
                              )}
                            </div>

                            {receivedUSD >
                              0 && (
                              <div
                                style={
                                  styles.usdText
                                }
                              >
                                $
                                {receivedUSD.toLocaleString(
                                  "en-US",
                                  {
                                    minimumFractionDigits:
                                      2,
                                    maximumFractionDigits:
                                      2,
                                  }
                                )}
                              </div>
                            )}

                          </td>

                          {/* DUE */}

                          <td
                            style={
                              styles.td
                            }
                          >

                            <div
                              style={
                                dueBDT >
                                0
                                  ? styles.dueBadge
                                  : styles.paidBadge
                              }
                            >
                              ৳
                              {dueBDT.toLocaleString(
                                "en-BD",
                                {
                                  minimumFractionDigits:
                                    2,
                                  maximumFractionDigits:
                                    2,
                                }
                              )}
                            </div>

                            {dueUSD !==
                              0 && (
                              <div
                                style={
                                  dueUSD >
                                  0
                                    ? styles.usdDueText
                                    : styles.usdPaidText
                                }
                              >
                                $
                                {dueUSD.toLocaleString(
                                  "en-US",
                                  {
                                    minimumFractionDigits:
                                      2,
                                    maximumFractionDigits:
                                      2,
                                  }
                                )}
                              </div>
                            )}

                          </td>

                          <td
                            style={
                              styles.td
                            }
                          >

                            <button
                              onClick={() =>
                                deleteClient(
                                  client.id
                                )
                              }
                              style={
                                styles.deleteButton
                              }
                            >
                              Delete
                            </button>

                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* =================================================
            BILL HISTORY
        ================================================= */}

        <section
          style={
            styles.section
          }
        >

          <h2
            style={
              styles.sectionTitle
            }
          >
            🧾 Bill History
          </h2>

          <div style={{ marginBottom: "16px" }}>
            <input
              type="search"
              value={billSearch}
              onChange={(e) => setBillSearch(e.target.value)}
              placeholder="🔎 Buyer/Client Name, Bill No., Date, Amount দিয়ে Search করুন..."
              style={{
                ...styles.input,
                maxWidth: "600px",
                padding: "13px 15px",
                border: "1px solid #cbd5e1",
              }}
            />
            <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: "13px" }}>
              {billSearch.trim()
                ? `Search result: ${filteredBills.length} of ${bills.length} bills`
                : `Total bills: ${bills.length}`}
            </p>
          </div>

          {bills.length === 0 ? (

            <p
              style={
                styles.empty
              }
            >
              কোনো Bill নেই।
            </p>

          ) : filteredBills.length === 0 ? (
            <p style={styles.empty}>
              এই Search-এর সাথে কোনো Bill মেলেনি। Buyer Name বা Bill Number আবার check করুন।
            </p>
          ) : (

            <div
              style={
                styles.tableWrapper
              }
            >

              <table
                style={
                  styles.table
                }
              >

                <thead>

                  <tr>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Date
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Client
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Bill No.
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Amount
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredBills.map(
                    (bill) => (

                      <tr
                        key={
                          bill.id
                        }
                      >

                        <td
                          style={
                            styles.td
                          }
                        >
                          {
                            bill.bill_date
                          }
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          {getClientName(
                            bill.client_id
                          )}
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          {
                            bill.bill_number ||
                            "-"
                          }
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >

                          {bill.currency ===
                          "USD"
                            ? "$"
                            : "৳"}

                          {Number(
                            bill.bill_amount
                          ).toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits:
                                2,
                              maximumFractionDigits:
                                2,
                            }
                          )}

                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >

                          <button
                            onClick={() =>
                              deleteBill(
                                bill.id
                              )
                            }
                            style={
                              styles.deleteButton
                            }
                          >
                            Delete
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* =================================================
            PAYMENT HISTORY
        ================================================= */}

        <section
          style={
            styles.section
          }
        >

          <h2
            style={
              styles.sectionTitle
            }
          >
            💰 Payment History
          </h2>

          {payments.length ===
          0 ? (

            <p
              style={
                styles.empty
              }
            >
              কোনো Payment নেই।
            </p>

          ) : (

            <div
              style={
                styles.tableWrapper
              }
            >

              <table
                style={
                  styles.table
                }
              >

                <thead>

                  <tr>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Date
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Client
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Amount
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Method
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Payment Status
                    </th>

                    <th
                      style={
                        styles.th
                      }
                    >
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {payments.map(
                    (payment) => (

                      <tr
                        key={
                          payment.id
                        }
                      >

                        <td
                          style={
                            styles.td
                          }
                        >
                          {
                            payment.payment_date
                          }
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          {getClientName(
                            payment.client_id
                          )}
                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >

                          {payment.currency ===
                          "USD"
                            ? "$"
                            : "৳"}

                          {Number(
                            payment.amount
                          ).toLocaleString(
                            "en-US",
                            {
                              minimumFractionDigits:
                                2,
                              maximumFractionDigits:
                                2,
                            }
                          )}

                        </td>

                        <td
                          style={
                            styles.td
                          }
                        >
                          {
                            payment.payment_method ||
                            "-"
                          }
                        </td>

                        {/* STATUS */}

                        <td
                          style={
                            styles.td
                          }
                        >

                          <select
                            value={
                              payment.payment_status ||
                              "Factory Pending"
                            }
                            onChange={(
                              e
                            ) =>
                              updatePaymentStatus(
                                payment,
                                e.target
                                  .value
                              )
                            }
                            style={{
                              ...styles.statusSelect,
                              ...getStatusStyle(
                                payment.payment_status
                              ),
                            }}
                          >

                            <option>
                              Factory Pending
                            </option>

                            <option>
                              LC Accepted
                            </option>

                            <option>
                              Purchase Done
                            </option>

                            <option>
                              On Hold
                            </option>

                            <option>
                              Payment Received
                            </option>

                          </select>

                        </td>

                        {/* ACTION */}

                        <td
                          style={
                            styles.td
                          }
                        >

                          <div
                            style={
                              styles.actionButtons
                            }
                          >

                            <button
                              onClick={() =>
                                showPaymentHistory(
                                  payment
                                )
                              }
                              style={
                                styles.historyButton
                              }
                            >
                              📜 History
                            </button>

                            <button
                              onClick={() =>
                                deletePayment(
                                  payment.id
                                )
                              }
                              style={
                                styles.deleteButton
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </div>

      {/* =================================================
          PAYMENT HISTORY MODAL
      ================================================= */}

      {historyPayment && (

        <div
          style={
            styles.overlay
          }
        >

          <div
            style={
              styles.modal
            }
          >

            <div
              style={
                styles.modalHeader
              }
            >

              <div>

                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  📜 Payment Status
                  History
                </h2>

                <p
                  style={{
                    margin:
                      "7px 0 0",
                    color:
                      "#666",
                  }}
                >
                  {
                    getClientName(
                      historyPayment.client_id
                    )
                  }

                  {" — "}

                  {historyPayment.currency ===
                  "USD"
                    ? "$"
                    : "৳"}

                  {Number(
                    historyPayment.amount
                  ).toLocaleString(
                    "en-US",
                    {
                      minimumFractionDigits:
                        2,
                      maximumFractionDigits:
                        2,
                    }
                  )}

                </p>

              </div>

              <button
                onClick={() => {
                  setHistoryPayment(
                    null
                  );
                  setPaymentHistory(
                    []
                  );
                }}
                style={
                  styles.closeButton
                }
              >
                ✕
              </button>

            </div>

            {historyLoading ? (

              <div
                style={
                  styles.historyEmpty
                }
              >
                Loading History...
              </div>

            ) : paymentHistory.length ===
              0 ? (

              <div
                style={
                  styles.historyEmpty
                }
              >
                এই Payment-এর কোনো
                History পাওয়া যায়নি।
              </div>

            ) : (

              <div>

                {paymentHistory.map(
                  (
                    item,
                    index
                  ) => (

                    <div
                      key={
                        item.id
                      }
                      style={
                        styles.historyItem
                      }
                    >

                      <div
                        style={
                          styles.historyTop
                        }
                      >

                        <span
                          style={
                            styles.oldStatus
                          }
                        >
                          {
                            item.previous_status ||
                            "New Payment"
                          }
                        </span>

                        <span
                          style={
                            styles.arrow
                          }
                        >
                          →
                        </span>

                        <span
                          style={
                            styles.newStatus
                          }
                        >
                          {
                            item.new_status
                          }
                        </span>

                      </div>

                      <div
                        style={
                          styles.historyDate
                        }
                      >
                        📅{" "}
                        {new Date(
                          item.created_at
                        ).toLocaleString(
                          "en-GB"
                        )}
                      </div>

                      <div
                        style={
                          styles.historyNumber
                        }
                      >
                        Update #
                        {paymentHistory.length -
                          index}
                      </div>

                    </div>

                  )
                )}

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

const styles: Record<
  string,
  React.CSSProperties
> = {
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
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "25px",
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 700,
  },

  subtitle: {
    marginTop: "6px",
    color: "#666",
    fontSize: "16px",
  },

  headerButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
    marginBottom: "25px",
  },

  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "14px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.06)",
    display: "flex",
    gap: "15px",
    alignItems: "center",
  },

  cardIcon: {
    fontSize: "30px",
  },

  cardLabel: {
    color: "#666",
    fontSize: "14px",
  },

  cardValue: {
    fontSize: "24px",
    fontWeight: 700,
    marginTop: "4px",
  },

  usdValue: {
    color: "#2563eb",
    fontSize: "18px",
    fontWeight: 600,
    marginTop: "3px",
  },

  dueValue: {
    color: "#dc2626",
    fontSize: "24px",
    fontWeight: 700,
    marginTop: "4px",
  },

  usdDueValue: {
    color: "#dc2626",
    fontSize: "18px",
    fontWeight: 700,
    marginTop: "3px",
  },

  primaryButton: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    padding: "11px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
  },

  secondaryButton: {
    border: "none",
    background: "#7c3aed",
    color: "#fff",
    padding: "11px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
  },

  successButton: {
    border: "none",
    background: "#16a34a",
    color: "#fff",
    padding: "11px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
  },

  formCard: {
    background: "#fff",
    padding: "25px",
    borderRadius: "14px",
    marginBottom: "25px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.06)",
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
    border:
      "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "14px",
    background: "#fff",
  },

  section: {
    background: "#fff",
    padding: "25px",
    borderRadius: "14px",
    marginBottom: "25px",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.06)",
  },

  sectionTitle: {
    marginTop: 0,
    marginBottom: "18px",
    fontSize: "22px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse:
      "collapse",
    minWidth: "950px",
  },

  th: {
    textAlign: "left",
    padding: "12px",
    background: "#f3f4f6",
    borderBottom:
      "1px solid #ddd",
    whiteSpace: "nowrap",
    fontWeight: 700,
  },

  td: {
    padding: "12px",
    borderBottom:
      "1px solid #eee",
    verticalAlign: "middle",
  },

  bdtAmount: {
    fontWeight: 600,
  },

  usdText: {
    color: "#2563eb",
    fontSize: "14px",
    fontWeight: 600,
    marginTop: "3px",
  },

  usdDueText: {
    color: "#dc2626",
    fontSize: "14px",
    fontWeight: 700,
    marginTop: "3px",
  },

  usdPaidText: {
    color: "#16a34a",
    fontSize: "14px",
    fontWeight: 700,
    marginTop: "3px",
  },

  received: {
    color: "#16a34a",
    fontWeight: 700,
  },

  dueBadge: {
    color: "#dc2626",
    fontWeight: 700,
  },

  paidBadge: {
    color: "#16a34a",
    fontWeight: 700,
  },

  deleteButton: {
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    padding: "7px 10px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  historyButton: {
    border: "none",
    background: "#ede9fe",
    color: "#6d28d9",
    padding: "7px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 600,
  },

  actionButtons: {
    display: "flex",
    gap: "7px",
    alignItems: "center",
    flexWrap: "wrap",
  },

  statusSelect: {
    padding: "8px 10px",
    borderRadius: "7px",
    border:
      "1px solid #d1d5db",
    fontWeight: 600,
    cursor: "pointer",
    minWidth: "175px",
  },

  statusFactory: {
    background: "#fff7ed",
    color: "#c2410c",
  },

  statusAccepted: {
    background: "#ede9fe",
    color: "#6d28d9",
  },

  statusPurchase: {
    background: "#dcfce7",
    color: "#15803d",
  },

  statusHold: {
    background: "#fee2e2",
    color: "#b91c1c",
  },

  statusReceived: {
    background: "#dcfce7",
    color: "#166534",
  },

  statusDefault: {
    background: "#f3f4f6",
    color: "#374151",
  },

  empty: {
    color: "#777",
    textAlign: "center",
    padding: "25px",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background:
      "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 9999,
  },

  modal: {
    background: "#fff",
    width: "100%",
    maxWidth: "650px",
    maxHeight: "80vh",
    overflowY: "auto",
    borderRadius: "16px",
    padding: "25px",
    boxSizing: "border-box",
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.25)",
  },

  modalHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },

  closeButton: {
    border: "none",
    background: "#f3f4f6",
    width: "35px",
    height: "35px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "16px",
  },

  historyItem: {
    border:
      "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "15px",
    marginBottom: "10px",
    background: "#fafafa",
  },

  historyTop: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "4px",
    fontSize: "15px",
  },

  oldStatus: {
    color: "#6b7280",
    fontWeight: 600,
  },

  arrow: {
    color: "#9ca3af",
    fontWeight: 700,
    margin: "0 5px",
  },

  newStatus: {
    color: "#2563eb",
    fontWeight: 700,
  },

  historyDate: {
    marginTop: "8px",
    color: "#666",
    fontSize: "13px",
  },

  historyNumber: {
    marginTop: "5px",
    color: "#999",
    fontSize: "12px",
  },

  historyEmpty: {
    textAlign: "center",
    padding: "40px 10px",
    color: "#777",
  },
};

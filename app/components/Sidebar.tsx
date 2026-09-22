"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function Sidebar() {
  const router = useRouter();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-title">OfficeFlow</div>
        <div className="logo-subtitle">Pro</div>
      </div>

      <nav className="sidebar-menu">
        <Link href="/dashboard">🏠 Dashboard</Link>
        <Link href="/employees">👥 Employees</Link>
        <Link href="/tasks">📋 Tasks</Link>
        <Link href="/reports">📊 Reports</Link>
        <Link href="/accounts">
  💰 Client Accounts
</Link>
        <Link href="/money-out">
  💸 Money Out
</Link>
      </nav>

      <div className="sidebar-bottom">
        <div className="admin-profile">
          <div className="admin-icon">👤</div>
          <div>
            <strong>Admin</strong>
            <small>Administrator</small>
          </div>
        </div>

        <button onClick={logout} className="logout-btn">
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}

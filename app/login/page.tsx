"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    // Check Admin role
    const { data: role, error: roleError } =
      await supabase.rpc("get_my_role");

    if (roleError || role !== "admin") {
      await supabase.auth.signOut();
      setError("Admin access required.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    setLoading(false);
  }

  return (
    <main className="login">
      <section className="loginbox">
        <h1 className="title">OfficeFlow Pro</h1>

        <p className="muted">
          Office Task & Delivery Management
        </p>

        <form className="form" onSubmit={submit}>
          {error && <div className="error">{error}</div>}

          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button className="btn" disabled={loading}>
            {loading ? "Checking..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

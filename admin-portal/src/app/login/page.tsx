"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { LogIn, PawPrint } from "lucide-react";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@pawplan.com");
  const [password, setPassword] = useState("Password@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const session = await api.loginAdmin(email, password);
      saveSession(session);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand" style={{ color: "var(--text)", marginBottom: 12 }}>
          <PawPrint size={28} />
          PawPlan Admin
        </div>
        <p className="subtle" style={{ marginTop: 0 }}>
          Manage courses, training goals, breeds, and daily quotes.
        </p>
        <form className="form" onSubmit={submit}>
          {error ? <div className="error">{error}</div> : null}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              className="input"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              className="input"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </div>
          <button className="button" disabled={loading} type="submit">
            <LogIn size={18} />
            {loading ? "Signing in" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

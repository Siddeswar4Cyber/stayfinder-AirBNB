"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { api, type SessionUser } from "../../lib/api";
import { useFavorites } from "../../components/FavoritesProvider";

export default function Login() {
  const router = useRouter();
  const { refreshFavorites } = useFavorites();
  const [mode, setMode] = useState<"login" | "register">("login"), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const path = mode === "login" ? "/auth/login" : "/auth/register";
      await api<{ user: SessionUser }>(path, { method: "POST", body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password"), role: form.get("role") || "guest" }) });
      await refreshFavorites();
      const returnTo = new URLSearchParams(window.location.search).get("returnTo") || "/";
      router.push(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/");
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <main id="main-content"><Header /><section className="auth"><p className="eyebrow">YOUR STAYFINDER ACCOUNT</p><h1>{mode === "login" ? "Welcome back." : "Join StayFinder."}</h1><form onSubmit={submit}>
    {mode === "register" && <><label>NAME<input name="name" autoComplete="name" required maxLength={120} /></label><label>ACCOUNT TYPE<select name="role"><option value="guest">Guest</option><option value="host">Host (approval required)</option></select></label></>}
    <label>EMAIL<input type="email" name="email" autoComplete="email" required maxLength={254} /></label>
    <label>PASSWORD<input type="password" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "login" ? 1 : 12} maxLength={128} /></label>
    {error && <p role="alert" className="notice">{error}</p>}<button disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
    </form><button className="linkbutton" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>{mode === "login" ? "Create an account" : "I already have an account"}</button><p className="demo">Local demo accounts are documented in the project README.</p></section></main>;
}

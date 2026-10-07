"use client";
import { useEffect, useState } from "react"; import Header from "../../components/Header"; import { api } from "../../lib/api";
type Application = { id: number; name: string; email: string; status: string; created_at: string };
export default function Admin() { const [rows, setRows] = useState<Application[]>([]), [error, setError] = useState("");
  async function load() { try { setRows(await api<Application[]>("/admin/host-applications?status=pending")); } catch (e) { setError((e as Error).message); } } useEffect(() => { load(); }, []);
  async function decide(id: number, approve: boolean) { try { await api(`/admin/host-applications/${id}/decision?approve=${approve}`, { method: "POST" }); load(); } catch (e) { setError((e as Error).message); } }
  return <main id="main-content"><Header /><section className="content"><p className="eyebrow">LIMITED ADMIN</p><h1>Host applications</h1>{error && <p className="notice" role="alert">{error}</p>}{rows.length ? rows.map(r => <div className="adminrow" key={r.id}><div><b>{r.name}</b><span>{r.email} · submitted {r.created_at.slice(0, 10)}</span></div><button type="button" onClick={() => decide(r.id, true)}>Approve</button><button type="button" className="secondary" onClick={() => decide(r.id, false)}>Reject</button></div>) : <div className="empty">No pending applications.</div>}</section></main>;
}

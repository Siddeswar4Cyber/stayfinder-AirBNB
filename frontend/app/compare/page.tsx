"use client";
import { useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import { api, type Listing } from "../../lib/api"; import { handleImageFallback } from "../../lib/images";

export default function Compare() {
  const [ids, setIds] = useState(""), [rows, setRows] = useState<Listing[]>([]), [error, setError] = useState("");
  async function compare(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const values = [...new Set(ids.split(",").map(value => value.trim()).filter(Boolean))];
    if (!values.length || values.length > 4 || values.some(value => !/^\d+$/.test(value))) { setError("Enter between one and four comma-separated listing IDs."); return; }
    try { setRows(await api<Listing[]>(`/listings/compare?ids=${values.join(",")}`)); }
    catch (e) { setError((e as Error).message); }
  }
  return <main id="main-content"><Header /><section className="content"><p className="eyebrow">COMPARE STAYS</p><h1>Choose a good fit.</h1><form className="booking" onSubmit={compare} style={{ maxWidth: 620 }}><label>LISTING IDS<input value={ids} onChange={e => setIds(e.target.value)} placeholder="For example: 1, 2, 3" /></label><button>Compare</button></form>{error && <p role="alert" className="notice">{error}{error === "Authentication required" && <> <Link href="/login?returnTo=/compare">Log in →</Link></>}</p>}<div className="grid comparegrid">{rows.map(row => <article className="booking" key={row.id}><img className="detailimage" src={row.image} alt={`${row.title} in ${row.destination}`} onError={event => handleImageFallback(event, `listing-${row.id}`)} /><h2>{row.title}</h2><p>{row.destination} · {row.category}</p><p>₹{Number(row.price).toLocaleString()} / night</p><p>{row.capacity} guests · {row.bedrooms} bedrooms · {row.bathrooms} bathrooms</p><p>Host: {row.host_name || "StayFinder host"}</p><p>{row.amenities.join(" · ")}</p></article>)}</div></section></main>;
}

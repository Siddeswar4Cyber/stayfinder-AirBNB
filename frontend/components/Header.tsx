"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useFavorites } from "./FavoritesProvider";

export default function Header() {
  const router = useRouter();
  const { refreshFavorites } = useFavorites();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => { api("/auth/me").then(() => setSignedIn(true)).catch(() => setSignedIn(false)); }, []);
  async function logout() {
    try { await api("/auth/logout", { method: "POST" }); } finally { setSignedIn(false); await refreshFavorites(); router.push("/"); router.refresh(); }
  }
  return <header><Link className="brand" href="/" aria-label="StayFinder home"><img src="/stayfinder-logo.png" alt="StayFinder — Your Home" /></Link><nav aria-label="Main navigation"><Link href="/">Explore</Link><Link href="/trips">My trips</Link><Link href="/favorites">Wishlist</Link><Link href="/host">Host</Link>{signedIn ? <button className="navbutton" type="button" onClick={logout}>Log out</button> : <Link className="login" href="/login">Log in</Link>}</nav></header>;
}

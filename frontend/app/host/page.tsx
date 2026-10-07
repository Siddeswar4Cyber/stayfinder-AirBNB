"use client";

import { useCallback, useEffect, useState } from "react";
import Header from "../../components/Header";
import { api, type Listing, type Trip } from "../../lib/api";

type ListingForm = {
  title: string;
  description: string;
  destination: string;
  latitude: number | null;
  longitude: number | null;
  price: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  category: string;
  image: string;
  amenities: string[];
};

const AMENITY_OPTIONS = ["Wi-Fi", "Kitchen", "Air conditioning", "Workspace", "Step-free access", "Free parking", "Balcony", "Breakfast", "Pool", "Pet-friendly"];
const EMPTY_FORM: ListingForm = {
  title: "", description: "", destination: "Goa", latitude: null, longitude: null, price: 2500, capacity: 2,
  bedrooms: 1, bathrooms: 1, category: "City", image: "", amenities: [],
};

export default function Host() {
  const [items, setItems] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Trip[]>([]);
  const [form, setForm] = useState<ListingForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const [listings, hostBookings] = await Promise.all([
        api<Listing[]>("/host/listings"),
        api<Trip[]>("/host/bookings"),
      ]);
      setItems(listings);
      setBookings(hostBookings);
      setMessage("");
      return true;
    } catch (cause) {
      setMessage((cause as Error).message);
      return false;
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function update<K extends keyof ListingForm>(key: K, value: ListingForm[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  function toggleAmenity(amenity: string) {
    const amenities = form.amenities.includes(amenity)
      ? form.amenities.filter(value => value !== amenity)
      : [...form.amenities, amenity];
    update("amenities", amenities);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if ((form.latitude === null) !== (form.longitude === null)) {
      setMessage("Enter both latitude and longitude, or leave both blank.");
      return;
    }
    try {
      if (editing !== null) {
        await api(`/host/listings/${editing}`, { method: "PATCH", body: JSON.stringify(form) });
      } else {
        await api("/host/listings", { method: "POST", body: JSON.stringify(form) });
      }
      setForm(EMPTY_FORM);
      setEditing(null);
      if (await load()) setMessage("Listing saved.");
    } catch (cause) {
      setMessage((cause as Error).message);
    }
  }

  async function remove(id: number) {
    setMessage("");
    try {
      await api(`/host/listings/${id}`, { method: "DELETE" });
      if (await load()) setMessage("Listing deleted.");
    } catch (cause) {
      setMessage((cause as Error).message);
    }
  }

  function edit(item: Listing) {
    setEditing(item.id);
    setForm({ ...EMPTY_FORM, ...item, latitude: item.latitude ?? null, longitude: item.longitude ?? null, amenities: [...item.amenities] });
    setMessage("");
  }

  function cancelEdit() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setMessage("");
  }

  return (
    <main id="main-content">
      <Header />
      <section className="content">
        <p className="eyebrow">HOST DASHBOARD</p>
        <h1>Share your space.</h1>
        <div className="dashboardgrid">
          <form className="booking host-form" onSubmit={save}>
            <h2>{editing !== null ? "Edit listing" : "Create listing"}</h2>
            <label>TITLE<input required minLength={3} maxLength={200} value={form.title} onChange={event => update("title", event.target.value)} /></label>
            <label>DESTINATION<input required minLength={2} maxLength={120} value={form.destination} onChange={event => update("destination", event.target.value)} /></label>
            <label>LATITUDE<input type="number" min="-90" max="90" step="any" value={form.latitude ?? ""} onChange={event => update("latitude", event.target.value === "" ? null : Number(event.target.value))} placeholder="Optional, e.g. 15.4909" /></label>
            <label>LONGITUDE<input type="number" min="-180" max="180" step="any" value={form.longitude ?? ""} onChange={event => update("longitude", event.target.value === "" ? null : Number(event.target.value))} placeholder="Optional, e.g. 73.8278" /></label>
            <p className="host-coordinate-help">Enter both coordinates to show this listing on the map. Coordinates are stored with the listing and can be found from your property’s map pin.</p>
            <label>DESCRIPTION<textarea maxLength={5000} value={form.description} onChange={event => update("description", event.target.value)} /></label>
            <label>MAIN PHOTO URL<input type="url" value={form.image} onChange={event => update("image", event.target.value)} placeholder="https://images.unsplash.com/..." /></label>
            <label>NIGHTLY PRICE<input type="number" min="1" max="1000000" value={form.price} onChange={event => update("price", Number(event.target.value))} required /></label>
            <label>GUEST CAPACITY<input type="number" min="1" max="100" value={form.capacity} onChange={event => update("capacity", Number(event.target.value))} required /></label>
            <label>BEDROOMS<input type="number" min="1" max="100" value={form.bedrooms} onChange={event => update("bedrooms", Number(event.target.value))} required /></label>
            <label>BATHROOMS<input type="number" min="1" max="100" value={form.bathrooms} onChange={event => update("bathrooms", Number(event.target.value))} required /></label>
            <label>PROPERTY TYPE<input required minLength={2} maxLength={80} value={form.category} onChange={event => update("category", event.target.value)} /></label>
            <fieldset className="amenity-options"><legend>AMENITIES</legend>{AMENITY_OPTIONS.map(amenity => <label key={amenity}><input type="checkbox" checked={form.amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} />{amenity}</label>)}</fieldset>
            <button type="submit">{editing !== null ? "Save changes" : "Create listing"}</button>
            {editing !== null && <button type="button" className="secondary" onClick={cancelEdit}>Cancel edit</button>}
            {message && <p className="notice" role="status">{message}</p>}
          </form>

          <div className="host-overview">
            <h2>Your listings</h2>
            {items.length ? items.map(item => <div className="adminrow" key={item.id}>
              <div><b>{item.title}</b><span>{item.destination} · ₹{Number(item.price).toLocaleString()}/night</span></div>
              <button type="button" className="smallbutton" onClick={() => edit(item)}>Edit</button>
              <button type="button" className="smallbutton danger" onClick={() => void remove(item.id)}>Delete</button>
            </div>) : <div className="empty">No listings yet.</div>}
            <h2>Bookings for your listings</h2>
            {bookings.length ? bookings.map(booking => <div className="adminrow" key={booking.id}>
              <div><b>{booking.title}</b><span>{booking.check_in} {booking.check_in_time || "15:00"} → {booking.check_out} {booking.check_out_time || "11:00"} · {booking.status}</span></div>
            </div>) : <div className="empty">No bookings yet.</div>}
          </div>
        </div>
      </section>
    </main>
  );
}

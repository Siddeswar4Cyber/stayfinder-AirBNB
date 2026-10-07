"use client";

import { useState } from "react";

type SearchFilters = Record<string, string | string[]>;

const STYLES = ["Beach", "City", "Nature", "Family", "Luxury"];
const AMENITIES = ["Wi-Fi", "Kitchen", "Pool", "Free parking", "Pet-friendly"];

function optionId(group: string, value: string) {
  return `${group}-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value];
}

export default function SearchForm({ onSearch }: { onSearch: (query: SearchFilters) => void }) {
  const [destination, setDestination] = useState("");
  const [keyword, setKeyword] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [styles, setStyles] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [error, setError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (Boolean(checkIn) !== Boolean(checkOut)) {
      setError("Choose both check-in and check-out dates.");
      return;
    }
    if (checkIn && checkOut && checkOut <= checkIn) {
      setError("Check-out must be after check-in.");
      return;
    }
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      setError("Minimum price cannot exceed maximum price.");
      return;
    }

    const query: SearchFilters = { guests };
    const optionalFilters: Record<string, string> = {
      destination: destination.trim(),
      search: keyword.trim(),
      check_in: checkIn,
      check_out: checkOut,
      min_price: minPrice,
      max_price: maxPrice,
    };
    for (const [key, value] of Object.entries(optionalFilters)) {
      if (value) query[key] = value;
    }
    if (styles.length) query.styles = styles;
    if (amenities.length) query.amenities = amenities;
    onSearch(query);
  }

  function clearFilters() {
    setDestination("");
    setKeyword("");
    setCheckIn("");
    setCheckOut("");
    setGuests("1");
    setStyles([]);
    setMinPrice("");
    setMaxPrice("");
    setAmenities([]);
    setError("");
    onSearch({});
  }

  return (
    <form className="searchbox searchbox-wide" onSubmit={submit}>
      <label className="destination-field">DESTINATION<input value={destination} onChange={event => setDestination(event.target.value)} placeholder="Where to?" /></label>
      <details className="filter-panel">
        <summary>Filters <span>Dates, guests, price, style and amenities</span></summary>
        <div className="filter-fields">
          <label>PROPERTY NAME OR DESCRIPTION<input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="Beach, garden…" /></label>
          <label>CHECK IN<input type="date" value={checkIn} onChange={event => setCheckIn(event.target.value)} /></label>
          <label>CHECK OUT<input type="date" value={checkOut} min={checkIn || undefined} onChange={event => setCheckOut(event.target.value)} /></label>
          <label>GUESTS<input type="number" min="1" max="100" value={guests} onChange={event => setGuests(event.target.value)} required /></label>
          <label>MINIMUM PRICE<input type="number" min="0" step="1" value={minPrice} onChange={event => setMinPrice(event.target.value)} placeholder="No minimum" /></label>
          <label>MAXIMUM PRICE<input type="number" min="0" step="1" value={maxPrice} onChange={event => setMaxPrice(event.target.value)} placeholder="No maximum" /></label>
          <fieldset className="search-checkbox-group">
            <legend>STYLE</legend>
            {STYLES.map(value => {
              const id = optionId("style", value);
              return <div className="search-checkbox-option" key={value}><input id={id} type="checkbox" checked={styles.includes(value)} onChange={() => setStyles(current => toggleValue(current, value))} /><label htmlFor={id}>{value}</label></div>;
            })}
          </fieldset>
          <fieldset className="search-checkbox-group">
            <legend>AMENITIES</legend>
            {AMENITIES.map(value => {
              const id = optionId("amenity", value);
              return <div className="search-checkbox-option" key={value}><input id={id} type="checkbox" checked={amenities.includes(value)} onChange={() => setAmenities(current => toggleValue(current, value))} /><label htmlFor={id}>{value}</label></div>;
            })}
          </fieldset>
        </div>
      </details>
      <div className="search-actions">
        <button type="submit">Search stays</button>
        <button type="button" className="clear-filters" onClick={clearFilters}>Clear filters</button>
      </div>
      {error && <p className="search-error" role="alert">{error}</p>}
    </form>
  );
}

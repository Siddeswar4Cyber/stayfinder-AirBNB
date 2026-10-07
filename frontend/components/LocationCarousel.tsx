"use client";
import { useEffect, useState } from "react";
import ListingCard from "./ListingCard";
import type { Listing } from "../lib/api";

export default function LocationCarousel({ destination, items }: { destination: string; items: Listing[] }) {
  const [active, setActive] = useState(0);
  const [pointerInside, setPointerInside] = useState(false);
  const [columns, setColumns] = useState(3);
  const orderedItems = items;
  const maxActive = Math.max(0, orderedItems.length - columns);
  const gap = columns === 2 ? 12 : 16;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1000px)");
    const updateColumns = () => setColumns(media.matches ? 2 : 3);
    updateColumns();
    media.addEventListener("change", updateColumns);
    return () => media.removeEventListener("change", updateColumns);
  }, []);

  useEffect(() => setActive(0), [items, columns]);

  useEffect(() => {
    if (!pointerInside || maxActive < 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setActive(index => index >= maxActive ? 0 : index + 1), 3000);
    return () => window.clearInterval(timer);
  }, [pointerInside, maxActive]);

  function moveBy(offset: number) {
    setActive(index => (index + offset + maxActive + 1) % (maxActive + 1));
  }

  return <section className="location-panel" aria-label={`${destination} stays`}
    onMouseEnter={() => setPointerInside(true)} onMouseLeave={() => setPointerInside(false)}>
    <div className="location-heading"><h3>{destination}</h3><span>{orderedItems.length} {orderedItems.length === 1 ? "stay" : "stays"}</span></div>
    <div className="location-carousel" aria-roledescription="carousel" aria-label={`${destination} places`}>
      <div className="location-carousel-track" style={{ transform: `translateX(calc(-${active * (100 / columns)}% - ${active * gap / columns}px))` }}>
        {orderedItems.map((item, index) => <div className="location-carousel-slide" key={item.id} aria-hidden={index < active || index >= active + columns} inert={index < active || index >= active + columns}>
          <ListingCard item={item} />
        </div>)}
      </div>
    </div>
    {maxActive > 0 && <div className="carousel-controls">
      <button type="button" className="carousel-arrow" aria-label={`Previous ${destination} stay`} onClick={() => moveBy(-1)}>←</button>
      <span aria-label={`Showing stays ${active + 1} through ${Math.min(active + columns, orderedItems.length)} of ${orderedItems.length}`}>{active + 1}–{Math.min(active + columns, orderedItems.length)} / {orderedItems.length}</span>
      <button type="button" className="carousel-arrow" aria-label={`Next ${destination} stay`} onClick={() => moveBy(1)}>→</button>
    </div>}
  </section>;
}

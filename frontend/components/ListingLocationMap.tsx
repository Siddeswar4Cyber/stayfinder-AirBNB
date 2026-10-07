"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { Listing } from "../lib/api";

type Props = { listing: Listing };
type MappableListing = Listing & { latitude: number; longitude: number };

function hasCoordinates(listing: Listing): listing is MappableListing {
  return typeof listing.latitude === "number" && Number.isFinite(listing.latitude)
    && typeof listing.longitude === "number" && Number.isFinite(listing.longitude)
    && listing.latitude >= -90 && listing.latitude <= 90
    && listing.longitude >= -180 && listing.longitude <= 180;
}

export default function ListingLocationMap({ listing }: Props) {
  if (!hasCoordinates(listing)) {
    return (
      <div className="detail-map-unavailable" role="status">
        <b>Approximate location</b>
        <span>{listing.destination}</span>
        <small>A map pin isn’t available for this stay yet.</small>
      </div>
    );
  }

  return (
    <MapContainer
      center={[listing.latitude, listing.longitude]}
      zoom={13}
      scrollWheelZoom
      className="detail-listing-map"
      aria-label={`Map showing the approximate location of ${listing.title} in ${listing.destination}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <CircleMarker
        center={[listing.latitude, listing.longitude]}
        radius={11}
        pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#1d6f64", fillOpacity: 1 }}
      >
        <Popup>
          <strong>{listing.title}</strong><br />
          {listing.destination} · Approximate location
        </Popup>
      </CircleMarker>
    </MapContainer>
  );
}

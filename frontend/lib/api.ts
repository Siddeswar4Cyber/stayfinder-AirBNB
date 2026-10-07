export const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

export type Listing = {
  id: number; title: string; description: string; destination: string; price: number;
  latitude?: number | null; longitude?: number | null;
  capacity: number; bedrooms: number; bathrooms: number; category: string; rating: number;
  image: string; amenities: string[]; host_name?: string;
  booking_count?: number; review_count?: number;
  photos?: { id: number; image_url: string; sort_order: number; alt_text: string }[];
};
export type Trip = {
  id: number; listing_id: number; title: string; destination: string; image: string; check_in: string;
  check_out: string; check_in_time?: string; check_out_time?: string; guests: number; status: string; total: number; price: number; nights: number;
  subtotal: number; cleaning_fee: number; service_fee: number;
};
export type SessionUser = { id: string; name: string; email: string; role: string; host_status: string };

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API}${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    credentials: "include",
    headers,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof body.detail === "string" ? body.detail : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

// Authentication is held in an HttpOnly cookie; the browser cannot inspect it.
// Returning true lets protected pages ask the API and handle a 401 response.

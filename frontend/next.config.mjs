const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (process.env.APP_ENV === "production") {
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL must be set when APP_ENV=production");
  }

  let parsedApiUrl;
  try {
    parsedApiUrl = new URL(apiBaseUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_API_URL must be an absolute HTTPS URL ending in /api");
  }

  if (
    parsedApiUrl.protocol !== "https:" ||
    parsedApiUrl.pathname.replace(/\/+$/, "") !== "/api" ||
    parsedApiUrl.username ||
    parsedApiUrl.password ||
    parsedApiUrl.search ||
    parsedApiUrl.hash
  ) {
    throw new Error("NEXT_PUBLIC_API_URL must be an HTTPS origin followed by /api, without credentials or query parameters");
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
};

export default nextConfig;

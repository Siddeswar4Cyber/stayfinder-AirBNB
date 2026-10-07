import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { FavoritesProvider } from "../components/FavoritesProvider";
export const metadata: Metadata={title:"StayFinder | memorable stays",description:"A local-first stays marketplace demo"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a><FavoritesProvider>{children}</FavoritesProvider></body></html>}

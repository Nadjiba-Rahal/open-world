import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Afterlight", description: "A stylized multiplayer 3D fantasy world." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

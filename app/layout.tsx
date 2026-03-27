import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ReelCraft – AI Instagram Reel Editor",
  description: "Upload a video, apply Reels templates, get AI music suggestions from Pixabay. Deploy free on Vercel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Youth India Khobar - Minutes",
  description: "Official Meeting Minutes for Marwa Circle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use a fallback to prevent the build from crashing
  // Vercel build environment sometimes hides these from static workers
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

  if (!publishableKey && process.env.NODE_ENV === "production") {
    // This logs to your Vercel build logs so you can verify it's missing
    console.warn("⚠️ Clerk Publishable Key missing during build. Ensure it is set in Vercel Settings.");
  }

  return (
    // Providing the key prop directly is correct, but we add 'dynamic' 
    // to help Clerk handle static generation better.
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <header className="flex justify-between items-center p-4 border-b bg-white">
            <h1 className="font-bold text-lg text-blue-600">YI Minutes</h1>
            <div>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">Login</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton showName />
              </SignedIn>
            </div>
          </header>
          <main className="min-h-screen bg-gray-50">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
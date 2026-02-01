import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define which routes need protection (all of them in this case)
const isProtectedRoute = createRouteMatcher(['/']);

// 🛑 ADD YOUR AUTHORIZED EMAILS HERE
const ALLOWED_EMAILS = [
  "rashadnazer@gmail.com", 
];

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { sessionClaims } = await auth();
    const userEmail = (sessionClaims as any)?.email;

    // 1. Force them to log in if they haven't
    await auth.protect();

    // 2. Once logged in, check their email
    if (!ALLOWED_EMAILS.includes(userEmail)) {
      return new NextResponse(
        "Access Denied: You are not authorized to view the Minutes App. Please contact the Admin.", 
        { status: 403 }
      );
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
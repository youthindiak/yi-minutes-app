// proxy.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(['/']);
const ALLOWED_EMAILS = ["rashadnazer7@gmail.com"];

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // Force login first
    const { sessionClaims } = await auth();
    const userEmail = (sessionClaims as any)?.email;

    await auth.protect();

    if (!ALLOWED_EMAILS.includes(userEmail)) {
      return new NextResponse(
        "Access Denied: You are not authorized to view the Minutes App.", 
        { status: 403 }
      );
    }
  }
});

// Important: This remains the same
export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
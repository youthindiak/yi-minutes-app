// app/not-found.tsx
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
}
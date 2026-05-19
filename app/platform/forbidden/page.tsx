import Link from "next/link";

export const metadata = { title: "Access Denied — EasySlip Platform" };

export default function PlatformForbiddenPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-gray-950 text-white px-6">
      <div className="text-center space-y-4">
        <p className="font-mono text-6xl font-bold text-gray-600">403</p>
        <h1 className="text-xl font-semibold">Access Denied</h1>
        <p className="text-sm text-gray-400">Your account does not have permission to view this page.</p>
        <Link href="/signin" className="inline-block mt-4 text-sm text-blue-400 underline">
          Sign in with a different account
        </Link>
      </div>
    </main>
  );
}

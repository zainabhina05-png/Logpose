import { AuthForm } from "@/components/AuthForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="font-display text-3xl font-bold text-brass mb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass rounded">
        Log Pose
      </Link>
      <p className="text-parchment/60 mb-8">Welcome back, Captain</p>
      <AuthForm mode="login" />
    </main>
  );
}

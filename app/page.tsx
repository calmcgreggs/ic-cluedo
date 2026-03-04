import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/protected/profile");
  }
  return (
    <main className="min-h-[85vh] bg-gradient-to-b from-background to-muted/30">
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-6 py-20 text-center">
        <span className="mb-4 inline-flex items-center rounded-full border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          🎯 Human Cluedo
        </span>
        <Image
          src="/logo-ic.png"
          alt="IC Cluedo Logo"
          width={240}
          height={240}
        />

        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Welcome to <span className="text-primary">IC Cluedo</span>
        </h1>

        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Sign up, get your target, and play strategically. Stay alive,
          eliminate your mark, and outlast everyone else.
        </p>

        <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/auth/sign-up"
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 sm:w-auto"
          >
            Sign Up
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex w-full items-center justify-center rounded-md border bg-background px-6 py-2.5 text-sm font-medium transition hover:bg-muted sm:w-auto"
          >
            Log In
          </Link>
        </div>

        <div className="mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold">1. Join</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create an account and enter the game.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold">2. Receive Mission</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Get your target, weapon, and location.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold">3. Survive</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Eliminate smartly and avoid being eliminated.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

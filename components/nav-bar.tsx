"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function NavBar() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  async function getAuthEmail() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setEmail(user?.email ?? null);
  }

  useEffect(() => {
    getAuthEmail();
  }, [supabase]);

  useEffect(() => {
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(Boolean(session?.user));
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <header className="w-full border-b">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/protected/profile"
          className="text-base font-semibold sm:text-lg"
        >
          IC Cluedo
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            {email === process.env.NEXT_PUBLIC_AUTH_EMAIL && (
              <Button asChild size="sm" variant="outline">
                <Link href="/admin">Admin</Link>
              </Button>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href="/protected/profile">Profile</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                }}
              >
                Sign Out
              </button>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" variant="default">
              <Link href="/auth/sign-up">Sign up</Link>
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}

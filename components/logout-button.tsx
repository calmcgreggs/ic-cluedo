"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    try {
      setIsLoggingOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button onClick={logout} loading={isLoggingOut}>
      Logout
    </Button>
  );
}

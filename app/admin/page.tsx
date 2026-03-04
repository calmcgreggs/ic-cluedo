"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  async function handleLoad() {
    const user = await supabase.auth.getUser();
    if (user.data.user?.email !== "calmcgregor48@gmail.com") {
      router.push("/");
    } else {
      setLoading(false);
    }
  }

  async function regenerateMissions() {
    const response = await fetch("/api/regenerate", {
      method: "PATCH",
    });

    if (!response.ok) {
      alert("Failed to regenerate missions. Please try again.");
      return;
    }
  }

  async function generateNewGame() {
    const response = await fetch("/api/new_game", {
      method: "PATCH",
    });

    if (!response.ok) {
      alert("Failed to generate new game. Please try again.");
      return;
    }
  }

  async function deleteData() {
    const response = await fetch("/api/delete_data", {
      method: "DELETE",
    });

    console.log(response);

    if (!response.ok) {
      alert("Failed to delete data. Please try again.");
      return;
    }
  }

  useEffect(() => {
    handleLoad();
  }, []);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col w-fit mx-auto gap-4 py-10 px-2">
        <h1 className="text-2xl font-bold">Admin Page</h1>
        <p>Welcome to the admin page. Here you can manage your application.</p>
        <Button variant="secondary" className="" onClick={regenerateMissions}>
          Regenerate Murder List
        </Button>
        <Button variant="destructive" className="" onClick={generateNewGame}>
          Restart Game
        </Button>
        <Button variant="outline" className="" onClick={deleteData}>
          Delete All Data
        </Button>
      </div>
    );
  }
}

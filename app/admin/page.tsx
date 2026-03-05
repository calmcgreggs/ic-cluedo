"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenTourLoading, setRegenTourLoading] = useState(false);
  const [regenNightLoading, setRegenNightLoading] = useState(false);
  const [newGameTourLoading, setNewGameTourLoading] = useState(false);
  const [newGameNightLoading, setNewGameNightLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleLoad() {
    const user = await supabase.auth.getUser();
    if (user.data.user?.email !== "calmcgregor48@gmail.com") {
      router.push("/");
    } else {
      setLoading(false);
    }
  }

  async function regenerateMissions() {
    try {
      setRegenLoading(true);
      const response = await fetch("/api/regenerate", {
        method: "PATCH",
      });

      if (!response.ok) {
        alert("Failed to regenerate missions. Please try again.");
        return;
      }
    } finally {
      setRegenLoading(false);
    }
  }

  async function regenerateMissionsTour() {
    try {
      setRegenTourLoading(true);
      const response = await fetch("/api/regenerate?version=tour", {
        method: "PATCH",
      });

      if (!response.ok) {
        alert("Failed to regenerate (tour). Please try again.");
        return;
      }
    } finally {
      setRegenTourLoading(false);
    }
  }

  async function regenerateMissionsNight() {
    try {
      setRegenNightLoading(true);
      const response = await fetch("/api/regenerate?version=night", {
        method: "PATCH",
      });

      if (!response.ok) {
        alert("Failed to regenerate (night out). Please try again.");
        return;
      }
    } finally {
      setRegenNightLoading(false);
    }
  }

  async function generateNewGame() {
    try {
      setNewGameNightLoading(true);
      const response = await fetch("/api/new_game?version=night", {
        method: "PATCH",
      });

      if (!response.ok) {
        alert("Failed to generate new game (night out). Please try again.");
        return;
      }
    } finally {
      setNewGameNightLoading(false);
    }
  }

  async function generateNewGameTour() {
    try {
      setNewGameTourLoading(true);
      const response = await fetch("/api/new_game?version=tour", {
        method: "PATCH",
      });

      if (!response.ok) {
        alert("Failed to generate new game (tour). Please try again.");
        return;
      }
    } finally {
      setNewGameTourLoading(false);
    }
  }

  async function deleteData() {
    try {
      setDeleteLoading(true);
      const response = await fetch("/api/delete_data", {
        method: "DELETE",
      });

      console.log(response);

      if (!response.ok) {
        alert("Failed to delete data. Please try again.");
        return;
      }
    } finally {
      setDeleteLoading(false);
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
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="secondary"
            className=""
            onClick={regenerateMissionsTour}
            loading={regenTourLoading}
          >
            Regenerate (tour version)
          </Button>

          <Button
            variant="secondary"
            className=""
            onClick={regenerateMissionsNight}
            loading={regenNightLoading}
          >
            Regenerate (night out version)
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            className=""
            onClick={generateNewGameTour}
            loading={newGameTourLoading}
          >
            Restart Game (tour version)
          </Button>

          <Button
            variant="destructive"
            className=""
            onClick={generateNewGame}
            loading={newGameNightLoading}
          >
            Restart Game (night out version)
          </Button>
        </div>
        <Button
          variant="outline"
          className=""
          onClick={deleteData}
          loading={deleteLoading}
        >
          Delete All Data And Users
        </Button>
      </div>
    );
  }
}

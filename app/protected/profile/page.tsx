"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  target: string | null;
  weapon: string | null;
  location: string | null;
  alive: boolean | null;
  killed_ids: string[] | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [id, setID] = useState("");
  const [confirmingKill, setConfirmingKill] = useState(false);
  const [gameData, setGameData] = useState<ProfileRow[] | null>(null);
  const [targetProfile, setTargetProfile] = useState<ProfileRow | null>(null);

  async function handleKill() {
    if (!profile) return;
    const response = await fetch("/api/profile", {
      method: "PATCH",
    });

    const result = (await response.json()) as {
      profile?: ProfileRow;
      killedUserId?: string;
      error?: string;
    };

    if (!response.ok || !result.profile) {
      alert(result.error ?? "Failed to confirm kill. Please try again.");
      return;
    }

    alert("Kill confirmed successfully.");
    setProfile(result.profile);
    setGameData((prev) =>
      prev
        ? prev.map((row) =>
            row.user_id === id
              ? { ...row, ...result.profile }
              : row.user_id === result.killedUserId
                ? {
                    ...row,
                    alive: false,
                    target: null,
                    weapon: null,
                    location: null,
                  }
                : row,
          )
        : prev,
    );
    setConfirmingKill(false);
  }

  function lastOneAlive() {
    if (!gameData || !profile) return false;
    const alivePlayers = gameData.filter((row) => row.alive);
    return (
      alivePlayers.length === 1 && alivePlayers[0].user_id === profile.user_id
    );
  }

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setID(user?.id ?? "");

      if (!user) {
        if (isMounted) {
          setRedirecting(true);
          setLoading(false);
          router.push("/auth/login");
        }
        return;
      }

      const { data, error } = await supabase.from("game").select("*");

      if (isMounted) {
        if (!error && data) {
          setGameData(data as ProfileRow[]);
          setProfile(data.find((row) => row.user_id === user.id) ?? null);
        }
        setLoading(false);
      }
    };

    void fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  useEffect(() => {
    if (gameData) {
      setTargetProfile(
        gameData.find((row) => row.user_id === profile?.target) ?? null,
      );
    }
  }, [gameData, profile?.target]);

  if (loading || redirecting) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-8">
        <div className="rounded-xl border bg-card px-6 py-5 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            {redirecting ? "Redirecting..." : "Loading profile..."}
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">No profile found yet.</p>
          <p className="text-xs text-muted-foreground">ID: {id}</p>
        </div>
      </main>
    );
  }

  if (profile.alive === false) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">You are dead.</p>
          <Image
            src="/dead.gif"
            alt="You are dead"
            width={400}
            height={300}
            className="mx-auto"
          />
        </div>
      </main>
    );
  }

  if (lastOneAlive()) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Congratulations! You are the last one alive and have won the game!
          </p>
          <Image
            src="/winner.gif"
            alt="You are the winner"
            width={400}
            height={300}
            className="mx-auto"
          />
        </div>
      </main>
    );
  }

  if (profile.target === id) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Your target had to kill you before you could kill them. Please wait
            until the next game update to get a new challenge.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <header className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Review your current mission and status.
        </p>
      </header>

      <div className="space-y-4">
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Your Details</h2>
            <span className="rounded-full border px-2.5 py-1 text-xs font-medium">
              {profile.alive ? "Alive" : "Dead"}
            </span>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p className="rounded-md bg-muted/40 px-3 py-2">
              <span className="font-medium">Display Name:</span>{" "}
              {profile.display_name ?? "-"}
            </p>
            <p className="rounded-md bg-muted/40 px-3 py-2">
              <span className="font-medium">User ID:</span>{" "}
              <span className="text-muted-foreground">{profile.user_id}</span>
            </p>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Your Kills</h2>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-1">
            {profile.killed_ids && profile.killed_ids.length > 0 ? (
              profile.killed_ids.map((killedId) => {
                const killedProfile = gameData?.find(
                  (row) => row.user_id === killedId,
                );
                return (
                  <p
                    key={killedId}
                    className="rounded-md bg-muted/40 px-3 py-2"
                  >
                    {killedProfile?.display_name ?? killedId}
                  </p>
                );
              })
            ) : (
              <p className="rounded-md bg-muted/40 px-3 py-2">
                You haven&apos;t made any kills yet.
              </p>
            )}
          </div>
        </section>

        {!profile.target || !targetProfile ? (
          <div></div>
        ) : (
          <section className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold">Your Mission</h2>
            <div className="grid gap-3 text-sm sm:grid-cols-3">
              <p className="rounded-md bg-muted/40 px-3 py-2">
                <span className="font-medium">Target:</span>{" "}
                {targetProfile?.display_name ?? profile.target ?? "-"}
              </p>
              <p className="rounded-md bg-muted/40 px-3 py-2">
                <span className="font-medium">Weapon:</span>{" "}
                {profile.weapon ?? "-"}
              </p>
              <p className="rounded-md bg-muted/40 px-3 py-2">
                <span className="font-medium">Location:</span>{" "}
                {profile.location ?? "-"}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Confirm only after a valid elimination.
              </p>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={() => {
                  if (!confirmingKill) {
                    setConfirmingKill(true);
                    return;
                  }
                  void handleKill();
                }}
              >
                {confirmingKill ? "Are you sure?" : "Confirm Kill"}
              </Button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

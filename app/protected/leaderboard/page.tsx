"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type GameRow = {
  user_id: string;
  display_name: string | null;
  alive: boolean | null;
  killed_ids: string[] | null;
};

interface Player {
  id: string;
  name: string;
  killCount: number;
  isAlive: boolean;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchPlayers = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
          const gameData = data as GameRow[];
          const playerList: Player[] = gameData.map((row) => ({
            id: row.user_id,
            name: row.display_name ?? "Unknown",
            killCount: row.killed_ids?.length ?? 0,
            isAlive: row.alive ?? false,
          }));
          setPlayers(playerList);
        }
        setLoading(false);
      }
    };

    void fetchPlayers();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const alivePlayers = players
    .filter((p) => p.isAlive)
    .sort((a, b) => b.killCount - a.killCount);

  const deadPlayers = players
    .filter((p) => !p.isAlive)
    .sort((a, b) => b.killCount - a.killCount);

  const PlayerRow = ({ player, rank }: { player: Player; rank: number }) => (
    <div className="flex flex-col items-start justify-between gap-3 border-b pb-4 last:border-b-0 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-muted-foreground w-6">
          {rank}
        </span>
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              player.isAlive ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="font-medium text-sm sm:text-base">
            {player.name}
          </span>
        </div>
      </div>
      <Badge variant="secondary" className="px-3 py-1">
        {player.killCount} {player.killCount === 1 ? "kill" : "kills"}
      </Badge>
    </div>
  );

  if (loading || redirecting) {
    return (
      <main className="min-h-[85vh] bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <p className="text-muted-foreground">
          {redirecting ? "Redirecting..." : "Loading leaderboard..."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-[85vh] bg-gradient-to-b from-background to-muted/30">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-16 md:py-20">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Leaderboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-base">
            Total players: {players.length}
          </p>
        </div>

        {/* Alive Players */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <span className="h-3 w-3 rounded-full bg-green-500" />
              Still Alive
            </CardTitle>
            <CardDescription>
              {alivePlayers.length}{" "}
              {alivePlayers.length === 1 ? "player" : "players"} in the game
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alivePlayers.length > 0 ? (
              <div className="space-y-4">
                {alivePlayers.map((player, index) => (
                  <PlayerRow key={player.id} player={player} rank={index + 1} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                No players alive
              </p>
            )}
          </CardContent>
        </Card>

        {/* Eliminated Players */}
        <Card className="opacity-75">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <span className="h-3 w-3 rounded-full bg-red-500" />
              Eliminated
            </CardTitle>
            <CardDescription>
              {deadPlayers.length}{" "}
              {deadPlayers.length === 1 ? "player" : "players"} out
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deadPlayers.length > 0 ? (
              <div className="space-y-4">
                {deadPlayers.map((player, index) => (
                  <PlayerRow key={player.id} player={player} rank={index + 1} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                No eliminated players
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

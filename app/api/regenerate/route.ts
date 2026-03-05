import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import gameData from "@/data.json";
import tourData from "@/data-tour.json";

type GameRow = {
  user_id: string;
  target: string | null;
  weapon: string | null;
  location: string | null;
  killed_ids: string[] | null;
  alive: boolean | null;
};

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function buildAssignments(items: string[], count: number): string[] {
  const assignments: string[] = [];

  while (assignments.length < count) {
    assignments.push(...shuffleArray(items));
  }

  return assignments.slice(0, count);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const url = new URL(request.url);
  const version = url.searchParams.get("version") ?? "night";
  const chosenData = version === "tour" ? tourData : gameData;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: players, error: playersError } = await supabase
    .from("game")
    .select("user_id,display_name,target,weapon,location,killed_ids,alive")
    .order("user_id", { ascending: true });

  if (playersError || !players) {
    return NextResponse.json(
      { error: "Failed to load players" },
      { status: 500 },
    );
  }

  const alivePlayers = players.filter((player) => player.alive === true);

  if (alivePlayers.length < 3) {
    return NextResponse.json(
      { error: "Need at least 3 alive players to regenerate the game" },
      { status: 400 },
    );
  }

  const shuffledPlayers = shuffleArray(alivePlayers);
  const weaponAssignments = buildAssignments(
    chosenData.weapons,
    shuffledPlayers.length,
  );
  const locationAssignments = buildAssignments(
    chosenData.locations,
    shuffledPlayers.length,
  );

  const updates = shuffledPlayers.map((player, index) => {
    const target = shuffledPlayers[(index + 1) % shuffledPlayers.length];

    return {
      user_id: player.user_id,
      display_name: player.display_name,
      target: target.user_id,
      weapon: weaponAssignments[index],
      location: locationAssignments[index],
      alive: true,
      killed_ids: player.killed_ids ?? [],
    };
  });

  const updateResults = await Promise.all(
    updates.map(async (update) => {
      const { error } = await supabase
        .from("game")
        .update({
          target: update.target,
          weapon: update.weapon,
          location: update.location,
        })
        .eq("user_id", update.user_id);

      return { user_id: update.user_id, error };
    }),
  );

  const failedUpdates = updateResults.filter((result) => result.error);
  if (failedUpdates.length > 0) {
    return NextResponse.json(
      {
        error: "Failed to regenerate some players",
        failedUserIds: failedUpdates.map((entry) => entry.user_id),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "Game regenerated for alive players",
    playersInitialized: updates.length,
    assignments: updates,
  });
}

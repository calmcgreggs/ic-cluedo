import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import gameData from "@/data.json";

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

export async function PATCH() {
  const supabase = await createClient();

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

  if (players.length < 3) {
    return NextResponse.json(
      { error: "Need at least 3 players to avoid bicycles" },
      { status: 400 },
    );
  }

  const shuffledPlayers = shuffleArray(players);
  const weaponAssignments = buildAssignments(
    gameData.weapons,
    shuffledPlayers.length,
  );
  const locationAssignments = buildAssignments(
    gameData.locations,
    shuffledPlayers.length,
  );

  const updates = shuffledPlayers.map((player, index) => {
    const target = shuffledPlayers[(index + 1) % shuffledPlayers.length];

    return {
      user_id: player.user_id,
      target: target.user_id,
      weapon: weaponAssignments[index],
      location: locationAssignments[index],
      alive: true,
      killed_ids: [],
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
          alive: true,
          killed_ids: [],
        })
        .eq("user_id", update.user_id);

      return { user_id: update.user_id, error };
    }),
  );

  const failedUpdates = updateResults.filter((result) => result.error);
  if (failedUpdates.length > 0) {
    return NextResponse.json(
      {
        error: "Failed to initialize some players",
        failedUserIds: failedUpdates.map((entry) => entry.user_id),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "Game initialized",
    playersInitialized: updates.length,
    assignments: updates as GameRow[],
  });
}

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
    .select(
      "user_id,display_name,target,weapon,location,killed_ids,alive,kill_password",
    )
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
      target: target.user_id,
      weapon: weaponAssignments[index],
      location: locationAssignments[index],
      alive: true,
      killed_ids: [],
    };
  });

  // Assign a fresh password for EVERY player on a new game
  let passwordAssignments: Record<string, string> = {};
  const shuffledPasswords = shuffleArray(chosenData.passwords ?? []);
  // Expand shuffledPasswords to cover all players
  while (shuffledPasswords.length < updates.length) {
    shuffledPasswords.push(...shuffleArray(chosenData.passwords ?? []));
  }
  updates.forEach((u, i) => {
    passwordAssignments[u.user_id] = shuffledPasswords[i];
  });

  const updateResults = await Promise.all(
    updates.map(async (update) => {
      const passwordToSet = passwordAssignments[update.user_id] ?? null;

      const { error } = await supabase
        .from("game")
        .update({
          target: update.target,
          weapon: update.weapon,
          location: update.location,
          alive: true,
          killed_ids: [],
          // always set a fresh kill_password for a new game
          kill_password: passwordToSet,
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

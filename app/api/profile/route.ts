import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type GameRow = {
  user_id: string;
  target: string | null;
  weapon: string | null;
  location: string | null;
  killed_ids: string[] | null;
  alive: boolean | null;
};

export async function PATCH() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from("game")
    .select("user_id,target,weapon,location,killed_ids,alive")
    .eq("user_id", user.id)
    .single();

  if (currentProfileError || !currentProfile) {
    return NextResponse.json(
      { error: "Current profile not found" },
      { status: 404 },
    );
  }

  if (!currentProfile.target) {
    return NextResponse.json({ error: "No target assigned" }, { status: 400 });
  }

  const { data: targetProfile, error: targetProfileError } = await supabase
    .from("game")
    .select("user_id,target,weapon,location")
    .eq("user_id", currentProfile.target)
    .single();

  if (targetProfileError || !targetProfile) {
    return NextResponse.json(
      { error: "Target profile not found" },
      { status: 404 },
    );
  }

  const updatedKilledIds = [
    ...(currentProfile.killed_ids ?? []),
    targetProfile.user_id,
  ];

  const { data: updatedCurrentProfile, error: updateCurrentError } =
    await supabase
      .from("game")
      .update({
        killed_ids: updatedKilledIds,
        target: targetProfile.target,
        weapon: targetProfile.weapon,
        location: targetProfile.location,
      })
      .eq("user_id", user.id)
      .select("*")
      .single();

  if (updateCurrentError || !updatedCurrentProfile) {
    return NextResponse.json(
      { error: "Failed to update current profile" },
      { status: 500 },
    );
  }

  const { error: updateTargetError } = await supabase
    .from("game")
    .update({
      alive: false,
      target: null,
      weapon: null,
      location: null,
    })
    .eq("user_id", targetProfile.user_id);

  if (updateTargetError) {
    // Rollback: revert the current player's kill if target update failed
    await supabase
      .from("game")
      .update({
        killed_ids: currentProfile.killed_ids ?? [],
        target: currentProfile.target,
        weapon: currentProfile.weapon,
        location: currentProfile.location,
      })
      .eq("user_id", user.id);

    return NextResponse.json(
      { error: "Failed to update target profile" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    profile: updatedCurrentProfile as GameRow,
    killedUserId: targetProfile.user_id,
  });
}

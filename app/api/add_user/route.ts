import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    display_name?: string;
  };

  const displayName = body.display_name?.trim();
  if (!displayName) {
    return NextResponse.json(
      { error: "display_name is required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("game")
    .insert({
      user_id: user.id,
      display_name: displayName,
      target: null,
      weapon: null,
      location: null,
      alive: true,
      killed_ids: [],
      kill_password: null,
    })
    .select(
      "user_id,display_name,target,weapon,location,alive,killed_ids,kill_password",
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "User already exists in game table" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Failed to insert user into game table" },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "User added to game", player: data });
}

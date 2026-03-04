import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function isAdminEmail(email: string | undefined): boolean {
  return (email ?? "").toLowerCase() === "calmcgregor48@gmail.com";
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(url, serviceRoleKey);
}

export async function DELETE() {
  const supabase = await createServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: gameDeleteError, count: gameRowsDeleted } = await supabase
    .from("game")
    .delete({ count: "exact" });

  if (gameDeleteError) {
    return NextResponse.json(
      { error: "Failed to delete game data", details: gameDeleteError.message },
      { status: 500 },
    );
  }

  const adminClient = getAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      {
        error:
          "Game data deleted, but auth purge is unavailable (missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).",
        rowsDeleted: gameRowsDeleted ?? 0,
      },
      { status: 500 },
    );
  }

  const perPage = 1000;
  let page = 1;
  const authUserIds: string[] = [];

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      return NextResponse.json(
        {
          error: "Failed to list auth users",
          details: error.message,
          rowsDeleted: gameRowsDeleted ?? 0,
        },
        { status: 500 },
      );
    }

    const users = data?.users ?? [];
    authUserIds.push(...users.map((u) => u.id));

    if (users.length < perPage) break;
    page += 1;
  }

  const failedAuthDeletes: { userId: string; message: string }[] = [];

  for (const userId of authUserIds) {
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) {
      failedAuthDeletes.push({ userId, message: error.message });
    }
  }

  if (failedAuthDeletes.length > 0) {
    return NextResponse.json(
      {
        error: "Partial auth purge failure",
        rowsDeleted: gameRowsDeleted ?? 0,
        authUsersFound: authUserIds.length,
        authUsersDeleted: authUserIds.length - failedAuthDeletes.length,
        failedAuthDeletes,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    message: "All game data deleted and all auth users removed",
    rowsDeleted: gameRowsDeleted ?? 0,
    authUsersDeleted: authUserIds.length,
  });
}

import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${API}/jobs/${id}/negotiation`, { cache: "no-store" });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // route: /api/jobs/[id]/negotiation?action=accept|reject
  const url = new URL(_req.url);
  const action = url.searchParams.get("action") ?? "accept";
  const { createClient } = await import("@/lib/supabase-server");
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });

  const res = await fetch(`${API}/jobs/${id}/negotiation/${action}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

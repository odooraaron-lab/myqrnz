import { NextResponse } from "next/server";
import { isSubdomainTaken } from "@/lib/shops";
import { subdomainProblem, suggestSubdomain } from "@/lib/subdomain";

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("name") ?? "";
  const name = suggestSubdomain(raw);
  const problem = subdomainProblem(name);
  if (problem) {
    return NextResponse.json({ name, available: false, problem });
  }
  try {
    const taken = await isSubdomainTaken(name);
    return NextResponse.json({
      name,
      available: !taken,
      problem: taken ? "Someone already has that name. Try adding your town or a word like shop." : null,
    });
  } catch {
    // Database unavailable: let the person carry on; registration checks again.
    return NextResponse.json({ name, available: null, problem: null });
  }
}

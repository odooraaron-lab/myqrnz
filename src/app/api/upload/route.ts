import { NextResponse } from "next/server";
import { getCurrentUser, getUserShop } from "@/lib/auth";
import { storeImage, UploadError } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in again to upload photos." }, { status: 401 });
  const shop = await getUserShop(user.id);
  if (!shop) return NextResponse.json({ error: "Create your shop first." }, { status: 400 });

  const form = await request.formData();
  const kind = String(form.get("kind") ?? "");
  const file = form.get("file");
  if (!["logo", "cover", "listing"].includes(kind) || !(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }

  try {
    const url = await storeImage(file, `shops/${shop.id}/${kind}`);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    console.error("[upload]", err);
    return NextResponse.json({ error: "Upload failed. Try again in a moment." }, { status: 500 });
  }
}

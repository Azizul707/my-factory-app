import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("token", "", { maxAge: 0, path: "/" }); // কুকি ডিলেট
  return response;
}
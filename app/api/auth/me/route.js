import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode("MY_SUPER_SECRET_KEY_RAJBHOG_2025");

export async function GET() {
  // নতুন আপডেট: এখানে await যোগ করা হয়েছে
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token.value, JWT_SECRET);
    return NextResponse.json({ 
        isLoggedIn: true, 
        role: payload.role, 
        section: payload.section 
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
import { SignJWT } from "jose";
import { NextResponse } from "next/server";
import dbConnect from '@/lib/db';
import Section from '@/models/Section';

// শুধু এডমিন হার্ডকোডেড থাকবে (সেফটির জন্য)
const ADMIN_USER = { user: "admin@rajbhog", pass: "Raj#Boss!99$Master", role: "ADMIN", section: "ALL" };

const JWT_SECRET = new TextEncoder().encode("MY_SUPER_SECRET_KEY_RAJBHOG_2025");

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { username, password } = body;

    console.log("Login Attempt:", username);

    let user = null;

    // ১. প্রথমে চেক করবে এটা এডমিন কিনা
    if (username === ADMIN_USER.user && password === ADMIN_USER.pass) {
        user = ADMIN_USER;
    } else {
        // ২. এডমিন না হলে ডাটাবেসে খুঁজবে (সেকশন লিডার)
        const sectionUser = await Section.findOne({ username, password });
        if (sectionUser) {
            user = {
                user: sectionUser.username,
                role: 'LEADER',
                section: sectionUser.name
            };
        }
    }

    if (!user) {
      return NextResponse.json({ error: "ভুল ইউজারনেম বা পাসওয়ার্ড" }, { status: 401 });
    }

    // ৩. টোকেন তৈরি
    const token = await new SignJWT({ 
      username: user.user, 
      role: user.role, 
      section: user.section 
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("30d")
      .sign(JWT_SECRET);

    const response = NextResponse.json({ success: true, role: user.role, section: user.section });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: false, // Localhost fix
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
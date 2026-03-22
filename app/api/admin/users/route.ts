import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { username, fullName, email, password, role } = await req.json();

    if (!username || !password || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username or Email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        fullName,
        email,
        password: hashedPassword,
        role: role || "user",
        isActive: true,
      },
    });

    return NextResponse.json({ 
      id: user.id, 
      username: user.username, 
      role: user.role 
    });

  } catch (error: any) {
    console.error("User creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

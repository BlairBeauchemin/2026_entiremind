import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    // Validate all required fields
    const hasName = name && typeof name === "string" && name.trim();
    const hasEmail = email && typeof email === "string" && email.trim();
    const hasPhone = phone && typeof phone === "string" && phone.trim();

    if (!hasName) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!hasEmail) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!hasPhone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("Lead captured (Supabase not configured):", { name, email, phone });
      return NextResponse.json(
        { success: true, message: "Lead captured" },
        { status: 201 }
      );
    }

    const supabase = createServiceRoleClient();

    // Insert lead into database
    const { error } = await supabase.from("leads").insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      source: "landing_page",
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This email is already on the waitlist" },
          { status: 409 }
        );
      }
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save lead" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Lead captured" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error capturing lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

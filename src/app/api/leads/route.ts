import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone } = body;

    // Require at least email or phone
    const hasEmail = email && typeof email === "string" && email.trim();
    const hasPhone = phone && typeof phone === "string" && phone.trim();

    if (!hasEmail && !hasPhone) {
      return NextResponse.json(
        { error: "Email or phone number is required" },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (hasEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Validate phone if provided
    if (hasPhone) {
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length < 10 || phoneDigits.length > 15) {
        return NextResponse.json(
          { error: "Invalid phone number" },
          { status: 400 }
        );
      }
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // In development without Supabase, just log and return success
      console.log("Lead captured (Supabase not configured):", { email, phone });
      return NextResponse.json(
        { success: true, message: "Lead captured" },
        { status: 201 }
      );
    }

    const supabase = createServiceRoleClient();

    // Insert lead into database
    const { error } = await supabase.from("leads").insert({
      email: hasEmail ? email.toLowerCase().trim() : null,
      phone: hasPhone ? phone.trim() : null,
      source: "landing_page",
    });

    if (error) {
      // Handle duplicate email
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

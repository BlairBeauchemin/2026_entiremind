import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/sms";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { text, toPhoneNumber } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 }
      );
    }

    // If no phone number provided, look up user's phone
    let targetPhone = toPhoneNumber;
    if (!targetPhone) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("phone")
        .eq("id", user.id)
        .single();

      if (userError || !userData?.phone) {
        return NextResponse.json(
          { error: "User phone number not found" },
          { status: 400 }
        );
      }
      targetPhone = userData.phone;
    }

    // Send the SMS
    const result = await sendSms(user.id, targetPhone, text);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        messageId: result.messageId,
        externalMessageId: result.externalMessageId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in SMS send endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

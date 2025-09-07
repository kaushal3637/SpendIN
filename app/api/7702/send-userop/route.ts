import { NextResponse } from "next/server";

// This endpoint is now deprecated as user operation sending happens on the frontend
// Keeping it for backward compatibility but it will return a deprecation notice
export async function POST() {
  return NextResponse.json({
    error: "This endpoint is deprecated. User operation sending now happens on the frontend.",
    message: "Please use the frontend send() function directly."
  }, { status: 410 }); // 410 Gone
}

import { NextRequest, NextResponse } from "next/server";

// This endpoint is now deprecated as user operation preparation happens on the frontend
// Keeping it for backward compatibility but it will return a deprecation notice
export async function POST(request: NextRequest) {
  return NextResponse.json({
    error: "This endpoint is deprecated. User operation preparation now happens on the frontend.",
    message: "Please use the frontend prepare7702UserOp function directly."
  }, { status: 410 }); // 410 Gone
}

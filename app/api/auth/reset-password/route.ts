import { type NextRequest, NextResponse } from "next/server"

const CENTRAL_API = "https://central.duka.plus/api/method/dukaplus.services.rest.update_password"

export async function POST(request: NextRequest) {
  try {
    const { usr, otp, new_password } = await request.json()

    const response = await fetch(CENTRAL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usr, otp, new_password }),
    })

    if (!response.ok) {
      return NextResponse.json({ message: "Password reset failed" }, { status: 400 })
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

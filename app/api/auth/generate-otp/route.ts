import { type NextRequest, NextResponse } from "next/server"

const CENTRAL_API = "https://central.duka.plus/api/method/dukaplus.services.rest.generate_otp"

export async function POST(request: NextRequest) {
  try {
    const { mobile_number } = await request.json()

    const response = await fetch(CENTRAL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobile_number }),
    })

    if (!response.ok) {
      return NextResponse.json({ message: "Failed to generate OTP" }, { status: 400 })
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Generate OTP error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

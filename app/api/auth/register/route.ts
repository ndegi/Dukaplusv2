import { type NextRequest, NextResponse } from "next/server"

const CENTRAL_API = "https://central.duka.plus/api/method/dukaplus.services.rest.user_registration"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(CENTRAL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json({ message: "Registration failed" }, { status: 400 })
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

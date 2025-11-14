import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const authCookie = request.cookies.get("auth_token")
    if (!authCookie) {
      return NextResponse.json({ message: { message: "Not authenticated", status: 401 } }, { status: 401 })
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/method/dukaplus.services.rest.cancel_order`

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Cookie: `sid=${authCookie.value}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error("[API] Cancel purchase order error:", error)
    return NextResponse.json({ message: { message: "Internal server error", status: 500 } }, { status: 500 })
  }
}

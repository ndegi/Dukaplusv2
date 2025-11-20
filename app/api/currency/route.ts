import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    if (!apiUrl) {
      return NextResponse.json({ error: "API URL not configured" }, { status: 500 })
    }

    const response = await fetch(`${apiUrl}/api/method/dukaplus.services.rest.get_default_currency`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch currency: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching currency:", error)
    return NextResponse.json(
      { message: { currency: "KES" } }, // Fallback to KES
      { status: 200 },
    )
  }
}

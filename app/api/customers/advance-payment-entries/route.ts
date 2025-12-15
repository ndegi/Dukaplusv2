import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const customerId = request.nextUrl.searchParams.get("customer_id")
    if (!customerId) {
      return NextResponse.json({ error: "customer_id is required" }, { status: 400 })
    }

    let credentials
    try {
      credentials = JSON.parse(credentialsCookie)
    } catch (parseError) {
      console.error("[DukaPlus] Failed to parse credentials:", parseError)
      return NextResponse.json({ error: "Invalid credentials format" }, { status: 401 })
    }

    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const response = await fetch(
      `${credentials.baseUrl}/api/method/dukaplus.services.rest.get_customer_payment_entries?customer_id=${encodeURIComponent(customerId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      },
    )

    const data = await response.json()

    if (!response.ok) {
      console.error("[DukaPlus] Get customer payment entries error:", { status: response.status, data })
      return NextResponse.json({ error: "Failed to fetch customer payment entries" }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[DukaPlus] Get customer payment entries error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch customer payment entries" },
      { status: 500 },
    )
  }
}


import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsCookie)
    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const customerId = request.nextUrl.searchParams.get("customer_id")

    if (!customerId) {
      return NextResponse.json({ error: "customer_id is required" }, { status: 400 })
    }

    const response = await fetch(
      `${credentials.baseUrl}/api/method/dukaplus.services.rest.get_unpaid_customer_statement?customer_id=${encodeURIComponent(customerId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error("[DukaPlus] Unpaid customer statement API error:", errorData)
      return NextResponse.json(
        { error: `Failed to fetch customer statement: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[DukaPlus] Unpaid customer statement error:", error)
    return NextResponse.json({ error: "Failed to fetch customer statement" }, { status: 500 })
  }
}


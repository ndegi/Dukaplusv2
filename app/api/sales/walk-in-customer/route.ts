import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value
    const warehouseId = cookieStore.get("warehouse_id")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!warehouseId) {
      return NextResponse.json({ error: "Missing warehouse_id" }, { status: 400 })
    }

    const credentials = JSON.parse(credentialsCookie)
    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    console.log("[DukaPlus] Fetching walk-in customer with:", {
      url: `${credentials.baseUrl}/api/method/dukaplus.services.rest.get_walk_in_customer?warehouse_id=${warehouseId}`,
      hasAuth: !!authHeader,
    })

    const response = await fetch(
      `${credentials.baseUrl}/api/method/dukaplus.services.rest.get_walk_in_customer?warehouse_id=${warehouseId}`,
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      },
    )

    const responseText = await response.text()
    console.log("[DukaPlus] Walk-in API raw response:", { status: response.status, body: responseText })

    if (!response.ok) {
      console.error("[DukaPlus] Walk-in API error:", { status: response.status, body: responseText })
      return NextResponse.json({
        walk_in_customer: "Walk In",
      })
    }

    try {
      const data = JSON.parse(responseText)
      console.log("[DukaPlus] Walk-in API parsed response:", data)

      const walkInCustomer = data.message?.walk_in_customer || "Walk In"

      return NextResponse.json({
        walk_in_customer: walkInCustomer,
      })
    } catch (parseError) {
      console.error("[DukaPlus] Failed to parse walk-in response:", parseError)
      return NextResponse.json({
        walk_in_customer: "Walk In",
      })
    }
  } catch (error) {
    console.error("[DukaPlus] Error fetching walk-in customer:", error)
    return NextResponse.json({
      walk_in_customer: "Walk In",
    })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value
    const searchParams = request.nextUrl.searchParams
    const warehouseIdFromQuery = searchParams.get("warehouse_id")
    const warehouseId =
      warehouseIdFromQuery?.trim() ||
      cookieStore.get("warehouse_id")?.value ||
      ""

    if (!credentialsCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsCookie)
    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const walkInUrl = new URL(
      "/api/method/dukaplus.services.rest.get_walk_in_customer",
      credentials.baseUrl,
    )

    if (warehouseId) {
      walkInUrl.searchParams.set("warehouse_id", warehouseId)
    }

    const response = await fetch(walkInUrl.toString(), {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    })

    const responseText = await response.text()

    if (!response.ok) {
      console.error("[DukaPlus] Walk-in API error:", { status: response.status, body: responseText })
      return NextResponse.json({
        walk_in_customer: "Walk In",
      })
    }

    try {
      const data = JSON.parse(responseText)

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

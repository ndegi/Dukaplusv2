import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const tenantCreds = cookieStore.get("tenant_credentials")?.value
    if (!tenantCreds) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const creds = JSON.parse(tenantCreds)
    const warehouseId = request.nextUrl.searchParams.get("warehouse_id") || "Emidan Farm - DP"

    const url = new URL(`${creds.baseUrl}/api/method/dukaplus.services.rest.get_stock_balance_report`)
    url.searchParams.set("warehouse_id", warehouseId)

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${creds.apiKey}:${creds.apiSecret}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Failed to fetch stock balance" }, { status: response.status })
    }

    return NextResponse.json({ stock: data.message?.data || [] })
  } catch (error) {
    console.error("[DukaPlus] Stock balance error:", error)
    return NextResponse.json({ error: "Failed to fetch stock balance" }, { status: 500 })
  }
}

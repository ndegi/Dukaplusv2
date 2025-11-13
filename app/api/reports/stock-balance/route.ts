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

    const response = await fetch(`${creds.base_url}/api/method/dukaplus.services.rest.get_stock_balance_report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${creds.api_key}:${creds.api_secret}`,
      },
      body: JSON.stringify({
        warehouse_id: warehouseId,
      }),
    })

    const data = await response.json()
    return NextResponse.json({ stock: data.message?.data || [] })
  } catch (error) {
    console.error("[DukaPlus] Stock balance error:", error)
    return NextResponse.json({ error: "Failed to fetch stock balance" }, { status: 500 })
  }
}

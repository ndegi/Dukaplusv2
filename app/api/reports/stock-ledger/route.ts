import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsStr = cookieStore.get("tenant_credentials")?.value

    if (!credentialsStr) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsStr)
    const { baseUrl, apiKey, apiSecret } = credentials

    const warehouseId = request.nextUrl.searchParams.get("warehouse_id")
    const itemCode = request.nextUrl.searchParams.get("item_code")

    if (!warehouseId) {
      return NextResponse.json({ message: "Warehouse ID is required" }, { status: 400 })
    }

    const url = new URL(`${baseUrl}/api/method/dukaplus.services.rest.get_stock_ledger_report`)
    url.searchParams.set("warehouse_id", warehouseId)
    if (itemCode) {
      url.searchParams.set("item_code", itemCode)
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${apiKey}:${apiSecret}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to fetch stock ledger" }, { status: response.status })
    }

    return NextResponse.json({
      stock: data.message?.data || [],
    })
  } catch (error) {
    console.error("[DukaPlus] Stock ledger fetch error:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

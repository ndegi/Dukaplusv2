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
    const date = request.nextUrl.searchParams.get("date")
    const itemCode = request.nextUrl.searchParams.get("item_code") // Optional

    // Validate mandatory parameters
    if (!warehouseId || !date) {
      return NextResponse.json(
        { message: "warehouse_id and date are mandatory parameters. Date format: dd-mm-yyyy" },
        { status: 400 }
      )
    }

    // Validate date format (dd-mm-yyyy)
    const dateRegex = /^\d{2}-\d{2}-\d{4}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { message: "Invalid date format. Please use dd-mm-yyyy format" },
        { status: 400 }
      )
    }

    const url = new URL(`${baseUrl}/api/method/dukaplus.services.rest.get_stock_ledger_report`)
    url.searchParams.set("warehouse_id", warehouseId)
    url.searchParams.set("date", date)
    
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

    console.log("[DukaPlus] Stock ledger API response:", JSON.stringify(data, null, 2))

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to fetch stock ledger" }, { status: response.status })
    }

    // Extract data from response
    const stockData = data.message?.data || data.data || []
    console.log("[DukaPlus] Stock ledger records count:", stockData.length)

    return NextResponse.json({
      message: {
        status: 200,
        data: stockData
      }
    })
  } catch (error) {
    console.error("[DukaPlus] Stock ledger fetch error:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

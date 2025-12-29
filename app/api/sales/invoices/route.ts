import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsCookie)
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get("warehouse_id")

    if (!warehouseId) {
      return NextResponse.json({ message: "Warehouse ID is required" }, { status: 400 })
    }

    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const response = await fetch(
      `${credentials.baseUrl}/api/method/dukaplus.services.rest.get_sales_invoices?warehouse_id=${encodeURIComponent(warehouseId)}`,
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
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[DukaPlus] Error fetching sales invoices:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

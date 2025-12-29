import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")

    if (!credentialsCookie) {
      return NextResponse.json({ message: "Missing authentication credentials. Please log in again." }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsCookie.value || "{}")
    const warehouseId = request.nextUrl.searchParams.get("warehouse_id")

    if (!credentials.baseUrl || !credentials.apiKey || !credentials.apiSecret) {
      return NextResponse.json({ message: "Invalid authentication credentials. Please log in again." }, { status: 401 })
    }

    const response = await fetch(
      `${credentials.baseUrl}/api/method/dukaplus.services.rest.get_sales_receipts?warehouse_id=${warehouseId || ""}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${credentials.apiKey}:${credentials.apiSecret}`,
        },
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[DukaPlus] Error fetching sales receipts:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

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
    const warehouse_id = request.nextUrl.searchParams.get("warehouse_id")

    if (!warehouse_id) {
      return NextResponse.json({ message: "Warehouse ID is required" }, { status: 400 })
    }

    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const response = await fetch(
      `${credentials.baseUrl}/api/method/dukaplus.services.rest.get_purchase_receipts?warehouse_id=${encodeURIComponent(warehouse_id)}`,
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
      console.error("[DukaPlus] API Error:", errorData)
      return NextResponse.json({ message: `Failed to fetch purchase receipts: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({
      message: {
        status: data.message?.status || 200,
        data: data.message?.data || []
      }
    })
  } catch (error) {
    console.error("[DukaPlus] Purchase receipts fetch error:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

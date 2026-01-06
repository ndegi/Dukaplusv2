import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ message: "Unauthorized - no credentials cookie" }, { status: 401 })
    }

    let credentials
    try {
      credentials = JSON.parse(credentialsCookie)
    } catch (parseError) {
      return NextResponse.json({ message: "Invalid credentials format" }, { status: 401 })
    }

    if (!credentials.username || !credentials.apiKey || !credentials.apiSecret || !credentials.baseUrl) {
      return NextResponse.json({ message: "Incomplete credentials" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get("warehouse_id") || ""

    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const response = await fetch(
      `${credentials.baseUrl}/api/method/dukaplus.services.rest.get_all_product_categories?warehouse_id=${encodeURIComponent(warehouseId)}`,
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
      console.error("[DukaPlus] Categories fetch error:", response.status, errorData)
      return NextResponse.json(
        { message: `Failed to fetch categories: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log(`[DukaPlus] Categories fetched successfully for warehouse: ${warehouseId}`)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[DukaPlus] Error fetching categories:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

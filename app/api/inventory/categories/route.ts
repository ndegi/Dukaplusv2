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
    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get("warehouse_id") || "Emidan Farm - DP"

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
      console.error("API Error:", errorData)
      return NextResponse.json(
        { message: `Failed to fetch categories: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Categories fetch error:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

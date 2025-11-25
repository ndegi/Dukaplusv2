import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value
    const warehouseId = cookieStore.get("selected_warehouse")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsCookie)

    const body = await request.json()
    const { product_category } = body

    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.rest.create_product_category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${credentials.apiKey}:${credentials.apiSecret}`,
      },
      body: JSON.stringify({
        product_category,
        warehouse_id: warehouseId || "Emidan Farm - DP",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ error: errorData.message || "Failed to create category" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}

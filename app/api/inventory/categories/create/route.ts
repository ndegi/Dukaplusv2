import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    let credentials
    try {
      credentials = JSON.parse(credentialsCookie)
    } catch (parseError) {
      return NextResponse.json({ error: "Invalid credentials format" }, { status: 401 })
    }

    if (!credentials.username || !credentials.apiKey || !credentials.apiSecret || !credentials.baseUrl) {
      return NextResponse.json({ error: "Incomplete credentials" }, { status: 401 });
    }

    const body = await request.json()
    const { product_category, warehouse_id: bodyWarehouseId } = body
    const warehouseId = bodyWarehouseId || cookieStore.get("selected_warehouse")?.value

    if (!warehouseId) {
      return NextResponse.json({ error: "Warehouse ID is required" }, { status: 400 })
    }

    console.log(`[DukaPlus] Creating category "${product_category}" for warehouse: ${warehouseId}`)

    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.rest.create_product_category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${credentials.apiKey}:${credentials.apiSecret}`,
      },
      body: JSON.stringify({
        product_category,
        warehouse_id: warehouseId,
      }),
    })

    const responseText = await response.text()
    let data: any = {}
    try {
      data = responseText ? JSON.parse(responseText) : {}
    } catch {
      data = { message: responseText }
    }

    if (!response.ok) {
      console.error("[DukaPlus] Category creation error:", response.status, responseText)
      return NextResponse.json({ error: data.message || "Failed to create category" }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}

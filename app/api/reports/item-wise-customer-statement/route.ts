"use server"

import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsCookie)
    const { baseUrl, apiKey, apiSecret } = credentials

    const warehouseId = request.nextUrl.searchParams.get("warehouse_id")

    const url = new URL(
      "/api/method/dukaplus.services.rest.get_item_wise_customer_statement",
      baseUrl,
    )

    if (warehouseId) {
      url.searchParams.set("warehouse_id", warehouseId)
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${apiKey}:${apiSecret}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[DukaPlus] Item-wise customer statement API error:", errorText)
      return NextResponse.json(
        { error: `Failed to fetch item-wise customer statement: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    const statement = data.message?.statement || data.message?.data || data.data || []

    return NextResponse.json({ statement })
  } catch (error) {
    console.error("[DukaPlus] Item-wise customer statement error:", error)
    return NextResponse.json({ error: "Failed to fetch item-wise customer statement" }, { status: 500 })
  }
}


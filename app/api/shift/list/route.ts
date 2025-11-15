import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const creds = cookieStore.get("tenant_credentials")?.value

    if (!creds) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { baseUrl, apiKey, apiSecret } = JSON.parse(creds)
    const { searchParams } = new URL(req.url)
    const warehouseId = searchParams.get("warehouse_id")

    if (!warehouseId) {
      return NextResponse.json({ error: "warehouse_id is required" }, { status: 400 })
    }

    const response = await fetch(
      `${baseUrl}/api/method/dukaplus.services.rest.get_shifts?warehouse_id=${encodeURIComponent(warehouseId)}`,
      {
        method: "GET",
        headers: {
          Authorization: `token ${apiKey}:${apiSecret}`,
        },
      },
    )

    const data = await response.json()

    if (!response.ok) {
      console.error("[DukaPlus] Get shifts error:", data)
      return NextResponse.json({ error: "Failed to get shifts" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[DukaPlus] Get shifts error:", error)
    return NextResponse.json({ error: "Failed to get shifts" }, { status: 500 })
  }
}

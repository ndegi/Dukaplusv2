import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value
    const warehouseId = cookieStore.get("warehouse_id")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!warehouseId) {
      return NextResponse.json({ error: "Missing currency" }, { status: 400 })
    }

    const credentials = JSON.parse(credentialsCookie)
    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`
    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.rest.get_default_currency?warehouse=${warehouseId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      console.error("[DukaPlus] Currency API error:", response.status, response)
      throw new Error(`Failed to fetch currency: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[DukaPlus] Currency fetched successfully:", data.message?.currency)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[DukaPlus] Error fetching currency:", error)
    return NextResponse.json({ message: { currency: "KES" } }, { status: 200 })
  }
}

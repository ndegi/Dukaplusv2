import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentials = cookieStore.get("tenant_credentials")?.value

    if (!credentials) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { sales_person = "", warehouse = "", item_code = "", from_date = "", to_date = "" } = body

    const creds = JSON.parse(credentials)

    const response = await fetch(`${creds.baseUrl}/api/method/dukaplus.services.rest.sales_trend_by_product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${creds.apiKey}:${creds.apiSecret}`,
      },
      body: JSON.stringify({
        sales_person,
        warehouse,
        item_code,
        from_date,
        to_date,
      }),
    })

    if (!response.ok) {
      console.error("[DukaPlus] DukaPlus API error:", response.status, await response.text())
      return NextResponse.json({ message: "Failed to fetch sales trend" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data.message || {})
  } catch (error) {
    console.error("[DukaPlus] Sales trend fetch error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

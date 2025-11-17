import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const DUKAPLUS_API = process.env.NEXT_PUBLIC_DUKAPLUS_API || "https://demo.duka.plus"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentials = cookieStore.get("tenant_credentials")?.value

    if (!credentials) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { warehouse = "", item_code = "", from_date = "", to_date = "" } = body

    const creds = JSON.parse(credentials)
    const response = await fetch(`${creds.baseUrl}/api/method/dukaplus.services.rest.sales_by_sales_person`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${creds.apiKey}:${creds.apiSecret}`,
      },
      body: JSON.stringify({
        warehouse,
        item_code,
        from_date,
        to_date,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ message: "Failed to fetch sales by person" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data.message || {})
  } catch (error) {
    console.error("Sales by person fetch error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

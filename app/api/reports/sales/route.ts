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
    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const response = await fetch(
      `${credentials.baseUrl}/api/method/dukaplus.services.rest.get_sales_report_data`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error("[DukaPlus] Sales report API error:", errorData)
      return NextResponse.json(
        { error: `Failed to fetch sales report: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ sales: data.message?.data || [] })
  } catch (error) {
    console.error("[DukaPlus] Sales report error:", error)
    return NextResponse.json({ error: "Failed to fetch sales report" }, { status: 500 })
  }
}

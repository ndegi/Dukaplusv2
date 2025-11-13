import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const tenantCreds = cookieStore.get("tenant_credentials")?.value
    if (!tenantCreds) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const creds = JSON.parse(tenantCreds)
    const from = request.nextUrl.searchParams.get("from")
    const to = request.nextUrl.searchParams.get("to")

    const response = await fetch(`${creds.base_url}/api/method/dukaplus.services.rest.get_sales_report_data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${creds.api_key}:${creds.api_secret}`,
      },
      body: JSON.stringify({
        from_date: from,
        to_date: to,
      }),
    })

    const data = await response.json()
    return NextResponse.json({ sales: data.message?.data || [] })
  } catch (error) {
    console.error("[v0] Sales report error:", error)
    return NextResponse.json({ error: "Failed to fetch sales report" }, { status: 500 })
  }
}

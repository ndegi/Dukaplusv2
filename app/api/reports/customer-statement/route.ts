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

    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/method/dukaplus.services.rest.get_customer_statement`

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Cookie: `sid=${tenantCreds}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    return NextResponse.json({ customers: data.message?.data || [] })
  } catch (error) {
    console.error("[DukaPlus] Customer statement error:", error)
    return NextResponse.json({ error: "Failed to fetch customer statement" }, { status: 500 })
  }
}

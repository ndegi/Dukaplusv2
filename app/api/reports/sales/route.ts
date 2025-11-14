import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const authCookie = cookieStore.get("auth_token")
    if (!authCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/method/dukaplus.services.rest.get_sales_report_data`

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Cookie: `sid=${authCookie.value}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    return NextResponse.json({ sales: data.message?.data || [] })
  } catch (error) {
    console.error("[DukaPlus] Sales report error:", error)
    return NextResponse.json({ error: "Failed to fetch sales report" }, { status: 500 })
  }
}

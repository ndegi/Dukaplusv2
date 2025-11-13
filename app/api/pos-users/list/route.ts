import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentials = JSON.parse(cookieStore.get("tenant_credentials")?.value || "{}")

    if (!credentials.baseUrl || !credentials.apiKey || !credentials.apiSecret) {
      return NextResponse.json({ message: "Missing authentication credentials" }, { status: 401 })
    }

    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.rest.get_pos_users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credentials.apiKey}:${credentials.apiSecret}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching POS users:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

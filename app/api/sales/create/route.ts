import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentials = JSON.parse(cookieStore.get("tenant_credentials")?.value || "{}")

    if (!credentials.baseUrl || !credentials.apiKey || !credentials.apiSecret) {
      return NextResponse.json({ message: "Missing authentication credentials" }, { status: 401 })
    }

    const body = await request.json()

    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.rest.create_sales_invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${credentials.apiKey}:${credentials.apiSecret}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating sales invoice:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

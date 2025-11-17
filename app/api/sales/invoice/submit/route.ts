import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsStr = cookieStore.get("tenant_credentials")?.value

    if (!credentialsStr) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsStr)
    const { baseUrl, apiKey, apiSecret } = credentials

    const body = await request.json()
    const { sales_id, payment_details } = body

    const response = await fetch(`${baseUrl}/api/method/dukaplus.services.rest.post_payment_to_invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${apiKey}:${apiSecret}`,
      },
      body: JSON.stringify({
        sales_id,
        payment_details,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ message: data.message || data }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[DukaPlus] Submit sales invoice error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

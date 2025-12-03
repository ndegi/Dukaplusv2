import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsString = cookieStore.get("tenant_credentials")?.value

    if (!credentialsString) {
      return NextResponse.json({ message: { message: "Unauthorized" } }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsString)

    const body = await request.json()
    const { sales_invoice_id } = body

    if (!sales_invoice_id) {
      return NextResponse.json({ message: { message: "Sales invoice ID is required" } }, { status: 400 })
    }

    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.rest.cancel_sales_invoice`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sales_invoice_id }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[DukaPlus] Error cancelling invoice:", error)
    return NextResponse.json({ message: { message: "Internal server error" } }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsStr = cookieStore.get("tenant_credentials")?.value

    if (!credentialsStr) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsStr)
    const { baseUrl, apiKey, apiSecret } = credentials

    const body = await request.json()
    const { purchase_invoice_id, payments } = body

    const response = await fetch(
      `${baseUrl}/api/method/dukaplus.services.rest.make_payment_to_purchase_invoice`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${apiKey}:${apiSecret}`,
        },
        body: JSON.stringify({
          purchase_invoice_id,
          payments, // Array of {mode_of_payment: string, amount: number}
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || data.error || "Failed to post payment" },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[DukaPlus] Purchase invoice payment error:", error)
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

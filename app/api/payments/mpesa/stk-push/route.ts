import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsCookie)

    const body = await request.json()
    const { mobile_number, payment_details } = body

    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.payment.make_payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        mobile_number: mobile_number,
        payment_details: payment_details || [],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[DukaPlus] STK push error:", errorData)
      return NextResponse.json({ message: errorData.message || "Payment failed" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      amount_paid: data.message?.amount_paid,
      message: data.message?.message || "Payment successful",
    })
  } catch (error) {
    console.error("[DukaPlus] STK push error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

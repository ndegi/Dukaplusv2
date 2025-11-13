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
    const { phone, amount, tillNumber } = await request.json()

    const authHeader = `token ${credentials.api_key}:${credentials.api_secret}`

    const response = await fetch(`${credentials.base_url}/api/method/dukaplus.services.rest.initiate_mpesa_stk_push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        phone_number: phone,
        amount: amount,
        till_number: tillNumber,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ message: errorData.message || "STK push failed" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      checkoutRequestId: data.message?.checkout_request_id,
      message: "STK push initiated successfully",
    })
  } catch (error) {
    console.error("[DukaPlus] STK push error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

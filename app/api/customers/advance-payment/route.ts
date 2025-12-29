import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    let credentials
    try {
      credentials = JSON.parse(credentialsCookie)
    } catch (parseError) {
      console.error("[DukaPlus] Failed to parse credentials:", parseError)
      return NextResponse.json({ error: "Invalid credentials format" }, { status: 401 })
    }

    const body = await request.json()
    const { customer_id, mode_of_payment, amount_paid } = body

    if (!customer_id || !mode_of_payment || !amount_paid) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.rest.post_advance_payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        customer_id,
        mode_of_payment,
        amount_paid,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[DukaPlus] Post advance payment error:", { status: response.status, data })
      return NextResponse.json(
        { error: data.message?.message || "Failed to post advance payment" },
        { status: response.status },
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[DukaPlus] Post advance payment error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to post advance payment" },
      { status: 500 },
    )
  }
}


import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsCookie)

    if (!credentials.baseUrl || !credentials.apiKey || !credentials.apiSecret) {
      return NextResponse.json({ message: "Missing authentication credentials", modes: [] }, { status: 400 })
    }

    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.rest.get_mode_of_payments`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      console.error("[v0] Failed to fetch payment modes:", response.status)
      return NextResponse.json({ modes: [] })
    }

    const data = await response.json()
    const modes = data.message?.modes_of_payments || data.message?.modes_of_payment || data.modes || []
    return NextResponse.json({ modes: Array.isArray(modes) ? modes : [] })
  } catch (error) {
    console.error("[v0] Payment modes fetch error:", error)
    return NextResponse.json({ modes: [] })
  }
}

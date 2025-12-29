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
      console.error("[DukaPlus] Failed to fetch payment modes:", response.status)
      return NextResponse.json({ modes: [] })
    }

    const data = await response.json()
    console.log("[DukaPlus] Payment modes API response:", data)
    const modes = data.message?.mode_of_payments || []
    console.log("[DukaPlus] Extracted payment modes:", modes)
    return NextResponse.json({ modes: Array.isArray(modes) ? modes : [] })
  } catch (error) {
    console.error("[DukaPlus] Payment modes fetch error:", error)
    return NextResponse.json({ modes: [] })
  }
}

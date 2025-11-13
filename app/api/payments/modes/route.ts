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

    if (!credentials.base_url) {
      return NextResponse.json({ message: "Missing base URL configuration", modes: [] }, { status: 400 })
    }

    const authHeader = `token ${credentials.api_key}:${credentials.api_secret}`

    const response = await fetch(`${credentials.base_url}/api/method/dukaplus.services.rest.get_mode_of_payments`, {
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
    const modes = data.message?.modes_of_payments || data.message?.modes_of_payment || data.modes || []
    return NextResponse.json({ modes: Array.isArray(modes) ? modes : [] })
  } catch (error) {
    console.error("[DukaPlus] Payment modes fetch error:", error)
    return NextResponse.json({ modes: [] })
  }
}

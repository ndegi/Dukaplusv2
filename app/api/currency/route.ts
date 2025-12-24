import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")

    if (!credentialsCookie) {
      console.log("[DukaPlus] No credentials cookie found")
      return NextResponse.json({ message: { currency: "KES" } }, { status: 200 })
    }

    const credentials = JSON.parse(credentialsCookie.value)

    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.rest.get_default_currency?warehouse=${credentials.warehouse}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${credentials.apiKey}:${credentials.apiSecret}`,
      },
    })

    if (!response.ok) {
      console.error("[DukaPlus] Currency API error:", response.status, response.statusText)
      throw new Error(`Failed to fetch currency: ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[DukaPlus] Currency fetched successfully:", data.message?.currency)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[DukaPlus] Error fetching currency:", error)
    return NextResponse.json({ message: { currency: "KES" } }, { status: 200 })
  }
}

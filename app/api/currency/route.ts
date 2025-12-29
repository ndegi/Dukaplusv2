import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ message: "Unauthorized - no credentials cookie" }, { status: 401 })
    }

    let credentials
    try {
      credentials = JSON.parse(credentialsCookie)
    } catch (parseError) {
      return NextResponse.json({ message: "Invalid credentials format" }, { status: 401 })
    }

    if (!credentials.username || !credentials.apiKey || !credentials.baseUrl) {
      return NextResponse.json({ message: "Incomplete credentials" }, { status: 401 });
    }

    const warehouse_id = request.nextUrl.searchParams.get("warehouse_id") || "";

    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`;
    const response = await fetch(
      `${credentials.baseUrl}/api/method/dukaplus.services.rest.get_default_currency?warehouse_id=${encodeURIComponent(warehouse_id)}`, {
      method: "[GET]",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    })

    if (!response.ok) {
      console.error("[DukaPlus] Currency API error:", response.status, response)
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

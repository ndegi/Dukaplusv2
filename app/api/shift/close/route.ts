import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const creds = cookieStore.get("tenant_credentials")?.value

    if (!creds) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { baseUrl, apiKey, apiSecret } = JSON.parse(creds)
    const body = await req.json()

    const response = await fetch(`${baseUrl}/api/method/dukaplus.services.rest.close_shift`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${apiKey}:${apiSecret}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[DukaPlus] Close shift error:", data)
      return NextResponse.json({ error: "Failed to close shift" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[DukaPlus] Close shift error:", error)
    return NextResponse.json({ error: "Failed to close shift" }, { status: 500 })
  }
}

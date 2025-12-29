import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const tenantCreds = cookieStore.get("tenant_credentials")?.value
    if (!tenantCreds) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const creds = JSON.parse(tenantCreds)
    const body = await request.json()

    const response = await fetch(`${creds.baseUrl}/api/method/dukaplus.services.rest.update_expense`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${creds.apiKey}:${creds.apiSecret}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[DukaPlus] Update expense error:", error)
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 })
  }
}

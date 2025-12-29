import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const creds = cookieStore.get("tenant_credentials")?.value

    if (!creds) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { baseUrl, apiKey, apiSecret } = JSON.parse(creds)

    const response = await fetch(`${baseUrl}/api/method/dukaplus.services.rest.get_customer_groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${apiKey}:${apiSecret}`,
      },
      body: JSON.stringify({}),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[DukaPlus] Get customer groups error:", data)
      return NextResponse.json({ error: "Failed to fetch customer groups" }, { status: 500 })
    }

    return NextResponse.json({ message: data.message, groups: data.message?.customer_groups || [] })
  } catch (error) {
    console.error("[DukaPlus] Get customer groups error:", error)
    return NextResponse.json({ error: "Failed to fetch customer groups" }, { status: 500 })
  }
}

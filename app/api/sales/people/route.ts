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

    const response = await fetch(`${baseUrl}/api/method/dukaplus.services.rest.get_sales_people`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${apiKey}:${apiSecret}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[DukaPlus] Get sales people error:", data)
      return NextResponse.json({ error: "Failed to fetch sales people" }, { status: 500 })
    }

    return NextResponse.json({ sales_people: data.message?.sales_people || [] })
  } catch (error) {
    console.error("[DukaPlus] Get sales people error:", error)
    return NextResponse.json({ error: "Failed to fetch sales people" }, { status: 500 })
  }
}

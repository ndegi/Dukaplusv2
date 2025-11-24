import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
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

    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.rest.get_all_customers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[DukaPlus] Get customers error:", { status: response.status, data })
      return NextResponse.json({ error: "Failed to fetch customers" }, { status: response.status })
    }

    const customers = (data.message?.customers || []).map((customer: any) => ({
      ...customer,
      mobile_number: customer.mobile_number || customer.mobile_no || customer.phone || customer.mobile || "",
    }))

    return NextResponse.json({ customers })
  } catch (error) {
    console.error("[DukaPlus] Get customers error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch customers" },
      { status: 500 },
    )
  }
}

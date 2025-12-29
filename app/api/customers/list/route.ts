import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      console.log("[DukaPlus] No credentials cookie found")
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

    const customerList = data.message?.customers || data.customers || []

    const customers = customerList.map((customer: any) => ({
      customer_id: customer.customer_id || customer.id,
      customer_name: customer.customer_name || customer.name,
      mobile_number: customer.mobile_number || customer.mobile_no || customer.phone || customer.mobile || "",
      paid_invoices: customer.paid_invoices || { count: 0, total: 0 },
      unpaid_invoices: customer.unpaid_invoices || { count: 0, total: 0 },
      advance_payments: customer.advance_payments || { count: 0, total: 0 },
      total_sales: customer.total_sales || 0,
    }))

    return NextResponse.json({ customers, message: { customers } })
  } catch (error) {
    console.error("[DukaPlus] Get customers error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch customers" },
      { status: 500 },
    )
  }
}

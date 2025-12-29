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
      console.error("[DukaPlus] Failed to parse credentials:", parseError)
      return NextResponse.json({ message: "Invalid credentials format" }, { status: 401 })
    }

    const warehouse_id = request.nextUrl.searchParams.get("warehouse_id")

    if (!warehouse_id) {
      return NextResponse.json({ message: "Warehouse ID is required" }, { status: 400 })
    }

    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const response = await fetch(
      `${credentials.baseUrl}/api/method/dukaplus.services.rest.get_purchase_invoices?warehouse_id=${encodeURIComponent(warehouse_id)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.text()
      console.error("[DukaPlus] API Error:", { status: response.status, body: errorData })
      return NextResponse.json(
        { message: `Failed to fetch purchase invoices: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    const invoices = (data.message?.data || []).map((invoice: any) => ({
      ...invoice,
      order_id: invoice.purchase_order || invoice.order_id,
    }))

    return NextResponse.json({
      message: {
        status: data.message?.status || 200,
        data: invoices,
      },
    })
  } catch (error) {
    console.error("[DukaPlus] Purchase invoices fetch error:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

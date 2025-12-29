import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsCookie)
    const body = await request.json()

    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const payload: any = {
      invoice_items: body.invoice_items,
      payment_details: body.payment_details,
      warehouse_id: body.warehouse_id,
      customer_name: body.customer_name || "", // Don't default to "Walk In", let backend handle it
      customer_id: body.customer_id || "",
      total_sales_price: body.total_sales_price,
      mobile_number: body.mobile_number || "",
      logged_in_user: body.logged_in_user,
      location: body.location || "",
      sales_date: body.sales_date || "",
    }

    if (body.sales_id) {
      payload.sales_id = body.sales_id
      console.log("[API] Completing existing draft invoice:", body.sales_id)
    }

    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.rest.create_sales_invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Invoice created successfully",
        data: data.message,
        sales_id: data.message?.sales_id || body.sales_id,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: data.message?.message || "Failed to create invoice",
        },
        { status: response.status },
      )
    }
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

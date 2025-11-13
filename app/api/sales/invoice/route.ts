import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const apiKey = process.env.DUKAPLUS_API_KEY || ""
    const apiSecret = process.env.DUKAPLUS_API_SECRET || ""

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/method/dukaplus.services.rest.create_sales_invoice`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${apiKey}:${apiSecret}`,
        },
        body: JSON.stringify({
          invoice_items: body.invoice_items,
          payment_details: body.payment_details,
          warehouse_id: body.warehouse_id,
          customer_name: body.customer_name || "Walk In",
          customer_id: body.customer_id || "Walk In",
          total_sales_price: body.total_sales_price,
          mobile_number: body.mobile_number || "",
          logged_in_user: body.logged_in_user,
          location: body.location || "",
          sales_date: body.sales_date || "",
        }),
      },
    )

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: "Invoice created successfully",
        data: data.message,
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

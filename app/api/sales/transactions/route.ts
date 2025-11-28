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
    const { totalAmount, itemCount, payments } = body

    const authHeader = `token ${credentials.api_key}:${credentials.api_secret}`

    // Build payment breakdown
    const paymentData: any = {
      grand_total: totalAmount,
    }

    if (payments && payments.length > 0) {
      payments.forEach((payment: any) => {
        const modeKey = payment.mode.toLowerCase().replace(/\s+/g, "_")
        paymentData[modeKey] = payment.amount
      })
    } else {
      paymentData.cash = totalAmount
    }

    const response = await fetch(`${credentials.base_url}/api/method/dukaplus.services.rest.create_sales_invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        warehouse_id: body.warehouse_id || "Emidan Farm - DP", // Use provided warehouse or fallback
        customer_name: body.customer_name || "", // Don't hardcode "Walk In"
        ...paymentData,
        timestamp: new Date().toISOString(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({ message: errorData.message || "Transaction failed" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      transactionId: data.message?.name,
      message: "Transaction created successfully",
    })
  } catch (error) {
    console.error("[DukaPlus] Transaction error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsCookie)
    const authHeader = `token ${credentials.api_key}:${credentials.api_secret}`

    const response = await fetch(`${credentials.base_url}/api/method/dukaplus.services.rest.get_sales_report_data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        from_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        to_date: new Date().toISOString().split("T")[0],
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ message: "Failed to fetch transactions" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ transactions: data.message?.data || [] })
  } catch (error) {
    console.error("[DukaPlus] Transactions fetch error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

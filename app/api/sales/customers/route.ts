import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value
    const warehouseId = cookieStore.get("warehouse_id")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    if (!warehouseId) {
      return NextResponse.json({ error: "Missing warehouse_id" }, { status: 400 })
    }

    const credentials = JSON.parse(credentialsCookie)
    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const response = await fetch(
      `${credentials.baseUrl}/api/method/dukaplus.services.rest.get_all_customers?warehouse_id=${warehouseId}`,
      {
        headers: {
          Authorization: authHeader,
        },
      },
    )

    const data = await response.json()
    const formattedData = data.customers.map((customer: any) => ({
      id: customer.customer_id,
      name: customer.customer_name,
      email: customer.customer_email,
      phone: customer.customer_phone,
    }))
    return NextResponse.json(formattedData)
  } catch (error) {
    console.error("Error fetching customers:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

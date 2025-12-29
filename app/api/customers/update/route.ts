import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const credentials = request.cookies.get("tenant_credentials")?.value

    if (!credentials) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { apiUrl, apiKey, apiSecret } = JSON.parse(credentials)

    const response = await fetch(`${apiUrl}/api/method/dukaplus.services.rest.create_customer`, {
      method: "POST",
      headers: {
        Authorization: `token ${apiKey}:${apiSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ message: data.message || "Failed to update customer" }, { status: response.status })
    }

    return NextResponse.json({ message: "Customer updated successfully", customer: data.message })
  } catch (error) {
    console.error("[DukaPlus] Update Customer API Error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const cookieStore = await cookies()
    const tenantCred = cookieStore.get("tenant_credentials")?.value

    if (!tenantCred) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const credentials = JSON.parse(decodeURIComponent(tenantCred))

    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.rest.submit_expense`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${credentials.apiKey}:${credentials.apiSecret}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error submitting expense:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

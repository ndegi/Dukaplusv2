import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const credentialsCookie = cookieStore.get("tenant_credentials")?.value

    if (!credentialsCookie) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const credentials = JSON.parse(credentialsCookie)
    const warehouse_id = request.nextUrl.searchParams.get("warehouse_id") || "Emidan Farm - DP"

    const authHeader = `token ${credentials.apiKey}:${credentials.apiSecret}`

    const response = await fetch(
      `${credentials.baseUrl}/api/method/dukaplus.services.rest.get_expense_categories?warehouse_id=${encodeURIComponent(warehouse_id)}`,
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
      console.error("API Error:", errorData)
      return NextResponse.json(
        { message: `Failed to fetch expense categories: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    const categories = data.message?.expense_categories || []

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Expense categories fetch error:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

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

    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.rest.create_expense_category`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Category creation error:", data)
      return NextResponse.json({ message: data.message || "Failed to create category" }, { status: response.status })
    }

    return NextResponse.json({ success: true, message: "Category created successfully", data })
  } catch (error) {
    console.error("Category creation error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

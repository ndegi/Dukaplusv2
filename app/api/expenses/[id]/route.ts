import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const tenantCreds = cookieStore.get("tenant_credentials")?.value
    if (!tenantCreds) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const creds = JSON.parse(tenantCreds)
    const body = await request.json()

    const response = await fetch(`${creds.baseUrl}/api/method/dukaplus.services.rest.update_expense`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${creds.apiKey}:${creds.apiSecret}`,
      },
      body: JSON.stringify({ expense_name: params.id, ...body }),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Update expense error:", error)
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const tenantCreds = cookieStore.get("tenant_credentials")?.value
    if (!tenantCreds) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const creds = JSON.parse(tenantCreds)

    const response = await fetch(`${creds.baseUrl}/api/method/dukaplus.services.rest.cancel_expense`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${creds.apiKey}:${creds.apiSecret}`,
      },
      body: JSON.stringify({ expense_name: params.id }),
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Delete expense error:", error)
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const tenantCreds = cookieStore.get("tenant_credentials")?.value
    if (!tenantCreds) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const creds = JSON.parse(tenantCreds)
    const url = new URL(request.url)
    const isSubmit = url.pathname.includes("/submit")

    if (isSubmit) {
      const response = await fetch(`${creds.baseUrl}/api/method/dukaplus.services.rest.submit_expense`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${creds.apiKey}:${creds.apiSecret}`,
        },
        body: JSON.stringify({ expense_name: params.id }),
      })

      const data = await response.json()
      return NextResponse.json(data)
    }
  } catch (error) {
    console.error("[v0] Expense action error:", error)
    return NextResponse.json({ error: "Failed to process expense" }, { status: 500 })
  }
}

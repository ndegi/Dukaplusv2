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
      `${credentials.baseUrl}/api/method/dukaplus.services.rest.get_all_products?warehouse_id=${encodeURIComponent(warehouse_id)}`,
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
      return NextResponse.json({ message: `Failed to fetch products: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()

    const products = (data.message?.products || []).map((item: any) => ({
      id: item.product_id,
      name: item.product_name,
      sku: item.sku || item.product_name,
      category: item.product_category || "Uncategorized",
      quantity: Number.parseFloat(item.qty_in_store) || 0,
      reorderLevel: 10,
      price: Number.parseFloat(item.price) || 0,
      cost: Number.parseFloat(item.cost) || 0,
      barcode: item.barcode,
      colorCode: item.color_code,
      description: item.description,
      img: item.img || null,
      all_selling_prices: item.all_selling_prices || [],
      lastUpdated: new Date().toISOString(),
      status:
        Number.parseFloat(item.qty_in_store) === 0
          ? "out_of_stock"
          : Number.parseFloat(item.qty_in_store) <= 10
            ? "low_stock"
            : "in_stock",
    }))

    return NextResponse.json({ products })
  } catch (error) {
    console.error("Inventory fetch error:", error)
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

    const response = await fetch(`${credentials.baseUrl}/api/method/dukaplus.services.rest.create_product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Product creation error:", data)
      return NextResponse.json({ message: data.message || "Failed to create product" }, { status: response.status })
    }

    return NextResponse.json({ success: true, message: "Product created successfully", data })
  } catch (error) {
    console.error("Product creation error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

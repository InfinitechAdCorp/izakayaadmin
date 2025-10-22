import { type NextRequest, NextResponse } from "next/server"

const LARAVEL_API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authToken = request.headers.get("Authorization")

    if (!authToken) {
      return NextResponse.json({ success: false, message: "Authorization token required" }, { status: 401 })
    }

    const { id } = params

    const response = await fetch(`${LARAVEL_API_BASE}/api/orders/${id}`, {
      method: "GET",
      headers: {
        Authorization: authToken,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Admin-Request": "true",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || "Failed to fetch order" },
        { status: response.status },
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("[v0] Error fetching order:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authToken = request.headers.get("Authorization")

    if (!authToken) {
      console.error("[v0] PATCH /api/orders/[id]: No authorization token provided")
      return NextResponse.json({ success: false, message: "Authorization token required" }, { status: 401 })
    }

    const { id } = params
    console.log(`[v0] PATCH /api/orders/${id}: Starting request processing`)

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[v0] PATCH /api/orders/[id]: Failed to parse request body:", parseError)
      return NextResponse.json({ success: false, message: "Invalid JSON in request body" }, { status: 400 })
    }

    console.log(`[v0] PATCH /api/orders/${id}: Request body:`, body)

    if (!body.status) {
      console.error("[v0] PATCH /api/orders/[id]: Status field is missing")
      return NextResponse.json({ success: false, message: "Status is required" }, { status: 400 })
    }

    const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"]
    if (!validStatuses.includes(body.status)) {
      console.error(`[v0] PATCH /api/orders/${id}: Invalid status value: ${body.status}`)
      return NextResponse.json({ success: false, message: "Invalid status value" }, { status: 400 })
    }

    const laravelUrl = `${LARAVEL_API_BASE}/api/orders/${id}`
    const requestHeaders = {
      Authorization: authToken,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Admin-Request": "true",
    }
    const requestPayload = { order_status: body.status }

    console.log(`[v0] PATCH /api/orders/${id}: Full Laravel URL:`, laravelUrl)
    console.log(`[v0] PATCH /api/orders/${id}: Request payload:`, requestPayload)

    let response
    let fetchError = null

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      console.log(`[v0] PATCH /api/orders/${id}: Making fetch request...`)

      response = await fetch(laravelUrl, {
        method: "PATCH",
        headers: requestHeaders,
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      console.log(`[v0] PATCH /api/orders/${id}: Fetch completed successfully`)
    } catch (error) {
      fetchError = error
      const err = error as Error
      console.error(`[v0] PATCH /api/orders/${id}: Fetch failed with error:`, {
        name: err.name,
        message: err.message,
      })

      if (err.name === "AbortError") {
        return NextResponse.json(
          {
            success: false,
            message: "Request timed out - Laravel server may be down or slow",
            error: "TIMEOUT_ERROR",
          },
          { status: 504 },
        )
      }

      if (err.message.includes("ECONNREFUSED")) {
        return NextResponse.json(
          {
            success: false,
            message: "Cannot connect to Laravel server - check if it's running",
            error: "CONNECTION_REFUSED",
          },
          { status: 503 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: `Network error: ${err.message}`,
          error: "NETWORK_ERROR",
        },
        { status: 503 },
      )
    }

    console.log(`[v0] PATCH /api/orders/${id}: Response received:`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    })

    let data
    try {
      const responseText = await response.text()
      console.log(`[v0] PATCH /api/orders/${id}: Raw response text:`, responseText)

      if (!responseText) {
        return NextResponse.json(
          {
            success: false,
            message: "Empty response from Laravel server",
            error: "EMPTY_RESPONSE",
          },
          { status: 502 },
        )
      }

      data = JSON.parse(responseText)
      console.log(`[v0] PATCH /api/orders/${id}: Parsed response data:`, data)
    } catch (parseError) {
      console.error(`[v0] PATCH /api/orders/${id}: Failed to parse Laravel response`)
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON response from Laravel server",
          error: "INVALID_JSON_RESPONSE",
        },
        { status: 502 },
      )
    }

    if (!response.ok) {
      console.error(`[v0] PATCH /api/orders/${id}: Laravel API returned error:`, data)
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Failed to update order",
          laravelError: data.error || null,
          laravelStatus: response.status,
        },
        { status: response.status },
      )
    }

    console.log(`[v0] PATCH /api/orders/${id}: Successfully updated order`)
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    const err = error as Error
    console.error(`[v0] PATCH /api/orders/[id]: Unexpected error in handler:`, {
      name: err.name,
      message: err.message,
    })
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error in Next.js API route",
        error: "INTERNAL_ERROR",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return PATCH(request, { params })
}

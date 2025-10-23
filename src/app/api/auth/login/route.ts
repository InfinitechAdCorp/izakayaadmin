import { type NextRequest, NextResponse } from "next/server"

async function verifyCaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    console.error("[v0] RECAPTCHA_SECRET_KEY is not set")
    return false
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    })

    const data = await response.json()
    if (!data.success) {
      console.error("[v0] reCAPTCHA error codes:", data["error-codes"])
    }

    return data.success === true
  } catch (error) {
    console.error("[v0] CAPTCHA verification error:", error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, captchaToken } = body

    if (!captchaToken) {
      return NextResponse.json(
        {
          success: false,
          message: "CAPTCHA verification is required. CAPTCHA 검증이 필요합니다.",
          errors: {
            captcha: ["CAPTCHA token is missing"],
          },
        },
        { status: 400 },
      )
    }

    const isCaptchaValid = await verifyCaptcha(captchaToken)
    if (!isCaptchaValid) {
      return NextResponse.json(
        {
          success: false,
          message: "CAPTCHA verification failed. Please try again. CAPTCHA 검증에 실패했습니다.",
          errors: {
            captcha: ["CAPTCHA verification failed"],
          },
        },
        { status: 400 },
      )
    }

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required. 이메일과 비밀번호는 필수 항목입니다.",
          errors: {
            email: !body.email ? ["Email is required"] : [],
            password: !body.password ? ["Password is required"] : [],
          },
        },
        { status: 400 },
      )
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    const fullUrl = `${apiUrl}/api/auth/login`

    const requestData = {
      email: body.email.trim().toLowerCase(),
      password: body.password,
    }

    // Send to Laravel backend
    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestData),
    })

    let data
    const responseText = await response.text()

    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[v0] Failed to parse response as JSON:", parseError)

      return NextResponse.json(
        {
          success: false,
          message: "Invalid response from server. Server may be down or returning HTML error page.",
          error: "Invalid JSON response",
          rawResponse: responseText.substring(0, 500),
          debug: {
            url: fullUrl,
            status: response.status,
            statusText: response.statusText,
          },
        },
        { status: 502 },
      )
    }

    // Return the response with the same status code
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error: unknown) {
    console.error("[v0] Login error:", error instanceof Error ? error.message : String(error))

    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot connect to the server. 서버에 연결할 수 없습니다.",
          error: "Connection failed",
          debug: {
            errorType: "NetworkError",
            errorMessage: error instanceof Error ? error.message : String(error),
            apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
          },
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: "Login failed. Please try again later. 로그인에 실패했습니다. 나중에 다시 시도해 주세요.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Eye, EyeOff, LogIn, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Toaster } from "sonner"

declare global {
  interface Window {
    grecaptcha: {
      render: (element: string, options: object) => number
      getResponse: (widgetId?: number) => string
      reset: (widgetId?: number) => void
    }
    onRecaptchaLoad?: () => void
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [captchaReady, setCaptchaReady] = useState(false)
  const [captchaWidgetId, setCaptchaWidgetId] = useState<number | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  const isRenderingRef = useRef(false)
  const router = useRouter()

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallButton(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      toast.info("This app can be installed on your device. Use your browser's menu to install it.")
      return
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        toast.success("The app has been successfully installed on your device.")
        setShowInstallButton(false)
      }

      setDeferredPrompt(null)
    } catch (error) {
      console.error("[v0] Install error:", error)
      toast.error("Could not install the app. Please try again.")
    }
  }

  useEffect(() => {
    const renderCaptcha = () => {
      if (isRenderingRef.current) return

      const container = document.getElementById("recaptcha-container")
      if (!container || !window.grecaptcha) return

      if (container.innerHTML.trim() !== "") {
        console.log("[v0] reCAPTCHA already rendered, skipping")
        setCaptchaReady(true)
        return
      }

      isRenderingRef.current = true

      try {
        const widgetId = window.grecaptcha.render("recaptcha-container", {
          sitekey: "6LfqwPIrAAAAAPLhnsOuUTFwddCB0pzqcvy_4Nid",
          theme: "light",
        })
        setCaptchaWidgetId(widgetId)
        setCaptchaReady(true)
        console.log("[v0] reCAPTCHA rendered successfully")
      } catch (error) {
        console.error("[v0] reCAPTCHA render error:", error)
        isRenderingRef.current = false
      }
    }

    window.onRecaptchaLoad = renderCaptcha

    const existingScript = document.querySelector('script[src*="recaptcha"]')

    if (!existingScript) {
      const script = document.createElement("script")
      script.src = "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit"
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    } else if (window.grecaptcha) {
      renderCaptcha()
    }

    return () => {
      delete window.onRecaptchaLoad
    }
  }, [])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all required fields.")
      return
    }

    const captchaToken = window.grecaptcha?.getResponse(captchaWidgetId || undefined)
    if (!captchaToken) {
      toast.error("Please complete the CAPTCHA verification.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          captchaToken,
        }),
      })

      const data = await response.json()

      console.log("[v0] Login Response Status:", response.status)
      console.log("[v0] Login Response Data:", data)

      if (response.ok && data.success) {
        toast.success("Welcome back to Izakaya Tori Ichizu!")

        setTimeout(() => {
          router.push("/admin/dashboard")
        }, 1500)
      } else {
        const errorMessage = data.message || "Login failed. Please try again."
        console.error("[v0] Login Error Details:", { 
          status: response.status,
          errorMessage, 
          fullData: data 
        })

        // Check for rate limiting messages
        const messageLower = errorMessage.toLowerCase()
        if (messageLower.includes("too many") || messageLower.includes("attempts") || messageLower.includes("try again")) {
          // Display the exact message from backend which includes timing info
          toast.error(errorMessage, {
            duration: 5000,
          })
        } else if (response.status === 429) {
          toast.error("Too many login attempts. Please wait before trying again.", {
            duration: 5000,
          })
        } else if (response.status === 401) {
          toast.error("Invalid email or password. Please check your credentials and try again.")
        } else if (response.status === 400) {
          if (messageLower.includes("captcha")) {
            toast.error("CAPTCHA verification failed. Please try again.")
          } else {
            toast.error(errorMessage)
          }
        } else if (response.status === 503) {
          toast.error("Cannot connect to the server. Please ensure Laravel is running on http://localhost:8000")
        } else {
          // Display any other error message from backend
          toast.error(errorMessage)
        }
        
        window.grecaptcha?.reset(captchaWidgetId || undefined)
      }
    } catch (error) {
      console.error("[v0] Login Exception:", error)
      toast.error("Connection error. Please check your internet connection and try again.")
      window.grecaptcha?.reset(captchaWidgetId || undefined)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="min-h-screen py-8 bg-gradient-to-br from-black via-orange-900 to-yellow-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-yellow-400 rounded-full"></div>
          <div className="absolute top-32 right-20 w-24 h-24 border-2 border-orange-400 rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 border-2 border-yellow-400 rounded-full"></div>
          <div className="absolute bottom-32 right-10 w-28 h-28 border-2 border-orange-400 rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md bg-white shadow-2xl border-4 border-orange-400 !p-0">
            <CardHeader className="text-center bg-gradient-to-r from-orange-500 to-yellow-500 rounded-t-lg !p-0 px-6 py-4 !m-0">
              <CardTitle className="text-3xl text-white mb-2 !mt-0">Izakaya Tori Ichizu</CardTitle>
              <h2 className="text-2xl text-white font-bold">Admin Login</h2>
              <p className="text-white/90 mt-2">Welcome back!</p>
            </CardHeader>
            <CardContent className="pt-6 p-6">
              {showInstallButton && (
                <button
                  onClick={handleInstallApp}
                  className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App</span>
                </button>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="email" className="text-black font-semibold flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-orange-500" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="border-2 border-orange-300 bg-white text-black placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-400/30 h-12 text-base"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-black font-semibold flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-orange-500" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="border-2 border-orange-300 bg-white text-black placeholder:text-gray-400 focus:border-orange-500 focus:ring-orange-400/30 h-12 text-base pr-10"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-500 hover:text-orange-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center py-2">
                  <div id="recaptcha-container" />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold py-3 h-14 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  size="lg"
                  disabled={isSubmitting || !captchaReady}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      <span>Logging in...</span>
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <LogIn className="w-4 h-4 mr-2" />
                      <span>Login</span>
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Toaster position="top-center" richColors />
    </>
  )
}
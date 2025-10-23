"use client"

import { useEffect, useState } from "react"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Download, FileText } from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface AnalyticsData {
  keyMetrics: {
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    totalCustomers: number
    growthRate: number
  }
  revenueData: Array<{ date: string; revenue: number; orders: number }>
  orderStatusData: Array<{ status: string; count: number; percentage: number }>
  paymentMethodData: Array<{ method: string; count: number; percentage: number }>
  popularProducts: Array<{ name: string; orders: number; revenue: number; category: string; is_spicy: boolean }>
  categoryData: Array<{ category: string; orders: number; revenue: number }>
  productsCount: number
  totalReservations: number
}

type TimePeriod = "daily" | "weekly" | "quarterly" | "yearly"

const statusColors = {
  delivered: "#ef4444",
  preparing: "#f97316",
  confirmed: "#ea580c",
  ready: "#dc2626",
  pending: "#fbbf24",
  cancelled: "#6b7280",
}

const paymentColors = {
  gcash: "#ef4444",
  cash: "#f97316",
  maya: "#ea580c",
  bpi: "#dc2626",
  paypal: "#fbbf24",
}

async function exportToPDF(analytics: AnalyticsData, timePeriod: string) {
  const { jsPDF } = await import("jspdf")
  const autoTable = await import("jspdf-autotable")

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPosition = margin

  doc.setFillColor(220, 38, 38)
  doc.rect(0, 0, pageWidth, 35, "F")

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont("helvetica", "bold")
  doc.text("Restaurant Analytics Report", margin, 15)

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  const periodText = `Period: ${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)}`
  const generatedText = `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} at ${new Date().toLocaleTimeString()}`

  doc.text(periodText, margin, 24)
  doc.text(generatedText, margin, 30)

  yPosition = 45

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Key Metrics", margin, yPosition)

  const metricsTableData = [
    ["Metric", "Value"],
    ["Total Revenue", `P${(analytics.keyMetrics?.totalRevenue || 0).toLocaleString()}`],
    ["Total Orders", String(analytics.keyMetrics?.totalOrders || 0)],
    ["Average Order Value", `P${(analytics.keyMetrics?.averageOrderValue || 0).toLocaleString()}`],
    ["Total Customers", String(analytics.keyMetrics?.totalCustomers || 0)],
    ["Total Reservations", String(analytics.totalReservations || 0)],
    ["Growth Rate", `+${analytics.keyMetrics?.growthRate || 0}%`],
  ]

  autoTable.default(doc, {
    head: [metricsTableData[0]],
    body: metricsTableData.slice(1),
    startY: yPosition + 6,
    margin: { left: margin, right: margin },
    theme: "grid",
    headStyles: {
      fillColor: [220, 38, 38],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 11,
      halign: "left",
      valign: "middle",
      lineColor: [200, 0, 0],
      lineWidth: 0.5,
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      fontSize: 10,
      halign: "left",
      valign: "middle",
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [255, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 90, halign: "left" },
      1: { cellWidth: 90, halign: "right" },
    },
  })

  yPosition = (doc as any).lastAutoTable.finalY + 12

  if (analytics.popularProducts && analytics.popularProducts.length > 0) {
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("Popular Products", margin, yPosition)

    const productsTableData = [
      ["Product Name", "Category", "Orders", "Revenue"],
      ...analytics.popularProducts
        .slice(0, 10)
        .map((p) => [
          (p.name || "").substring(0, 20),
          (p.category || "").substring(0, 12),
          String(p.orders || 0),
          `P${(p.revenue || 0).toLocaleString()}`,
        ]),
    ]

    autoTable.default(doc, {
      head: [productsTableData[0]],
      body: productsTableData.slice(1),
      startY: yPosition + 6,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: {
        fillColor: [249, 115, 22],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
        halign: "center",
        valign: "middle",
        lineColor: [200, 80, 0],
        lineWidth: 0.5,
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontSize: 9,
        halign: "left",
        valign: "middle",
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [255, 250, 240],
      },
      columnStyles: {
        0: { cellWidth: 50, halign: "left" },
        1: { cellWidth: 35, halign: "center" },
        2: { cellWidth: 30, halign: "center" },
        3: { cellWidth: 65, halign: "right" },
      },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 12
  }

  if (analytics.categoryData && analytics.categoryData.length > 0) {
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(0, 0, 0)
    doc.text("Category Performance", margin, yPosition)

    const categoryTableData = [
      ["Category", "Orders", "Revenue"],
      ...analytics.categoryData.map((c) => [
        c.category || "",
        String(c.orders || 0),
        `P${(c.revenue || 0).toLocaleString()}`,
      ]),
    ]

    autoTable.default(doc, {
      head: [categoryTableData[0]],
      body: categoryTableData.slice(1),
      startY: yPosition + 6,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 10,
        halign: "center",
        valign: "middle",
        lineColor: [200, 0, 0],
        lineWidth: 0.5,
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        fontSize: 9,
        halign: "left",
        valign: "middle",
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
        cellPadding: 3,
      },
      alternateRowStyles: {
        fillColor: [255, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 80, halign: "left" },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 70, halign: "right" },
      },
    })
  }

  const totalPages = (doc as any).internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)

    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25)

    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    const pageNumberText = `Page ${i} of ${totalPages}`
    doc.text(pageNumberText, pageWidth - margin - 15, pageHeight - 20)

    if (i === totalPages) {
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("Authorized Signature:", margin, pageHeight - 18)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.line(margin, pageHeight - 12, margin + 40, pageHeight - 12)
      doc.text("Signature", margin, pageHeight - 8)

      doc.line(margin + 50, pageHeight - 12, margin + 90, pageHeight - 12)
      doc.text("Date", margin + 50, pageHeight - 8)
    }
  }

  doc.save(`analytics-report-${timePeriod}-${new Date().toISOString().split("T")[0]}.pdf`)
}

async function exportToExcel(analytics: AnalyticsData, timePeriod: string) {
  const XLSX = await import("xlsx")

  const workbook = XLSX.utils.book_new()

  const metricsData = [
    ["Metric", "Value"],
    ["Total Revenue", `₱${analytics.keyMetrics?.totalRevenue || 0}`],
    ["Total Orders", analytics.keyMetrics?.totalOrders || 0],
    ["Average Order Value", `₱${analytics.keyMetrics?.averageOrderValue || 0}`],
    ["Total Customers", analytics.keyMetrics?.totalCustomers || 0],
    ["Total Reservations", analytics.totalReservations || 0],
    ["Growth Rate", `${analytics.keyMetrics?.growthRate || 0}%`],
  ]
  const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData)
  XLSX.utils.book_append_sheet(workbook, metricsSheet, "Key Metrics")

  if (analytics.revenueData.length > 0) {
    const revenueSheet = XLSX.utils.json_to_sheet(analytics.revenueData)
    XLSX.utils.book_append_sheet(workbook, revenueSheet, "Revenue Trends")
  }

  if (analytics.popularProducts.length > 0) {
    const productsSheet = XLSX.utils.json_to_sheet(analytics.popularProducts)
    XLSX.utils.book_append_sheet(workbook, productsSheet, "Popular Products")
  }

  if (analytics.categoryData.length > 0) {
    const categorySheet = XLSX.utils.json_to_sheet(analytics.categoryData)
    XLSX.utils.book_append_sheet(workbook, categorySheet, "Category Performance")
  }

  XLSX.writeFile(workbook, `analytics-report-${timePeriod}-${new Date().toISOString().split("T")[0]}.xlsx`)
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly")
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        console.log("[v0] Fetching analytics from /api/dashboard...")
        const response = await fetch("/api/dashboard")
        console.log("[v0] Response status:", response.status)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("[v0] API Response:", data)

        if (data.success) {
          setAnalytics(data.data)
          if (data.data.error) {
            setApiError(data.data.error)
          }
          console.log("[v0] Analytics data set successfully")
        } else {
          throw new Error(data.message || "Failed to fetch analytics")
        }
      } catch (error) {
        console.error("[v0] Failed to fetch analytics:", error)
        setError(error instanceof Error ? error.message : "Unknown error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const handleExportPDF = async () => {
    if (!analytics) return
    setExporting(true)
    try {
      await exportToPDF(analytics, timePeriod)
    } catch (error) {
      console.error("Failed to export PDF:", error)
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    if (!analytics) return
    setExporting(true)
    try {
      await exportToExcel(analytics, timePeriod)
    } catch (error) {
      console.error("Failed to export Excel:", error)
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="flex min-h-screen w-full bg-gradient-to-br from-orange-50 to-red-50">
          <AppSidebar />
          <div className={`flex-1 min-w-0 ${isMobile ? "ml-0" : "ml-72"}`}>
            <div className="flex items-center justify-center min-h-screen w-full">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                <span className="text-gray-700 font-medium">Loading analytics...</span>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  if (error || !analytics) {
    return (
      <SidebarProvider defaultOpen={!isMobile}>
        <div className="flex min-h-screen w-full bg-gradient-to-br from-orange-50 to-red-50">
          <AppSidebar />
          <div className={`flex-1 min-w-0 ${isMobile ? "ml-0" : "ml-72"}`}>
            <div className="flex items-center justify-center min-h-screen w-full">
              <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg max-w-md">
                <h2 className="text-2xl font-bold text-red-800 mb-4">Failed to load analytics</h2>
                <p className="text-red-600 mb-4">{error || "No data available"}</p>
                <p className="text-sm text-red-500 mb-4">
                  Please ensure your API server is running and properly configured.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  console.log("[v0] Rendering dashboard with analytics:", analytics)

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-orange-50 to-red-50">
        <AppSidebar />
        <div className={`flex-1 min-w-0 ${isMobile ? "ml-0" : "ml-72"}`}>
          {isMobile && (
            <div className="sticky top-0 z-50 flex h-12 items-center gap-2 border-b bg-white/90 backdrop-blur-sm px-4 md:hidden shadow-sm">
              <SidebarTrigger className="-ml-1" />
              <span className="text-sm font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Dashboard
              </span>
            </div>
          )}
          <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-orange-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                      Admin Dashboard
                    </h1>
                    <p className="text-orange-700 text-base sm:text-lg">Restaurant Analytics & Insights</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      {(["daily", "weekly", "quarterly", "yearly"] as TimePeriod[]).map((period) => (
                        <Button
                          key={period}
                          onClick={() => setTimePeriod(period)}
                          variant={timePeriod === period ? "default" : "outline"}
                          className={`capitalize ${
                            timePeriod === period
                              ? "bg-orange-600 hover:bg-orange-700 text-white"
                              : "border-orange-300 text-orange-700 hover:bg-orange-50"
                          }`}
                        >
                          {period}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleExportPDF}
                        disabled={exporting}
                        className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                      >
                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        PDF
                      </Button>
                      <Button
                        onClick={handleExportExcel}
                        disabled={exporting}
                        className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                      >
                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Excel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="border-red-200 bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-100">Total Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₱{(analytics.keyMetrics?.totalRevenue || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-red-100 mt-1">
                      +{analytics.keyMetrics?.growthRate || 0}% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-orange-200 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-orange-100">Total Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(analytics.keyMetrics?.totalOrders || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-orange-100 mt-1">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-gradient-to-br from-red-600 to-orange-600 text-white shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-red-100">Avg Order Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ₱{(analytics.keyMetrics?.averageOrderValue || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-red-100 mt-1">Per order average</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-gradient-to-br from-red-600 to-orange-600 text-white shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-orange-100">Total Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(analytics.keyMetrics?.totalCustomers || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-orange-100 mt-1">Unique customers</p>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-gradient-to-br from-red-600 to-orange-600 text-white shadow-xl">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-orange-100">Total Reservations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(analytics.totalReservations || 0).toLocaleString()}</div>
                    <p className="text-xs text-orange-100 mt-1">All reservations</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-red-200 bg-white/70 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-red-800">Revenue Trends</CardTitle>
                  <CardDescription className="text-red-600">
                    Daily revenue and order count for the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.revenueData && analytics.revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#fecaca" />
                        <XAxis dataKey="date" stroke="#dc2626" />
                        <YAxis stroke="#dc2626" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                          }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#ef4444" fill="#fecaca" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-red-200 bg-white/70 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-red-800">Order Status Distribution</CardTitle>
                    <CardDescription className="text-red-600">Current order status breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.orderStatusData && analytics.orderStatusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={analytics.orderStatusData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="count"
                            label={({ status, percentage }) => `${status} (${percentage}%)`}
                          >
                            {analytics.orderStatusData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={statusColors[entry.status as keyof typeof statusColors]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-gray-500">
                        No order status data available
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-white/70 backdrop-blur-sm shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-red-800">Payment Methods</CardTitle>
                    <CardDescription className="text-red-600">Payment method preferences</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analytics.paymentMethodData && analytics.paymentMethodData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={analytics.paymentMethodData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#fecaca" />
                          <XAxis dataKey="method" stroke="#dc2626" />
                          <YAxis stroke="#dc2626" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#fef2f2",
                              border: "1px solid #fecaca",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar dataKey="count" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-gray-500">
                        No payment method data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-red-200 bg-white/70 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-red-800">Popular Products</CardTitle>
                  <CardDescription className="text-red-600">Top selling items by order count</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.popularProducts && analytics.popularProducts.length > 0 ? (
                    <div className="space-y-4">
                      {analytics.popularProducts.map((product, index) => (
                        <div
                          key={product.name}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-red-800">{product.name}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                                  {product.category}
                                </Badge>
                                {product.is_spicy && (
                                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                                    🌶️ Spicy
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-800">{product.orders} orders</div>
                            <div className="text-sm text-red-600">₱{product.revenue.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-gray-500">No popular products data available</div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-white/70 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-red-800">Category Performance</CardTitle>
                  <CardDescription className="text-red-600">Revenue by product category</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.categoryData && analytics.categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.categoryData} layout="horizontal" margin={{ left: 0, right: 20, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#fecaca" />
                        <XAxis type="number" stroke="#dc2626" />
                        <YAxis 
                          dataKey="category" 
                          type="category" 
                          stroke="#dc2626" 
                          width={80}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fef2f2",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="revenue" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-500">
                      No category data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

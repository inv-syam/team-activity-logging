import { NextResponse } from "next/server"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { google } from "googleapis"

export const runtime = "nodejs" // ✅ VERY IMPORTANT

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const employee = searchParams.get("employee") || "All Employees"
    const from = searchParams.get("from") || "N/A"
    const to = searchParams.get("to") || "N/A"
    const type = searchParams.get("type") || "all"

    const sheetId = process.env.GOOGLE_SHEET_ID!

    // ✅ Google Auth
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })

    const sheets = google.sheets({ version: "v4", auth })

    // ✅ Read Sheet Data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Activities!A:I",
    })

    const rows = response.data.values || []
    const data = rows.slice(1)

    // ✅ Filter Data
    const filtered = data.filter((row) => {
      const name = row[2]
      const status = row[7]
      const blocker = row[8]

      if (employee !== "All Employees" && name !== employee) return false

      if (type === "pending" && status !== "pending") return false
      if (type === "completed" && status !== "completed") return false
      if (type === "blocker" && blocker !== "TRUE") return false

      return true
    })

    // ✅ Create PDF
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text("Activity Report", 20, 20)

    doc.setFontSize(12)
    doc.text(`Employee: ${employee}`, 20, 30)
    doc.text(`From: ${from}  To: ${to}`, 20, 38)
    doc.text(`Type: ${type.toUpperCase()}`, 20, 46)

    // ✅ Table Data
    const tableBody = filtered.slice(0, 15).map((row) => [
      row[2], // Name
      row[5], // Date
      row[3], // Type
      row[4], // Description
      row[6] + " min", // Duration
      row[7], // Status
    ])

    // ✅ Correct AutoTable Call
    autoTable(doc, {
      head: [["Name", "Date", "Type", "Description", "Duration", "Status"]],
      body: tableBody,
      startY: 55,
      styles: { fontSize: 9 },
    })

    // ✅ Convert PDF to Buffer
    const pdfBuffer = doc.output("arraybuffer")

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="Activity_Report.pdf"',
      },
    })
  } catch (err) {
    console.error("PDF Export Error:", err)

    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}

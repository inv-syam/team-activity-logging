import { NextResponse } from "next/server"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { google } from "googleapis"
import fs from "fs"
import path from "path"

export const runtime = "nodejs"

// ── Design System Constants (matching PPT theme) ────────────────────────
const NAVY = [15, 23, 42] as const       // #0F172A
const NAVY_800 = [30, 41, 59] as const   // #1E293B
const BLUE_700 = [29, 78, 216] as const  // #1D4ED8
const BLUE_600 = [37, 99, 235] as const  // #2563EB
const BLUE_500 = [59, 130, 246] as const // #3B82F6
const BLUE_100 = [219, 234, 254] as const// #DBEAFE
const SLATE_50 = [248, 250, 252] as const// #F8FAFC
const SLATE_700 = [51, 65, 85] as const  // #334155
const WHITE = [255, 255, 255] as const
const GREEN = [16, 185, 129] as const    // #10B981
const GREEN_DARK = [5, 150, 105] as const// #059669
const AMBER = [245, 158, 11] as const    // #F59E0B
const RED = [239, 68, 68] as const       // #EF4444
const GRAY_200 = [226, 232, 240] as const// #E2E8F0
const GRAY_300 = [203, 213, 225] as const// #CBD5E1
const CYAN = [6, 182, 212] as const      // #06B6D4
const CYAN_DARK = [8, 145, 178] as const // #0891B2

const PAGE_W = 210 // A4 width mm
const PAGE_H = 297 // A4 height mm
const MARGIN = 12

// jsPDF with graphics-state plugin (save/restore, GState) — not in @types/jspdf
type JsPDFWithGState = jsPDF & {
  saveGraphicsState(): void
  restoreGraphicsState(): void
  setGState(g: unknown): void
  GState: new (opts: { opacity: number }) => unknown
}

// ── Helper: Draw rounded rectangle ──────────────────────────────────────
function drawRoundedRect(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  r: number,
  options: { fill?: readonly number[]; stroke?: readonly number[]; lineWidth?: number }
) {
  if (options.fill) {
    doc.setFillColor(options.fill[0], options.fill[1], options.fill[2])
  }
  if (options.stroke) {
    doc.setDrawColor(options.stroke[0], options.stroke[1], options.stroke[2])
    doc.setLineWidth(options.lineWidth || 0.3)
  }
  const style = options.fill && options.stroke ? "FD" : options.fill ? "F" : "S"
  doc.roundedRect(x, y, w, h, r, r, style)
}

// ── Helper: Draw circle ─────────────────────────────────────────────────
function drawCircle(
  doc: jsPDF,
  x: number, y: number, r: number,
  color: readonly number[], opacity?: number
) {
  const d = doc as JsPDFWithGState
  d.saveGraphicsState()
  if (opacity !== undefined) {
    const gState = new d.GState({ opacity })
    d.setGState(gState)
  }
  doc.setFillColor(color[0], color[1], color[2])
  doc.circle(x, y, r, "F")
  d.restoreGraphicsState()
}

// ── Helper: Draw KPI card ───────────────────────────────────────────────
function drawKpiCard(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  label: string, value: string, accent: readonly number[], icon: string
) {
  // Card background
  drawRoundedRect(doc, x, y, w, h, 2, { fill: WHITE, stroke: GRAY_200, lineWidth: 0.3 })

  // Colored top strip
  doc.setFillColor(accent[0], accent[1], accent[2])
  doc.rect(x, y, w, 1.5, "F")

  // Icon circle
  drawCircle(doc, x + w / 2, y + 6, 4, accent)
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(icon, x + w / 2, y + 7.2, { align: "center" })

  // Value
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2])
  doc.text(value, x + w / 2, y + 17, { align: "center" })

  // Label
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(SLATE_700[0], SLATE_700[1], SLATE_700[2])
  doc.text(label.toUpperCase(), x + w / 2, y + 22, { align: "center" })
}

// ── Helper: Draw stat row ───────────────────────────────────────────────
function drawStatRow(
  doc: jsPDF,
  x: number, y: number, w: number, h: number,
  label: string, value: string, accent: readonly number[], icon: string
) {
  // Card bg
  drawRoundedRect(doc, x, y, w, h, 2, { fill: WHITE, stroke: GRAY_200, lineWidth: 0.3 })

  // Left accent bar
  doc.setFillColor(accent[0], accent[1], accent[2])
  doc.rect(x, y + 2, 1.2, h - 4, "F")

  // Icon circle
  drawCircle(doc, x + 8, y + h / 2, 3.5, [...accent] as unknown as readonly number[])
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text(icon, x + 8, y + h / 2 + 1.2, { align: "center" })

  // Label
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(SLATE_700[0], SLATE_700[1], SLATE_700[2])
  doc.text(label.toUpperCase(), x + 15, y + h / 2 - 2)

  // Value
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2])
  doc.text(value, x + 15, y + h / 2 + 4)
}

// ── Helper: Draw horizontal bar ─────────────────────────────────────────
function drawHorizontalBar(
  doc: jsPDF,
  x: number, y: number, maxW: number, h: number,
  value: number, maxValue: number,
  color: readonly number[], label: string, showValue: boolean
) {
  const barW = maxValue > 0 ? (value / maxValue) * maxW : 0

  // Bar background track
  doc.setFillColor(SLATE_50[0], SLATE_50[1], SLATE_50[2])
  doc.roundedRect(x, y, maxW, h, 1.5, 1.5, "F")

  // Filled bar
  if (barW > 0) {
    doc.setFillColor(color[0], color[1], color[2])
    doc.roundedRect(x, y, Math.max(barW, 3), h, 1.5, 1.5, "F")
  }

  // Label
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(7.5)
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2])
  doc.text(label, x - 2, y + h / 2 + 1, { align: "right" })

  // Value
  if (showValue) {
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(7.5)
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2])
    doc.text(value.toString(), x + maxW + 3, y + h / 2 + 1)
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Cover Page
// ═══════════════════════════════════════════════════════════════════════
function drawCoverPage(
  doc: jsPDF,
  logoBase64: string | null,
  employee: string,
  from: string,
  to: string,
  type: string
) {
  // Left navy panel (55% of page)
  const panelW = PAGE_W * 0.55
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2])
  doc.rect(0, 0, panelW, PAGE_H, "F")

  // Diagonal accent strip
  doc.setFillColor(BLUE_600[0], BLUE_600[1], BLUE_600[2])
  doc.rect(panelW - 3, 0, 6, PAGE_H, "F")

  // Decorative circles on navy panel (with opacity)
  drawCircle(doc, panelW - 20, 30, 25, NAVY_800, 0.3)
  drawCircle(doc, 15, PAGE_H - 40, 18, NAVY_800, 0.25)
  drawCircle(doc, 8, 20, 3, CYAN, 0.3)
  drawCircle(doc, 25, 35, 1.5, BLUE_500, 0.4)

  // Decorative circles on right panel
  drawCircle(doc, PAGE_W - 15, 25, 20, BLUE_100, 0.4)
  drawCircle(doc, PAGE_W - 35, PAGE_H - 50, 15, BLUE_100, 0.3)

  // Logo on navy panel
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", 15, 15, 40, 16)
    } catch {
      // Logo failed, skip
    }
  }

  // Title on navy panel
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(38)
  doc.setTextColor(255, 255, 255)
  doc.text("ACTIVITY", 15, 95)
  doc.text("REPORT", 15, 110)

  // Dual accent line under title
  doc.setFillColor(CYAN[0], CYAN[1], CYAN[2])
  doc.rect(15, 116, 40, 1.5, "F")
  doc.setFillColor(BLUE_500[0], BLUE_500[1], BLUE_500[2])
  doc.rect(56, 116, 12, 1.5, "F")

  // Tagline
  doc.setFont("Helvetica", "italic")
  doc.setFontSize(10)
  doc.setTextColor(GRAY_300[0], GRAY_300[1], GRAY_300[2])
  doc.text("Performance & Progress Tracking", 15, 125)

  // Details card on right panel
  const cardX = panelW + 12
  const cardY = 75
  const cardW = PAGE_W - panelW - 22
  const cardH = 80

  drawRoundedRect(doc, cardX, cardY, cardW, cardH, 3, { fill: WHITE, stroke: GRAY_200, lineWidth: 0.4 })

  // Left accent bar on card
  doc.setFillColor(BLUE_600[0], BLUE_600[1], BLUE_600[2])
  doc.rect(cardX, cardY + 6, 1.5, cardH - 12, "F")

  // Card content
  const items = [
    { label: "EMPLOYEE", value: employee },
    { label: "DATE RANGE", value: `${from}  -  ${to}` },
    { label: "REPORT TYPE", value: type.toUpperCase() },
  ]

  items.forEach((item, i) => {
    const iy = cardY + 14 + i * 22
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(BLUE_600[0], BLUE_600[1], BLUE_600[2])
    doc.text(item.label, cardX + 8, iy)

    doc.setFont("Helvetica", "bold")
    doc.setFontSize(12)
    doc.setTextColor(NAVY_800[0], NAVY_800[1], NAVY_800[2])
    doc.text(item.value, cardX + 8, iy + 7, { maxWidth: cardW - 15 })
  })

  // Bottom accent bars
  doc.setFillColor(BLUE_600[0], BLUE_600[1], BLUE_600[2])
  doc.rect(0, PAGE_H - 5, PAGE_W, 5, "F")
  doc.setFillColor(CYAN[0], CYAN[1], CYAN[2])
  doc.rect(0, PAGE_H - 6, PAGE_W, 1, "F")

  // Generated date on bottom
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(255, 255, 255)
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  doc.text(`Generated: ${today}`, PAGE_W / 2, PAGE_H - 1.5, { align: "center" })
}

// ═══════════════════════════════════════════════════════════════════════
// Section Divider Page
// ═══════════════════════════════════════════════════════════════════════
function drawSectionDivider(
  doc: jsPDF,
  title: string,
  subtitle: string
) {
  // Full navy background
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2])
  doc.rect(0, 0, PAGE_W, PAGE_H, "F")

  // Decorative circles
  drawCircle(doc, PAGE_W - 30, 40, 45, NAVY_800, 0.3)
  drawCircle(doc, 20, PAGE_H - 60, 30, NAVY_800, 0.25)
  drawCircle(doc, 30, 50, 2, CYAN, 0.3)
  drawCircle(doc, PAGE_W - 40, PAGE_H - 80, 1.5, BLUE_500, 0.35)

  // Title
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(32)
  doc.setTextColor(255, 255, 255)
  doc.text(title, PAGE_W / 2, PAGE_H / 2 - 10, { align: "center" })

  // Accent line
  doc.setFillColor(CYAN[0], CYAN[1], CYAN[2])
  doc.rect(PAGE_W / 2 - 25, PAGE_H / 2, 50, 1.2, "F")

  // Subtitle
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(12)
  doc.setTextColor(GRAY_300[0], GRAY_300[1], GRAY_300[2])
  doc.text(subtitle, PAGE_W / 2, PAGE_H / 2 + 12, { align: "center" })

  // Bottom accent bar
  doc.setFillColor(BLUE_600[0], BLUE_600[1], BLUE_600[2])
  doc.rect(0, PAGE_H - 3, PAGE_W, 3, "F")
}

// ═══════════════════════════════════════════════════════════════════════
// Standard page header + footer
// ═══════════════════════════════════════════════════════════════════════
function drawPageHeader(doc: jsPDF, heading: string, pageNum: number) {
  // Navy header band
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2])
  doc.rect(0, 0, PAGE_W, 18, "F")

  // Primary accent strip
  doc.setFillColor(BLUE_500[0], BLUE_500[1], BLUE_500[2])
  doc.rect(0, 18, PAGE_W, 1.2, "F")

  // Secondary cyan strip
  doc.setFillColor(CYAN[0], CYAN[1], CYAN[2])
  doc.rect(0, 19.2, PAGE_W, 0.6, "F")

  // Decorative circle in header
  drawCircle(doc, PAGE_W - 12, 5, 10, BLUE_700, 0.35)

  // Heading text
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(heading, MARGIN, 12)

  // Website
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(GRAY_300[0], GRAY_300[1], GRAY_300[2])
  doc.text("www.innovaturelabs.com", PAGE_W - MARGIN, 12, { align: "right" })

  // Footer
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2])
  doc.rect(0, PAGE_H - 5, PAGE_W, 5, "F")
  doc.setFillColor(BLUE_500[0], BLUE_500[1], BLUE_500[2])
  doc.rect(0, PAGE_H - 5.8, PAGE_W, 0.8, "F")

  // Page number
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(GRAY_300[0], GRAY_300[1], GRAY_300[2])
  doc.text(pageNum.toString().padStart(2, "0"), PAGE_W - MARGIN, PAGE_H - 1.5, { align: "right" })

  // Confidential
  doc.setFont("Helvetica", "italic")
  doc.setFontSize(6)
  doc.text("CONFIDENTIAL", MARGIN, PAGE_H - 1.5)
}

// ═══════════════════════════════════════════════════════════════════════
// Dashboard Overview Page
// ═══════════════════════════════════════════════════════════════════════
function drawDashboardPage(
  doc: jsPDF,
  total: number, completed: number, pending: number, blockers: number,
  pageNum: number
) {
  doc.setFillColor(SLATE_50[0], SLATE_50[1], SLATE_50[2])
  doc.rect(0, 0, PAGE_W, PAGE_H, "F")
  drawPageHeader(doc, "Dashboard Overview", pageNum)

  // KPI Cards
  const cards = [
    { label: "Total Tasks", value: total.toString(), color: BLUE_600, icon: "#" },
    { label: "Completed", value: completed.toString(), color: GREEN, icon: "\u2713" },
    { label: "Pending", value: pending.toString(), color: AMBER, icon: "\u23F3" },
    { label: "Blockers", value: blockers.toString(), color: RED, icon: "\u26A0" },
  ]

  const cardW = 40
  const cardH = 28
  const gap = 6
  const totalW = cards.length * cardW + (cards.length - 1) * gap
  const startX = (PAGE_W - totalW) / 2

  cards.forEach((card, i) => {
    const cx = startX + i * (cardW + gap)
    drawKpiCard(doc, cx, 28, cardW, cardH, card.label, card.value, card.color, card.icon)
  })

  // Bar chart section
  const chartY = 64
  const chartX = MARGIN + 5
  const chartW = PAGE_W - 2 * MARGIN - 10

  // Container card for chart
  drawRoundedRect(doc, MARGIN, chartY - 4, PAGE_W - 2 * MARGIN, 65, 3, { fill: WHITE, stroke: GRAY_200, lineWidth: 0.3 })

  doc.setFont("Helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2])
  doc.text("Task Breakdown", MARGIN + 6, chartY + 4)

  // Horizontal bars
  const barData = [
    { label: "Completed", value: completed, color: GREEN },
    { label: "Pending", value: pending, color: AMBER },
    { label: "Blockers", value: blockers, color: RED },
  ]

  const maxVal = Math.max(completed, pending, blockers, 1)
  const barStartX = chartX + 30
  const barMaxW = chartW - 42

  barData.forEach((bar, i) => {
    const by = chartY + 14 + i * 14
    drawHorizontalBar(doc, barStartX, by, barMaxW, 6, bar.value, maxVal, bar.color, bar.label, true)
  })

  // Doughnut-like visual: Stacked proportional bar
  const stackY = chartY + 56
  const stackW = PAGE_W - 2 * MARGIN - 20
  const stackX = MARGIN + 10
  const stackH = 5

  doc.setFillColor(SLATE_50[0], SLATE_50[1], SLATE_50[2])
  doc.roundedRect(stackX, stackY, stackW, stackH, 2, 2, "F")

  const totalVal = completed + pending + blockers || 1
  let currentX = stackX
  const segments = [
    { val: completed, color: GREEN },
    { val: pending, color: AMBER },
    { val: blockers, color: RED },
  ]

  segments.forEach((seg) => {
    const segW = (seg.val / totalVal) * stackW
    if (segW > 0) {
      doc.setFillColor(seg.color[0], seg.color[1], seg.color[2])
      doc.roundedRect(currentX, stackY, Math.max(segW, 2), stackH, 2, 2, "F")
      currentX += segW
    }
  })

  // Summary Overview Section
  const summaryY = 138

  drawRoundedRect(doc, MARGIN, summaryY - 4, PAGE_W - 2 * MARGIN, 80, 3, { fill: WHITE, stroke: GRAY_200, lineWidth: 0.3 })

  doc.setFont("Helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(NAVY[0], NAVY[1], NAVY[2])
  doc.text("Summary Statistics", MARGIN + 6, summaryY + 4)

  // Stat rows
  const totalHours = total // placeholder, will be replaced by actual data passed in
  const statData = [
    { label: "Total Tasks", value: total.toString(), accent: BLUE_600, icon: "#" },
    { label: "Completed Tasks", value: completed.toString(), accent: GREEN_DARK, icon: "\u2713" },
    { label: "Pending Tasks", value: pending.toString(), accent: AMBER, icon: "\u23F3" },
    { label: "Blockers Found", value: blockers.toString(), accent: RED, icon: "\u26A0" },
  ]

  statData.forEach((stat, i) => {
    const row = i < 2 ? 0 : 1
    const col = i % 2
    const sx = MARGIN + 6 + col * 90
    const sy = summaryY + 10 + row * 30
    drawStatRow(doc, sx, sy, 82, 22, stat.label, stat.value, stat.accent, stat.icon)
  })
}

// ═══════════════════════════════════════════════════════════════════════
// Key Insights Page
// ═══════════════════════════════════════════════════════════════════════
function drawInsightsPage(
  doc: jsPDF,
  totalHours: number,
  avgDuration: string,
  completionRate: string,
  blockerRate: string,
  total: number,
  completed: number,
  blockers: number,
  leaderboard: { name: string; count: number }[],
  employee: string,
  from: string,
  to: string,
  pageNum: number
) {
  doc.setFillColor(SLATE_50[0], SLATE_50[1], SLATE_50[2])
  doc.rect(0, 0, PAGE_W, PAGE_H, "F")
  drawPageHeader(doc, "Key Insights", pageNum)

  // Insight cards (2x2 grid)
  const insights = [
    {
      icon: "\u2713", label: "Completion Rate", value: `${completionRate}%`,
      color: GREEN, desc: `${completed} of ${total} tasks completed`,
    },
    {
      icon: "\u2605", label: "Most Active",
      value: leaderboard.length > 0 ? leaderboard[0].name : "N/A",
      color: BLUE_600,
      desc: leaderboard.length > 0 ? `${leaderboard[0].count} tasks completed` : "",
    },
    {
      icon: "\u26A0", label: "Blocker Rate", value: `${blockerRate}%`,
      color: RED, desc: `${blockers} blockers across ${total} tasks`,
    },
    {
      icon: "\u23F1", label: "Avg Duration", value: `${avgDuration} min`,
      color: CYAN_DARK, desc: `${totalHours} total minutes logged`,
    },
  ]

  const insCardW = 82
  const insCardH = 45
  const insGapX = 10
  const insGapY = 10
  const insStartX = (PAGE_W - 2 * insCardW - insGapX) / 2
  const insStartY = 30

  insights.forEach((ins, i) => {
    const row = Math.floor(i / 2)
    const col = i % 2
    const ix = insStartX + col * (insCardW + insGapX)
    const iy = insStartY + row * (insCardH + insGapY)

    // Card background
    drawRoundedRect(doc, ix, iy, insCardW, insCardH, 2.5, { fill: WHITE, stroke: GRAY_200, lineWidth: 0.3 })

    // Colored top strip
    doc.setFillColor(ins.color[0], ins.color[1], ins.color[2])
    doc.rect(ix, iy, insCardW, 1.5, "F")

    // Icon circle
    drawCircle(doc, ix + insCardW / 2, iy + 10, 5, ins.color)
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(255, 255, 255)
    doc.text(ins.icon, ix + insCardW / 2, iy + 11.5, { align: "center" })

    // Label
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(7)
    doc.setTextColor(SLATE_700[0], SLATE_700[1], SLATE_700[2])
    doc.text(ins.label.toUpperCase(), ix + insCardW / 2, iy + 20, { align: "center" })

    // Big value
    doc.setFont("Helvetica", "bold")
    doc.setFontSize(20)
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2])
    doc.text(ins.value, ix + insCardW / 2, iy + 30, { align: "center", maxWidth: insCardW - 8 })

    // Description
    doc.setFont("Helvetica", "normal")
    doc.setFontSize(7)
    doc.setTextColor(SLATE_700[0], SLATE_700[1], SLATE_700[2])
    doc.text(ins.desc, ix + insCardW / 2, iy + 37, { align: "center", maxWidth: insCardW - 8 })
  })

  // Employee leaderboard section
  if (leaderboard.length > 0) {
    const lbY = insStartY + 2 * (insCardH + insGapY) + 10

    drawRoundedRect(doc, MARGIN, lbY, PAGE_W - 2 * MARGIN, 75, 3, { fill: WHITE, stroke: GRAY_200, lineWidth: 0.3 })

    doc.setFont("Helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2])
    doc.text("Employee Leaderboard", MARGIN + 6, lbY + 8)

    const barEntries = leaderboard.slice(0, 8)
    const maxCount = barEntries.length > 0 ? barEntries[0].count : 1
    const lbBarStartX = MARGIN + 45
    const lbBarMaxW = PAGE_W - 2 * MARGIN - 60

    barEntries.forEach((entry, i) => {
      const by = lbY + 16 + i * 7.5

      // Name
      doc.setFont("Helvetica", "normal")
      doc.setFontSize(7.5)
      doc.setTextColor(NAVY[0], NAVY[1], NAVY[2])
      doc.text(entry.name, lbBarStartX - 3, by + 3.5, { align: "right", maxWidth: 28 })

      // Bar
      const barW = (entry.count / maxCount) * lbBarMaxW
      doc.setFillColor(SLATE_50[0], SLATE_50[1], SLATE_50[2])
      doc.roundedRect(lbBarStartX, by, lbBarMaxW, 5, 1.5, 1.5, "F")

      const barColor = i === 0 ? BLUE_600 : i === 1 ? CYAN_DARK : BLUE_500
      doc.setFillColor(barColor[0], barColor[1], barColor[2])
      doc.roundedRect(lbBarStartX, by, Math.max(barW, 3), 5, 1.5, 1.5, "F")

      // Count
      doc.setFont("Helvetica", "bold")
      doc.setFontSize(7)
      doc.setTextColor(NAVY[0], NAVY[1], NAVY[2])
      doc.text(entry.count.toString(), lbBarStartX + lbBarMaxW + 3, by + 3.5)
    })
  }

  // Footer context
  doc.setFont("Helvetica", "italic")
  doc.setFontSize(7)
  doc.setTextColor(SLATE_700[0], SLATE_700[1], SLATE_700[2])
  doc.text(
    `Report generated for ${employee} | ${from} to ${to}`,
    PAGE_W / 2, PAGE_H - 12,
    { align: "center" }
  )
}

// ═══════════════════════════════════════════════════════════════════════
// Thank You / Closing Page
// ═══════════════════════════════════════════════════════════════════════
function drawThankYouPage(doc: jsPDF, logoBase64: string | null) {
  // Full navy background
  doc.setFillColor(NAVY[0], NAVY[1], NAVY[2])
  doc.rect(0, 0, PAGE_W, PAGE_H, "F")

  // Large decorative circles
  drawCircle(doc, PAGE_W / 2, PAGE_H / 2, 60, NAVY_800, 0.3)
  drawCircle(doc, PAGE_W - 25, 30, 30, BLUE_700, 0.25)
  drawCircle(doc, 20, PAGE_H - 50, 22, BLUE_700, 0.25)

  // Accent dots
  drawCircle(doc, 40, 60, 2, CYAN, 0.3)
  drawCircle(doc, PAGE_W - 50, PAGE_H - 70, 1.5, BLUE_500, 0.35)
  drawCircle(doc, PAGE_W / 2 + 30, 50, 1, CYAN, 0.4)

  // THANK YOU
  doc.setFont("Helvetica", "bold")
  doc.setFontSize(42)
  doc.setTextColor(255, 255, 255)
  doc.text("THANK YOU", PAGE_W / 2, PAGE_H / 2 - 25, { align: "center" })

  // Accent line
  doc.setFillColor(CYAN[0], CYAN[1], CYAN[2])
  doc.rect(PAGE_W / 2 - 22, PAGE_H / 2 - 15, 30, 1.2, "F")
  doc.setFillColor(BLUE_500[0], BLUE_500[1], BLUE_500[2])
  doc.rect(PAGE_W / 2 + 9, PAGE_H / 2 - 15, 13, 1.2, "F")

  // Subtitle
  doc.setFont("Helvetica", "italic")
  doc.setFontSize(13)
  doc.setTextColor(GRAY_300[0], GRAY_300[1], GRAY_300[2])
  doc.text("For your time and attention", PAGE_W / 2, PAGE_H / 2, { align: "center" })

  // Website
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(BLUE_500[0], BLUE_500[1], BLUE_500[2])
  doc.text("www.innovaturelabs.com", PAGE_W / 2, PAGE_H / 2 + 15, { align: "center" })

  // Generated date
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  doc.setFont("Helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(SLATE_700[0], SLATE_700[1], SLATE_700[2])
  doc.text(`Report generated on ${today}`, PAGE_W / 2, PAGE_H / 2 + 25, { align: "center" })

  // Logo
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, "PNG", PAGE_W / 2 - 18, PAGE_H / 2 + 35, 36, 14)
    } catch {
      // skip
    }
  }

  // Bottom accent bar
  doc.setFillColor(BLUE_600[0], BLUE_600[1], BLUE_600[2])
  doc.rect(0, PAGE_H - 3, PAGE_W, 3, "F")
}


// ═══════════════════════════════════════════════════════════════════════
// MAIN GET HANDLER
// ═══════════════════════════════════════════════════════════════════════
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const employee = searchParams.get("employee") || "All Employees"
    const from = searchParams.get("from") || "N/A"
    const to = searchParams.get("to") || "N/A"
    const type = searchParams.get("type") || "all"

    const sheetId = process.env.GOOGLE_SHEET_ID!

    // Google Auth
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    })

    const sheets = google.sheets({ version: "v4", auth })

    // Read Sheet Data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Activities!A:I",
    })

    const rows = response.data.values || []
    const data = rows.slice(1)

    const start = new Date(from)
    const end = new Date(to)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    // Filter Data
    const filtered = data.filter((row) => {
      const name = row[2]
      const status = row[7]
      const blocker = row[8]
      const rawDate = row[5]
      if (!rawDate) return false

      const rowDate = new Date(rawDate)
      rowDate.setHours(0, 0, 0, 0)

      if (employee !== "All Employees" && name !== employee) return false
      if (rowDate < start || rowDate > end) return false
      if (type === "pending" && status !== "pending") return false
      if (type === "completed" && status !== "completed") return false
      if (type === "blocker" && blocker !== "TRUE") return false

      return true
    })

    // Compute stats
    const total = filtered.length
    const completed = filtered.filter((r) => r[7] === "completed").length
    const pending = filtered.filter((r) => r[7] === "pending").length
    const blockers = filtered.filter((r) => r[8] === "TRUE").length
    const totalHours = filtered.reduce((sum, r) => sum + (parseInt(r[6]) || 0), 0)
    const avgDuration = total ? (totalHours / total).toFixed(1) : "0"
    const completionRate = total ? ((completed / total) * 100).toFixed(1) : "0"
    const blockerRate = total ? ((blockers / total) * 100).toFixed(1) : "0"

    const employeeMap: Record<string, number> = {}
    filtered.forEach((r) => {
      const name = r[2]
      employeeMap[name] = (employeeMap[name] || 0) + 1
    })
    const leaderboard = Object.entries(employeeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))

    // Load logo
    let logoBase64: string | null = null
    try {
      const logoPath = path.join(process.cwd(), "public", "company_logo.jpeg")
      const imageBuffer = fs.readFileSync(logoPath)
      logoBase64 = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`
    } catch {
      // Logo not found, skip
    }

    // ═══════════════════════════════════════════════════════════════════
    // CREATE PDF DOCUMENT
    // ═══════════════════════════════════════════════════════════════════
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

    // ─── PAGE 1: Cover ───────────────────────────────────────────────
    drawCoverPage(doc, logoBase64, employee, from, to, type)

    // ─── PAGE 2: Section Divider - Dashboard ─────────────────────────
    doc.addPage()
    drawSectionDivider(doc, "DASHBOARD & ANALYTICS", "Key metrics and performance overview")

    // ─── PAGE 3: Dashboard Overview ──────────────────────────────────
    doc.addPage()
    drawDashboardPage(doc, total, completed, pending, blockers, 3)

    // ─── PAGE 4: Section Divider - Insights ──────────────────────────
    doc.addPage()
    drawSectionDivider(doc, "KEY INSIGHTS", "Performance analysis and employee breakdown")

    // ─── PAGE 5: Key Insights + Leaderboard ──────────────────────────
    doc.addPage()
    drawInsightsPage(
      doc, totalHours, avgDuration, completionRate, blockerRate,
      total, completed, blockers, leaderboard,
      employee, from, to, 5
    )

    // ─── PAGE 6: Section Divider - Data ──────────────────────────────
    doc.addPage()
    drawSectionDivider(doc, "DETAILED DATA", "Activity log and records")

    // ─── PAGE 7+: Activities Table ───────────────────────────────────
    doc.addPage()

    const tableBody = filtered.map((row) => [
      row[2],
      row[5],
      row[3],
      row[4],
      row[6] + " min",
      row[7],
    ])

    autoTable(doc, {
      head: [["Name", "Date", "Type", "Description", "Duration", "Status"]],
      body: tableBody,
      startY: 28,
      margin: { top: 28, bottom: 14, left: MARGIN, right: MARGIN },

      styles: {
        fontSize: 8,
        overflow: "linebreak",
        cellPadding: 3,
        lineColor: [226, 232, 240],
        lineWidth: 0.3,
        font: "helvetica",
      },

      headStyles: {
        fillColor: [NAVY[0], NAVY[1], NAVY[2]],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 4,
      },

      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 22, halign: "center" },
        2: { cellWidth: 22, halign: "center" },
        3: { cellWidth: 65 },
        4: { cellWidth: 22, halign: "center" },
        5: { cellWidth: 22, halign: "center" },
      },

      alternateRowStyles: {
        fillColor: [BLUE_100[0], BLUE_100[1], BLUE_100[2]],
      },

      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [NAVY_800[0], NAVY_800[1], NAVY_800[2]],
      },

      // Color-code status cells and add styled header/footer on each page
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 5) {
          const val = (data.cell.raw as string || "").toLowerCase()
          if (val === "completed") {
            data.cell.styles.fillColor = [GREEN[0], GREEN[1], GREEN[2]]
            data.cell.styles.textColor = [255, 255, 255]
            data.cell.styles.fontStyle = "bold"
          } else if (val === "pending") {
            data.cell.styles.fillColor = [AMBER[0], AMBER[1], AMBER[2]]
            data.cell.styles.textColor = [255, 255, 255]
            data.cell.styles.fontStyle = "bold"
          }
        }
      },

      didDrawPage: (data) => {
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber
        drawPageHeader(doc, "Recent Activities", currentPage)
      },
    })

    // ─── LAST PAGE: Thank You ────────────────────────────────────────
    doc.addPage()
    drawThankYouPage(doc, logoBase64)

    // ═══════════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════════
    const pdfBuffer = doc.output("arraybuffer")

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="Activity_Report.pdf"',
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

import { NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import { google } from "googleapis";

// ── Design System Constants ──────────────────────────────────────────────
const NAVY = "0F172A";
const NAVY_800 = "1E293B";
const BLUE_700 = "1D4ED8";
const BLUE_600 = "2563EB";
const BLUE_500 = "3B82F6";
const BLUE_100 = "DBEAFE";
const SLATE_50 = "F8FAFC";
const SLATE_700 = "334155";
const WHITE = "FFFFFF";
const GREEN = "10B981";
const GREEN_DARK = "059669";
const AMBER = "F59E0B";
const RED = "EF4444";
const GRAY_200 = "E2E8F0";
const GRAY_300 = "CBD5E1";
const CYAN = "06B6D4";
const CYAN_DARK = "0891B2";
const INDIGO = "6366F1";
const SLIDE_W = 13.33;
const SLIDE_H = 7.5;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const employee = searchParams.get("employee") || "All Employees";
    const from = searchParams.get("from") || "N/A";
    const to = searchParams.get("to") || "N/A";
    const type = searchParams.get("type") || "all";

    const sheetId = process.env.GOOGLE_SHEET_ID!;

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Activities!A:I",
    });

    const rows = response.data.values || [];
    const data = rows.slice(1);

    const start = new Date(from);
    const end = new Date(to);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // ── Reusable Layout Helpers ────────────────────────────────────────

    const applyCoverLayout = (slide: PptxGenJS.Slide) => {
      // Left navy panel (58%)
      slide.addShape("rect", {
        x: 0,
        y: 0,
        w: SLIDE_W * 0.58,
        h: SLIDE_H,
        fill: { color: NAVY },
      });

      // Diagonal accent strip connecting left & right panels
      slide.addShape("rect", {
        x: SLIDE_W * 0.55,
        y: 0,
        w: 0.8,
        h: SLIDE_H,
        fill: { color: BLUE_600 },
        rotate: 3,
      });

      // Decorative top-right circle
      slide.addShape("ellipse", {
        x: SLIDE_W - 2.5,
        y: -0.8,
        w: 3,
        h: 3,
        fill: { color: BLUE_100, transparency: 60 },
      });

      // Decorative bottom-right circle
      slide.addShape("ellipse", {
        x: SLIDE_W - 4,
        y: SLIDE_H - 2,
        w: 2.5,
        h: 2.5,
        fill: { color: BLUE_100, transparency: 70 },
      });

      // Small accent dots top-left
      slide.addShape("ellipse", {
        x: 0.5,
        y: 0.4,
        w: 0.3,
        h: 0.3,
        fill: { color: CYAN, transparency: 40 },
      });
      slide.addShape("ellipse", {
        x: 1.2,
        y: 0.6,
        w: 0.15,
        h: 0.15,
        fill: { color: BLUE_500, transparency: 50 },
      });

      // Bottom accent bar (full width)
      slide.addShape("rect", {
        x: 0,
        y: SLIDE_H - 0.25,
        w: SLIDE_W,
        h: 0.25,
        fill: { color: BLUE_600 },
      });

      // Thin cyan line above bottom bar
      slide.addShape("rect", {
        x: 0,
        y: SLIDE_H - 0.3,
        w: SLIDE_W,
        h: 0.05,
        fill: { color: CYAN },
      });

      // Logo on the navy section
      slide.addImage({
        path: "public/logo.png",
        x: 0.8,
        y: 0.5,
        w: 2.2,
        h: 0.8,
      });
    };

    const applyHeaderLayout = (
      slide: PptxGenJS.Slide,
      heading: string,
      slideNum?: number
    ) => {
      // Navy header band with shadow
      slide.addShape("rect", {
        x: 0,
        y: 0,
        w: SLIDE_W,
        h: 1.15,
        fill: { color: NAVY },
        shadow: {
          type: "outer",
          blur: 6,
          offset: 3,
          angle: 270,
          color: "000000",
          opacity: 0.25,
        },
      });

      // Primary accent strip
      slide.addShape("rect", {
        x: 0,
        y: 1.15,
        w: SLIDE_W,
        h: 0.08,
        fill: { color: BLUE_500 },
      });

      // Secondary thin cyan strip
      slide.addShape("rect", {
        x: 0,
        y: 1.23,
        w: SLIDE_W,
        h: 0.04,
        fill: { color: CYAN },
      });

      // Decorative circle in header (top-right)
      slide.addShape("ellipse", {
        x: SLIDE_W - 1.8,
        y: -0.3,
        w: 1.5,
        h: 1.5,
        fill: { color: BLUE_700, transparency: 60 },
      });

      // Heading text
      slide.addText(heading, {
        x: 0.8,
        y: 0.25,
        w: 8,
        h: 0.7,
        fontSize: 26,
        bold: true,
        color: WHITE,
        fontFace: "Calibri",
      });

      // Website right
      slide.addText("www.innovaturelabs.com", {
        x: SLIDE_W - 4,
        y: 0.35,
        w: 3.5,
        align: "right",
        fontSize: 11,
        color: GRAY_300,
        fontFace: "Calibri",
      });

      // Bottom bar
      slide.addShape("rect", {
        x: 0,
        y: SLIDE_H - 0.25,
        w: SLIDE_W,
        h: 0.25,
        fill: { color: NAVY },
      });

      // Bottom accent line
      slide.addShape("rect", {
        x: 0,
        y: SLIDE_H - 0.29,
        w: SLIDE_W,
        h: 0.04,
        fill: { color: BLUE_500 },
      });

      // Slide number in bottom bar
      if (slideNum) {
        slide.addText(slideNum.toString().padStart(2, "0"), {
          x: SLIDE_W - 1.5,
          y: SLIDE_H - 0.25,
          w: 1,
          h: 0.25,
          align: "center",
          fontSize: 9,
          color: GRAY_300,
          fontFace: "Calibri",
        });
      }

      // Confidential text
      slide.addText("CONFIDENTIAL", {
        x: 0.5,
        y: SLIDE_H - 0.25,
        w: 2,
        h: 0.25,
        fontSize: 7,
        color: GRAY_300,
        fontFace: "Calibri",
        italic: true,
      });
    };

    const addSectionDivider = (
      pptxRef: PptxGenJS,
      title: string,
      subtitle: string
    ) => {
      const slide = pptxRef.addSlide();
      slide.background = { fill: NAVY };

      // Large decorative circle top-right
      slide.addShape("ellipse", {
        x: SLIDE_W - 4,
        y: -2,
        w: 6,
        h: 6,
        fill: { color: NAVY_800, transparency: 30 },
      });

      // Small decorative circle bottom-left
      slide.addShape("ellipse", {
        x: -1,
        y: SLIDE_H - 3,
        w: 4,
        h: 4,
        fill: { color: NAVY_800, transparency: 40 },
      });

      // Tiny accent dots
      slide.addShape("ellipse", {
        x: 2,
        y: 2,
        w: 0.2,
        h: 0.2,
        fill: { color: CYAN, transparency: 30 },
      });
      slide.addShape("ellipse", {
        x: 10,
        y: 5.5,
        w: 0.15,
        h: 0.15,
        fill: { color: BLUE_500, transparency: 40 },
      });

      // Title
      slide.addText(title, {
        x: 1.5,
        y: 2.5,
        w: SLIDE_W - 3,
        h: 1.2,
        fontSize: 40,
        bold: true,
        color: WHITE,
        align: "center",
        fontFace: "Calibri",
      });

      // Accent line below title
      slide.addShape("rect", {
        x: SLIDE_W / 2 - 1.5,
        y: 3.9,
        w: 3,
        h: 0.08,
        fill: { color: CYAN },
      });

      // Subtitle
      slide.addText(subtitle, {
        x: 2,
        y: 4.3,
        w: SLIDE_W - 4,
        h: 0.6,
        fontSize: 16,
        color: GRAY_300,
        align: "center",
        fontFace: "Calibri",
      });

      // Bottom bar
      slide.addShape("rect", {
        x: 0,
        y: SLIDE_H - 0.15,
        w: SLIDE_W,
        h: 0.15,
        fill: { color: BLUE_600 },
      });

      return slide;
    };

    // ── Data Filtering ─────────────────────────────────────────────────

    const filtered = data.filter((row) => {
      const name = row[2];
      const status = row[7];
      const blocker = row[8];
      const rawDate = row[5];
      if (!rawDate) return false;

      const rowDate = new Date(rawDate);
      rowDate.setHours(0, 0, 0, 0);

      if (employee !== "All Employees" && name !== employee) return false;
      if (rowDate < start || rowDate > end) return false;
      if (type === "pending" && status !== "pending") return false;
      if (type === "completed" && status !== "completed") return false;
      if (type === "blocker" && blocker !== "TRUE") return false;

      return true;
    });

    const total = filtered.length;
    const completed = filtered.filter((r) => r[7] === "completed").length;
    const pending = filtered.filter((r) => r[7] === "pending").length;
    const blockers = filtered.filter((r) => r[8] === "TRUE").length;
    const totalHours = filtered.reduce(
      (sum, r) => sum + (parseInt(r[6]) || 0),
      0
    );
    const avgDuration = total ? (totalHours / total).toFixed(1) : "0";
    const completionRate = total ? ((completed / total) * 100).toFixed(1) : "0";
    const blockerRate = total ? ((blockers / total) * 100).toFixed(1) : "0";

    const employeeMap: Record<string, number> = {};
    filtered.forEach((r) => {
      const name = r[2];
      employeeMap[name] = (employeeMap[name] || 0) + 1;
    });

    const leaderboard = Object.entries(employeeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // ── PPT Creation ───────────────────────────────────────────────────

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.theme = {
      headFontFace: "Calibri",
      bodyFontFace: "Calibri",
    };

    // ═══════════════════════════════════════════════════════════════════
    // SLIDE 1 : Cover
    // ═══════════════════════════════════════════════════════════════════
    const slide1 = pptx.addSlide();
    slide1.background = { fill: SLATE_50 };
    applyCoverLayout(slide1);

    // Title on navy panel
    slide1.addText("ACTIVITY\nREPORT", {
      x: 0.8,
      y: 2.0,
      w: SLIDE_W * 0.5,
      h: 2.2,
      fontSize: 52,
      bold: true,
      color: WHITE,
      fontFace: "Calibri",
      lineSpacingMultiple: 1.1,
    });

    // Accent line under title
    slide1.addShape("rect", {
      x: 0.8,
      y: 4.3,
      w: 2.5,
      h: 0.1,
      fill: { color: CYAN },
    });
    slide1.addShape("rect", {
      x: 3.4,
      y: 4.3,
      w: 0.8,
      h: 0.1,
      fill: { color: BLUE_500 },
    });

    // Tagline on navy panel
    slide1.addText("Performance & Progress Tracking", {
      x: 0.8,
      y: 4.6,
      w: 5,
      h: 0.5,
      fontSize: 14,
      color: GRAY_300,
      fontFace: "Calibri",
      italic: true,
    });

    // Details card on the right panel
    slide1.addShape("roundRect", {
      x: SLIDE_W * 0.62,
      y: 2.2,
      w: 4.2,
      h: 3.2,
      fill: { color: WHITE },
      rectRadius: 0.15,
      shadow: {
        type: "outer",
        blur: 8,
        offset: 3,
        angle: 270,
        color: "000000",
        opacity: 0.15,
      },
      line: { color: GRAY_200, width: 1 },
    });

    // Left accent bar on card
    slide1.addShape("rect", {
      x: SLIDE_W * 0.62,
      y: 2.4,
      w: 0.08,
      h: 2.8,
      fill: { color: BLUE_600 },
    });

    // Card content
    const cardX = SLIDE_W * 0.62 + 0.4;
    const cardItems = [
      { label: "EMPLOYEE", value: employee },
      { label: "DATE RANGE", value: `${from}  -  ${to}` },
      { label: "REPORT TYPE", value: type.toUpperCase() },
    ];

    cardItems.forEach((item, i) => {
      const yPos = 2.5 + i * 0.9;
      slide1.addText(item.label, {
        x: cardX,
        y: yPos,
        w: 3.5,
        h: 0.3,
        fontSize: 9,
        bold: true,
        color: BLUE_600,
        fontFace: "Calibri",
      });
      slide1.addText(item.value, {
        x: cardX,
        y: yPos + 0.28,
        w: 3.5,
        h: 0.35,
        fontSize: 15,
        color: NAVY_800,
        fontFace: "Calibri",
      });
    });

    // ═══════════════════════════════════════════════════════════════════
    // SLIDE 2 : Section Divider - Dashboard & Analytics
    // ═══════════════════════════════════════════════════════════════════
    addSectionDivider(
      pptx,
      "DASHBOARD & ANALYTICS",
      "Key metrics and performance overview"
    );

    // ═══════════════════════════════════════════════════════════════════
    // SLIDE 3 : Dashboard Overview
    // ═══════════════════════════════════════════════════════════════════
    const slideHighlights = pptx.addSlide();
    slideHighlights.background = { fill: SLATE_50 };
    applyHeaderLayout(slideHighlights, "Dashboard Overview", 3);

    // KPI Cards
    const kpiCards = [
      { title: "Total Tasks", value: total, color: BLUE_600, icon: "#" },
      { title: "Completed", value: completed, color: GREEN, icon: "\u2713" },
      { title: "Pending", value: pending, color: AMBER, icon: "\u23F3" },
      { title: "Blockers", value: blockers, color: RED, icon: "\u26A0" },
    ];

    const cardWidth = 2.5;
    const cardGap = 0.4;
    const totalCardsWidth =
      kpiCards.length * cardWidth + (kpiCards.length - 1) * cardGap;
    const startX = (SLIDE_W - totalCardsWidth) / 2;

    kpiCards.forEach((card, i) => {
      const cx = startX + i * (cardWidth + cardGap);

      // Card with shadow
      slideHighlights.addShape("roundRect", {
        x: cx,
        y: 1.6,
        w: cardWidth,
        h: 2.2,
        fill: { color: card.color },
        rectRadius: 0.15,
        shadow: {
          type: "outer",
          blur: 6,
          offset: 3,
          angle: 270,
          color: "000000",
          opacity: 0.2,
        },
      });

      // Light overlay strip at top of card
      slideHighlights.addShape("rect", {
        x: cx,
        y: 1.6,
        w: cardWidth,
        h: 0.5,
        fill: { color: WHITE, transparency: 85 },
      });

      // Icon
      slideHighlights.addText(card.icon, {
        x: cx,
        y: 1.65,
        w: cardWidth,
        h: 0.45,
        align: "center",
        fontSize: 18,
        color: WHITE,
        fontFace: "Calibri",
      });

      // Value
      slideHighlights.addText(card.value.toString(), {
        x: cx,
        y: 2.2,
        w: cardWidth,
        h: 1,
        align: "center",
        fontSize: 44,
        bold: true,
        color: WHITE,
        fontFace: "Calibri",
      });

      // Label
      slideHighlights.addText(card.title.toUpperCase(), {
        x: cx,
        y: 3.15,
        w: cardWidth,
        h: 0.5,
        align: "center",
        fontSize: 11,
        color: WHITE,
        fontFace: "Calibri",
        bold: true,
      });
    });

    // Bar Chart container
    slideHighlights.addShape("roundRect", {
      x: 1.5,
      y: 4.2,
      w: SLIDE_W - 3,
      h: 2.8,
      fill: { color: WHITE },
      rectRadius: 0.1,
      shadow: {
        type: "outer",
        blur: 4,
        offset: 2,
        angle: 270,
        color: "000000",
        opacity: 0.12,
      },
      line: { color: GRAY_200, width: 0.5 },
    });

    slideHighlights.addText("Task Breakdown", {
      x: 1.8,
      y: 4.3,
      w: 4,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: NAVY_800,
      fontFace: "Calibri",
    });

    slideHighlights.addChart(
      pptx.ChartType.bar,
      [
        {
          name: "Tasks",
          labels: ["Completed", "Pending", "Blockers"],
          values: [completed, pending, blockers],
        },
      ],
      {
        x: 2,
        y: 4.6,
        w: SLIDE_W - 4,
        h: 2.2,
        showLegend: false,
        chartColors: [GREEN, AMBER, RED],
        barDir: "bar",
        barGapWidthPct: 100,
        dataLabelPosition: "outEnd",
        showDataTable: true,
        dataLabelFontSize: 11,
        dataLabelColor: NAVY_800,
        catAxisOrientation: "minMax",
        valAxisHidden: true,
        catAxisLineShow: false,
        valAxisLineShow: false,
        catAxisLabelFontSize: 11,
        catAxisLabelFontFace: "Calibri",
      }
    );

    // ═══════════════════════════════════════════════════════════════════
    // SLIDE 4 : Summary Overview
    // ═══════════════════════════════════════════════════════════════════
    const slideSummary = pptx.addSlide();
    slideSummary.background = { fill: SLATE_50 };
    applyHeaderLayout(slideSummary, "Summary Overview", 4);

    // Decorative background shape
    slideSummary.addShape("ellipse", {
      x: -1,
      y: SLIDE_H - 3,
      w: 3,
      h: 3,
      fill: { color: BLUE_100, transparency: 70 },
    });

    // Left stat cards
    const statCards = [
      {
        label: "Total Hours Worked",
        value: `${totalHours} min`,
        accent: BLUE_600,
        icon: "\u23F1",
      },
      {
        label: "Average Duration",
        value: `${avgDuration} min/task`,
        accent: CYAN_DARK,
        icon: "\u2300",
      },
      {
        label: "Completion Rate",
        value: `${completionRate}%`,
        accent: GREEN_DARK,
        icon: "\u2713",
      },
    ];

    statCards.forEach((sc, i) => {
      const cy = 1.8 + i * 1.5;

      // Card background
      slideSummary.addShape("roundRect", {
        x: 0.8,
        y: cy,
        w: 4.8,
        h: 1.2,
        fill: { color: WHITE },
        rectRadius: 0.1,
        shadow: {
          type: "outer",
          blur: 4,
          offset: 2,
          angle: 270,
          color: "000000",
          opacity: 0.1,
        },
        line: { color: GRAY_200, width: 0.5 },
      });

      // Left accent bar
      slideSummary.addShape("rect", {
        x: 0.8,
        y: cy + 0.15,
        w: 0.08,
        h: 0.9,
        fill: { color: sc.accent },
      });

      // Icon circle
      slideSummary.addShape("ellipse", {
        x: 1.15,
        y: cy + 0.2,
        w: 0.7,
        h: 0.7,
        fill: { color: sc.accent, transparency: 85 },
      });

      slideSummary.addText(sc.icon, {
        x: 1.15,
        y: cy + 0.2,
        w: 0.7,
        h: 0.7,
        align: "center",
        fontSize: 18,
        color: sc.accent,
        fontFace: "Calibri",
      });

      // Label
      slideSummary.addText(sc.label.toUpperCase(), {
        x: 2.1,
        y: cy + 0.15,
        w: 3,
        h: 0.35,
        fontSize: 9,
        bold: true,
        color: SLATE_700,
        fontFace: "Calibri",
      });

      // Value
      slideSummary.addText(sc.value, {
        x: 2.1,
        y: cy + 0.5,
        w: 3,
        h: 0.5,
        fontSize: 24,
        bold: true,
        color: NAVY_800,
        fontFace: "Calibri",
      });
    });

    // Doughnut chart container
    slideSummary.addShape("roundRect", {
      x: 6.3,
      y: 1.6,
      w: 6.2,
      h: 5,
      fill: { color: WHITE },
      rectRadius: 0.1,
      shadow: {
        type: "outer",
        blur: 4,
        offset: 2,
        angle: 270,
        color: "000000",
        opacity: 0.1,
      },
      line: { color: GRAY_200, width: 0.5 },
    });

    slideSummary.addText("Task Distribution", {
      x: 6.6,
      y: 1.7,
      w: 4,
      h: 0.4,
      fontSize: 12,
      bold: true,
      color: NAVY_800,
      fontFace: "Calibri",
    });

    slideSummary.addChart(
      pptx.ChartType.doughnut,
      [
        {
          name: "Tasks",
          labels: ["Completed", "Pending", "Blockers"],
          values: [completed, pending, blockers],
        },
      ],
      {
        x: 6.8,
        y: 2.1,
        w: 5.2,
        h: 4.2,
        showLegend: true,
        legendPos: "b",
        legendFontSize: 10,
        chartColors: [GREEN, AMBER, RED],
        dataLabelPosition: "outEnd",
        showDataTable: true,
        dataLabelFontSize: 11,
        dataLabelColor: NAVY_800,
      }
    );

    // ═══════════════════════════════════════════════════════════════════
    // SLIDE 5 : Section Divider - Detailed Data
    // ═══════════════════════════════════════════════════════════════════
    addSectionDivider(
      pptx,
      "DETAILED DATA",
      "Activity log and employee breakdown"
    );

    // ═══════════════════════════════════════════════════════════════════
    // SLIDE 6 : Activities Table
    // ═══════════════════════════════════════════════════════════════════
    const slideTable = pptx.addSlide();
    slideTable.background = { fill: WHITE };
    applyHeaderLayout(slideTable, "Recent Activities", 6);

    // Build styled table with per-cell formatting
    const headerRow = [
      "Name",
      "Date",
      "Type",
      "Description",
      "Duration",
      "Status",
      "Blocker",
    ].map((text) => ({
      text,
      options: {
        bold: true,
        color: WHITE,
        fill: { color: NAVY },
        fontSize: 10,
        fontFace: "Calibri",
        align: "center" as const,
        valign: "middle" as const,
      },
    }));

    const tableRows: object[][] = [headerRow];

    filtered.forEach((row, idx) => {
      const isEven = idx % 2 === 0;
      const rowBg = isEven ? BLUE_100 : WHITE;
      const status = row[7] || "";
      const blocker = row[8] === "TRUE";

      const statusFill =
        status === "completed" ? GREEN : status === "pending" ? AMBER : rowBg;
      const statusColor =
        status === "completed" || status === "pending" ? WHITE : NAVY_800;
      const blockerFill = blocker ? RED : rowBg;
      const blockerColor = blocker ? WHITE : NAVY_800;

      tableRows.push([
        {
          text: row[2] || "",
          options: {
            fill: { color: rowBg },
            fontSize: 9,
            color: NAVY_800,
            fontFace: "Calibri",
            valign: "middle" as const,
          },
        },
        {
          text: row[5] || "",
          options: {
            fill: { color: rowBg },
            fontSize: 9,
            color: SLATE_700,
            fontFace: "Calibri",
            align: "center" as const,
            valign: "middle" as const,
          },
        },
        {
          text: row[3] || "",
          options: {
            fill: { color: rowBg },
            fontSize: 9,
            color: SLATE_700,
            fontFace: "Calibri",
            align: "center" as const,
            valign: "middle" as const,
          },
        },
        {
          text: row[4] || "",
          options: {
            fill: { color: rowBg },
            fontSize: 9,
            color: NAVY_800,
            fontFace: "Calibri",
            valign: "middle" as const,
          },
        },
        {
          text: `${row[6] || 0} min`,
          options: {
            fill: { color: rowBg },
            fontSize: 9,
            color: SLATE_700,
            fontFace: "Calibri",
            align: "center" as const,
            valign: "middle" as const,
          },
        },
        {
          text: status.toUpperCase(),
          options: {
            fill: { color: statusFill },
            fontSize: 9,
            bold: true,
            color: statusColor,
            fontFace: "Calibri",
            align: "center" as const,
            valign: "middle" as const,
          },
        },
        {
          text: blocker ? "YES" : "NO",
          options: {
            fill: { color: blockerFill },
            fontSize: 9,
            bold: blocker,
            color: blockerColor,
            fontFace: "Calibri",
            align: "center" as const,
            valign: "middle" as const,
          },
        },
      ]);
    });

    slideTable.addTable(tableRows, {
      x: 0.4,
      y: 1.5,
      w: SLIDE_W - 0.8,
      colW: [1.8, 1.3, 1.3, 3.8, 1.0, 1.2, 1.0],
      fontSize: 9,
      border: { type: "solid", color: GRAY_200, pt: 0.5 },
      autoPage: true,
      autoPageRepeatHeader: true,
      autoPageSlideStartY: 1.5,
    });

    // ═══════════════════════════════════════════════════════════════════
    // SLIDE 7 : Employee Leaderboard
    // ═══════════════════════════════════════════════════════════════════
    if (leaderboard.length > 0) {
      const slideLeader = pptx.addSlide();
      slideLeader.background = { fill: SLATE_50 };
      applyHeaderLayout(slideLeader, "Employee Leaderboard", 7);

      // Podium for top 3
      const top3 = leaderboard.slice(0, 3);
      const podiumColors = [BLUE_600, CYAN_DARK, INDIGO];
      const podiumHeights = [2.8, 2.2, 1.8];
      const podiumWidth = 2.5;
      const podiumGap = 0.3;
      const podiumTotalW =
        top3.length * podiumWidth + (top3.length - 1) * podiumGap;
      const podiumStartX = (SLIDE_W - podiumTotalW) / 2;
      const podiumBaseY = 6.4;

      // Reorder to show #2, #1, #3 for visual podium effect
      const podiumOrder =
        top3.length >= 3 ? [1, 0, 2] : top3.map((_, i) => i);

      podiumOrder.forEach((dataIdx, posIdx) => {
        if (dataIdx >= top3.length) return;
        const entry = top3[dataIdx];
        const px = podiumStartX + posIdx * (podiumWidth + podiumGap);
        const ph = podiumHeights[dataIdx];
        const py = podiumBaseY - ph;

        // Podium bar
        slideLeader.addShape("roundRect", {
          x: px,
          y: py,
          w: podiumWidth,
          h: ph,
          fill: { color: podiumColors[dataIdx] },
          rectRadius: 0.1,
          shadow: {
            type: "outer",
            blur: 5,
            offset: 3,
            angle: 270,
            color: "000000",
            opacity: 0.2,
          },
        });

        // Rank number
        slideLeader.addText(`#${dataIdx + 1}`, {
          x: px,
          y: py + 0.2,
          w: podiumWidth,
          h: 0.6,
          align: "center",
          fontSize: 28,
          bold: true,
          color: WHITE,
          fontFace: "Calibri",
        });

        // Name
        slideLeader.addText(entry.name, {
          x: px,
          y: py + 0.85,
          w: podiumWidth,
          h: 0.4,
          align: "center",
          fontSize: 12,
          bold: true,
          color: WHITE,
          fontFace: "Calibri",
        });

        // Count
        slideLeader.addText(`${entry.count} tasks`, {
          x: px,
          y: py + 1.25,
          w: podiumWidth,
          h: 0.35,
          align: "center",
          fontSize: 11,
          color: WHITE,
          fontFace: "Calibri",
        });
      });

      // Full leaderboard bar chart if more than 3 employees
      if (leaderboard.length > 3) {
        const barData = leaderboard.slice(0, 10);
        slideLeader.addChart(
          pptx.ChartType.bar,
          [
            {
              name: "Tasks",
              labels: barData.map((e) => e.name),
              values: barData.map((e) => e.count),
            },
          ],
          {
            x: 0.8,
            y: 1.6,
            w: SLIDE_W - 1.6,
            h: 2,
            showLegend: false,
            chartColors: [BLUE_600],
            barDir: "bar",
            barGapWidthPct: 60,
            dataLabelPosition: "outEnd",
            showDataTable: true,
            dataLabelFontSize: 10,
            dataLabelColor: NAVY_800,
            catAxisLabelFontSize: 10,
            catAxisLabelFontFace: "Calibri",
            valAxisHidden: true,
            catAxisLineShow: false,
            valAxisLineShow: false,
          }
        );
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // SLIDE 8 : Key Insights
    // ═══════════════════════════════════════════════════════════════════
    const slideInsights = pptx.addSlide();
    slideInsights.background = { fill: SLATE_50 };
    applyHeaderLayout(slideInsights, "Key Insights", 8);

    const insights = [
      {
        icon: "\u2713",
        label: "Completion Rate",
        value: `${completionRate}%`,
        color: GREEN,
        desc: `${completed} of ${total} tasks completed`,
      },
      {
        icon: "\u2605",
        label: "Most Active",
        value: leaderboard.length > 0 ? leaderboard[0].name : "N/A",
        color: BLUE_600,
        desc:
          leaderboard.length > 0
            ? `${leaderboard[0].count} tasks completed`
            : "",
      },
      {
        icon: "\u26A0",
        label: "Blocker Rate",
        value: `${blockerRate}%`,
        color: RED,
        desc: `${blockers} blockers across ${total} tasks`,
      },
      {
        icon: "\u23F1",
        label: "Avg Duration",
        value: `${avgDuration} min`,
        color: CYAN_DARK,
        desc: `${totalHours} total minutes logged`,
      },
    ];

    const insightW = 2.7;
    const insightGap = 0.35;
    const insightTotalW =
      insights.length * insightW + (insights.length - 1) * insightGap;
    const insightStartX = (SLIDE_W - insightTotalW) / 2;

    insights.forEach((ins, i) => {
      const ix = insightStartX + i * (insightW + insightGap);
      const iy = 1.8;

      // Card
      slideInsights.addShape("roundRect", {
        x: ix,
        y: iy,
        w: insightW,
        h: 3.6,
        fill: { color: WHITE },
        rectRadius: 0.12,
        shadow: {
          type: "outer",
          blur: 6,
          offset: 3,
          angle: 270,
          color: "000000",
          opacity: 0.12,
        },
        line: { color: GRAY_200, width: 0.5 },
      });

      // Colored top strip
      slideInsights.addShape("rect", {
        x: ix,
        y: iy,
        w: insightW,
        h: 0.08,
        fill: { color: ins.color },
      });

      // Icon circle
      slideInsights.addShape("ellipse", {
        x: ix + insightW / 2 - 0.45,
        y: iy + 0.3,
        w: 0.9,
        h: 0.9,
        fill: { color: ins.color, transparency: 85 },
      });

      slideInsights.addText(ins.icon, {
        x: ix + insightW / 2 - 0.45,
        y: iy + 0.3,
        w: 0.9,
        h: 0.9,
        align: "center",
        fontSize: 24,
        color: ins.color,
        fontFace: "Calibri",
      });

      // Label
      slideInsights.addText(ins.label.toUpperCase(), {
        x: ix + 0.15,
        y: iy + 1.35,
        w: insightW - 0.3,
        h: 0.35,
        align: "center",
        fontSize: 9,
        bold: true,
        color: SLATE_700,
        fontFace: "Calibri",
      });

      // Big value
      slideInsights.addText(ins.value, {
        x: ix + 0.15,
        y: iy + 1.7,
        w: insightW - 0.3,
        h: 0.8,
        align: "center",
        fontSize: 28,
        bold: true,
        color: NAVY_800,
        fontFace: "Calibri",
      });

      // Description
      slideInsights.addText(ins.desc, {
        x: ix + 0.15,
        y: iy + 2.6,
        w: insightW - 0.3,
        h: 0.6,
        align: "center",
        fontSize: 10,
        color: SLATE_700,
        fontFace: "Calibri",
      });
    });

    // Bottom decorative line
    slideInsights.addShape("rect", {
      x: 2,
      y: 5.9,
      w: SLIDE_W - 4,
      h: 0.03,
      fill: { color: GRAY_200 },
    });

    slideInsights.addText(
      `Report generated for ${employee} | ${from} to ${to}`,
      {
        x: 2,
        y: 6.0,
        w: SLIDE_W - 4,
        h: 0.4,
        align: "center",
        fontSize: 9,
        color: SLATE_700,
        fontFace: "Calibri",
        italic: true,
      }
    );

    // ═══════════════════════════════════════════════════════════════════
    // SLIDE 9 : Thank You / Closing
    // ═══════════════════════════════════════════════════════════════════
    const slideThanks = pptx.addSlide();
    slideThanks.background = { fill: NAVY };

    // Large decorative circle
    slideThanks.addShape("ellipse", {
      x: SLIDE_W / 2 - 4,
      y: SLIDE_H / 2 - 4,
      w: 8,
      h: 8,
      fill: { color: NAVY_800, transparency: 40 },
    });

    // Smaller decorative circles
    slideThanks.addShape("ellipse", {
      x: SLIDE_W - 3,
      y: -1.5,
      w: 4,
      h: 4,
      fill: { color: BLUE_700, transparency: 70 },
    });
    slideThanks.addShape("ellipse", {
      x: -1.5,
      y: SLIDE_H - 2.5,
      w: 3,
      h: 3,
      fill: { color: BLUE_700, transparency: 70 },
    });

    // Accent dots
    slideThanks.addShape("ellipse", {
      x: 3,
      y: 1.5,
      w: 0.2,
      h: 0.2,
      fill: { color: CYAN, transparency: 30 },
    });
    slideThanks.addShape("ellipse", {
      x: 10,
      y: 5.8,
      w: 0.15,
      h: 0.15,
      fill: { color: BLUE_500, transparency: 40 },
    });
    slideThanks.addShape("ellipse", {
      x: 8,
      y: 1.2,
      w: 0.12,
      h: 0.12,
      fill: { color: CYAN, transparency: 50 },
    });

    // THANK YOU text
    slideThanks.addText("THANK YOU", {
      x: 1,
      y: 2.0,
      w: SLIDE_W - 2,
      h: 1.5,
      align: "center",
      fontSize: 54,
      bold: true,
      color: WHITE,
      fontFace: "Calibri",
    });

    // Accent line
    slideThanks.addShape("rect", {
      x: SLIDE_W / 2 - 1.5,
      y: 3.6,
      w: 2,
      h: 0.08,
      fill: { color: CYAN },
    });
    slideThanks.addShape("rect", {
      x: SLIDE_W / 2 + 0.6,
      y: 3.6,
      w: 0.9,
      h: 0.08,
      fill: { color: BLUE_500 },
    });

    // Subtitle
    slideThanks.addText("For your time and attention", {
      x: 2,
      y: 3.9,
      w: SLIDE_W - 4,
      h: 0.6,
      align: "center",
      fontSize: 18,
      color: GRAY_300,
      fontFace: "Calibri",
      italic: true,
    });

    // Website
    slideThanks.addText("www.innovaturelabs.com", {
      x: 2,
      y: 4.8,
      w: SLIDE_W - 4,
      h: 0.4,
      align: "center",
      fontSize: 14,
      color: BLUE_500,
      fontFace: "Calibri",
    });

    // Generated date
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    slideThanks.addText(`Report generated on ${today}`, {
      x: 2,
      y: 5.5,
      w: SLIDE_W - 4,
      h: 0.4,
      align: "center",
      fontSize: 10,
      color: SLATE_700,
      fontFace: "Calibri",
    });

    // Bottom accent bar
    slideThanks.addShape("rect", {
      x: 0,
      y: SLIDE_H - 0.15,
      w: SLIDE_W,
      h: 0.15,
      fill: { color: BLUE_600 },
    });

    // Logo centered
    slideThanks.addImage({
      path: "public/logo.png",
      x: SLIDE_W / 2 - 1.1,
      y: 6.0,
      w: 2.2,
      h: 0.8,
    });

    // ── Export ──────────────────────────────────────────────────────────

    const pptBuffer = (await pptx.write({
      outputType: "nodebuffer",
    })) as Buffer;

    return new NextResponse(Buffer.from(pptBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="Activity_Report.pptx"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to generate PPT report" },
      { status: 500 }
    );
  }
}

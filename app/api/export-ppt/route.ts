import { NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import { google } from "googleapis";

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


    const applyCoverLayout = (slide: any) => {
      const slideWidth = 13.33;

      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: slideWidth,
        h: 1.2,
        fill: { color: "1E3A8A" }, // dark blue
      });

      // Accent strip
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 1.2 - 0.15,
        w: slideWidth,
        h: 0.15,
        fill: { color: "3B82F6" },
      });

      // Website (Top Right)
      slide.addImage({
        path: "public/logo.png",
        x: 0.5,
        y: 0.15,
        w: 2.2  ,
        h: 0.8,
      });

      // Bottom Bar
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 7.2,
        w: slideWidth,
        h: 0.4,
        fill: { color: "3B82F6" },
      });
    };

    const applyHeaderLayout = (slide: any, heading: string) => {

      const slideWidth = 13.33;
      // Blue Header
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 0,
        w: slideWidth,
        h: 1.2,
        fill: { color: "1E3A8A" }, // dark blue
      });

      // Accent strip
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 1.2 - 0.15,
        w: slideWidth,
        h: 0.15,
        fill: { color: "3B82F6" },
      });

      // Heading in Header
      slide.addText(heading, {
        x: 0.7,
        y: 0.35,
        fontSize: 26,
        bold: true,
        color: "FFFFFF",
      });

      // Website Right
      slide.addText("www.innovaturelabs.com", {
        x: slideWidth - 4,
        y: 0.4,
        w: 3.5,
        align: "right",
        fontSize: 12,
        color: "FFFFFF",
      });

      // Bottom Bar
      slide.addShape(pptx.ShapeType.rect, {
        x: 0,
        y: 7.2,
        w: slideWidth,
        h: 0.3,
        fill: { color: "3B82F6" },
      });

    };

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
    const totalHours = filtered.reduce((sum, r) => sum + (parseInt(r[6]) || 0), 0);
    const avgDuration = total ? (totalHours / total).toFixed(1) : 0;

    const employeeMap: Record<string, number> = {};
    filtered.forEach((r) => {
      const name = r[2];
      employeeMap[name] = (employeeMap[name] || 0) + 1;
    });

    const leaderboard = Object.entries(employeeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => [name, count]);

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";

    pptx.theme = {
      headFontFace: "Calibri",
      bodyFontFace: "Calibri",
    };

    const slide1 = pptx.addSlide();
    applyCoverLayout(slide1);
  

    // Background color
    slide1.background = { fill: "F8FAFC" };

    // Big Title
    slide1.addText("ACTIVITY REPORT", {
      x: 1,
      y: 1.2,
      w: 11,
      h: 1,
      fontSize: 48,
      bold: true,
      color: "1E293B",
    });

    // Accent Line
    slide1.addShape(pptx.ShapeType.rect, {
      x: 1,
      y: 2.1,
      w: 3,
      h: 0.15,
      fill: { color: "3B82F6" },
    });

    // Details Section
      slide1.addText(
        [
          { text: `Employee: `, options: { bold: true } },
          { text: employee + "\n" },
          { text: `From: `, options: { bold: true } },
          { text: `${from}   To: ${to}\n` },
          { text: `Report Type: `, options: { bold: true } },
          { text: type.toUpperCase() },
        ],
      {
        x: 1,
        y: 2.8,
        w: 10,
        h: 2,
        fontSize: 22,
        color: "334155",
        lineSpacingMultiple: 1.3,
      }
    );


    const slideHighlights = pptx.addSlide();
    applyHeaderLayout(slideHighlights, "Dashboard Overview");

    slideHighlights.background = { fill: "FFFFFF" };


    // KPI Card Function
    const addCard = (
      slide: any,
      x: number,
      title: string,
      value: number,
      color: string
    ) => {
      slide.addShape(pptx.ShapeType.roundRect, {
        x,
        y: 1.6,
        w: 2,
        h: 2,
        fill: { color },
        line: { color },
        rectRadius: 0.2,
      });

      slide.addText(value.toString(), {
        x,
        y: 1.9,
        w: 2,
        h: 1,
        align: "center",
        fontSize: 40,
        bold: true,
        color: "FFFFFF",
      });

      slide.addText(title, {
        x,
        y: 2.8,
        w: 2,
        h: 0.5,
        align: "center",
        fontSize: 16,
        color: "FFFFFF",
      });
    };

    addCard(slideHighlights, 1, "Total Tasks", total, "3B82F6");
    addCard(slideHighlights, 3.5, "Completed", completed, "10B981");
    addCard(slideHighlights, 6, "Pending", pending, "F59E0B");
    addCard(slideHighlights, 8.5, "Blockers", blockers, "EF4444");
    slideHighlights.addChart(
      pptx.ChartType.line,
      [
        {
          name: "Tasks",
          labels: ["Completed", "Pending", "Blockers"],
          values: [completed, pending, blockers],
        },
      ],
      {
        x: 2,
        y: 4.2,
        w: 10,
        h: 3,
        showLegend: false,
        chartColors: ["10B981", "F59E0B", "EF4444"],
        dataLabelPosition: "outEnd",
        dataLabelFontSize: 12,
      }
    );

    const slide2 = pptx.addSlide();
    applyHeaderLayout(slide2, "Summary Overview");
    slide2.background = { fill: "F8FAFC" };


    slide2.addText(
      `Total Hours Worked: ${totalHours} min\n\nAverage Duration: ${avgDuration} min/task`,
      {
        x: 1,
        y: 1.6,
        w: 5,
        h: 3,
        fontSize: 22,
        color: "334155",
        lineSpacingMultiple: 1.4,
      }
    );

    slide2.addChart(
      pptx.ChartType.pie,
      [
        {
          name: "Tasks",
          labels: ["Completed", "Pending"],
          values: [completed, pending],
        },
      ],
      {
        x: 6,
        y: 1.2,
        w: 6,
        h: 4.5,
        showLegend: true,
        legendPos: "r",
        chartColors: ["10B981", "F59E0B"],
        dataLabelPosition: "bestFit",
      }
    );

    const slide3 = pptx.addSlide();
    applyHeaderLayout(slide3, "Recent Activities");
    
    const tableData: any[] = [
      ["Name", "Date", "Type", "Description", "Duration", "Status", "Blocker"],
    ];

    filtered.forEach((row) => {
      tableData.push([
        row[2],
        row[5],
        row[3],
        row[4],
        `${row[6]} min`,
        row[7], 
        row[8] === "TRUE" ? "YES 🚨" : "NO",
      ]);
    });

    slide3.background = { fill: "FFFFFF" };

    slide3.addTable(tableData, {
      x: 0.5,
      y: 1.5,
      w: 12,
      fontSize: 12,
      border: { type: "solid", color: "E2E8F0" },
      fill: { color: "FFFFFF" },
      color: "334155",
      autoPage: true,
    });


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

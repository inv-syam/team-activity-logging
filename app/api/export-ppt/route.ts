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

    const filtered = data.filter((row) => {
      const name = row[2];
      const status = row[7];
      const blocker = row[8];

      if (employee !== "All Employees" && name !== employee) return false;

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

    slide1.addText("Activity Report", {
      x: 1,
      y: 1,
      w: 10,
      h: 1,
      fontFace: "Calibri",
      fontSize: 44,
      bold: true,
      color: "000000",
    });

    slide1.addText(`Employee: ${employee}`, {
      x: 1,
      y: 2.3,
      w: 10,
      h: 0.5,
      fontFace: "Calibri",
      fontSize: 22,
      color: "333333",
    });

    slide1.addText(`From: ${from}   To: ${to}`, {
      x: 1,
      y: 3,
      w: 10,
      h: 0.5,
      fontFace: "Calibri",
      fontSize: 20,
      color: "333333",
    });

    slide1.addText(`Report Type: ${type.toUpperCase()}`, {
      x: 1,
      y: 3.7,
      w: 10,
      h: 0.5,
      fontFace: "Calibri",
      fontSize: 20,
      color: "333333",
    });

    slide1.addText(`Total Hours Worked: ${totalHours} min`, {
        x: 1,
        y: 4.5,
        w: 10,      // Increase width
        h: 0.7,     // Increase height
        fontSize: 20,
        color: "0000FF",
        bold: true,
      });
      
      slide1.addText(`Average Duration: ${avgDuration} min/task`, {
        x: 1,
        y: 5.3,
        w: 10,      // Increase width
        h: 0.7,     // Increase height
        fontSize: 20,
        color: "0000FF",
        bold: true,
      });

    const slideHighlights = pptx.addSlide();

    slideHighlights.addText("Report Highlights", {
        x: 1,
        y: 0.7,
        w: 12,
        h: 0.8,
        fontFace: "Calibri",
        fontSize: 36,
        bold: true,
        color: "000000",
    });

    slideHighlights.addText(
        `📌 Total Tasks Logged: ${total}\n\n✅ Completed Tasks: ${completed}\n\n⏳ Pending Tasks: ${pending}\n\n🚨 Blockers Reported: ${blockers}`,
        {
            x: 1,
            y: 2,
            w: 11,
            h: 4,
            fontFace: "Calibri",
            fontSize: 24,
            color: "333333",
            lineSpacingMultiple: 1.4,
        }
    );

    slideHighlights.addChart(
        pptx.ChartType.bar,
        [
          {
            name: "Task Count",
            labels: ["Completed", "Pending", "Blockers"],
            values: [completed, pending, blockers],
          },
        ],
        {
          x: 6.5,
          y: 1.8,
          w: 6,
          h: 4,
      
          showLegend: false,
      
          dataLabelPosition: "outEnd",
          dataLabelFormatCode: "0",
      
          chartColors: ["00A65A", "FF9900", "FF0000"], // green, orange, red
        }
      );
      
      // Footer Note
      slideHighlights.addText("Generated Automatically from Google Sheets", {
        x: 1,
        y: 6.9,
        w: 11,
        h: 0.4,
        fontSize: 14,
        italic: true,
        color: "666666",
      });

    const slide2 = pptx.addSlide();

    slide2.addText("Summary Overview", {
        x: 1,
        y: 0.5,
        w: 10,
        h: 0.8,
        fontFace: "Calibri",
        fontSize: 34,
        bold: true,
        color: "000000",
    });

    slide2.addText(`Total Activities: ${total}`, {
        x: 1,
        y: 1.5,
        w: 6,
        h: 0.5,
        fontSize: 20,
    });

    slide2.addText(`Completed: ${completed}`, {
        x: 1,
        y: 2.2,
        w: 6,
        h: 0.5,
        fontSize: 18,
        color: "008000",
    });

    slide2.addText(`Pending: ${pending}`, {
        x: 1,
        y: 2.8,
        w: 6,
        h: 0.5,
        fontSize: 18,
        color: "FF8C00",
    });

    slide2.addText(`Blockers: ${blockers}`, {
        x: 1,
        y: 3.4,
        w: 6,
        h: 0.5,
        fontSize: 18,
        color: "FF0000",
    });

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
          x: 6.5,
          y: 1.3,
          w: 6.5,
          h: 4.5,
      
          showLegend: true,
          legendPos: "r",
      
          dataLabelPosition: "bestFit",
          dataLabelFormatCode: "0",
        }
    );

    const slide3 = pptx.addSlide();

    slide3.addText("Recent Activities", {
      x: 1,
      y: 0.6,
      w: 10,
      h: 0.8,
      fontFace: "Calibri",
      fontSize: 30,
      bold: true,
      color: "000000",
    });

    const tableData: any[] = [
      ["Name", "Date", "Type", "Description", "Duration", "Status", "Blocker"],
    ];

    filtered.slice(0, 8).forEach((row) => {
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

    slide3.addTable(tableData, {
      x: 0.5,
      y: 1.5,
      w: 13.2,
      fontFace: "Calibri",
      fontSize: 12,
      border: { type: "solid", color: "999999" },
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

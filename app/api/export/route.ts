import { google } from "googleapis";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const sheetId = searchParams.get("sheetId");
    const employee = searchParams.get("employee") || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const type = searchParams.get("type") || "all";

    if (!sheetId || !from || !to) {
      return new Response("Missing parameters", { status: 400 });
    }

    // ✅ Google Auth using Service Account
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // ✅ Read Activities Sheet
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Activities!A:I",
    });

    const rows = result.data.values;

    if (!rows || rows.length === 0) {
      return new Response("No data found", { status: 404 });
    }

    const header = rows[0];
    const data = rows.slice(1);

    // ✅ Date Filter
    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59);

    // ✅ Apply Filters
    const filtered = data.filter((row) => {
      const memberName = row[2];
      const rowDate = new Date(row[5]);
      const status = row[7];
      const blocker = row[8];

      if (employee && memberName !== employee) return false;
      if (rowDate < start || rowDate > end) return false;

      if (type === "pending" && status !== "pending") return false;
      if (type === "completed" && status !== "completed") return false;
      if (type === "blocker" && blocker !== "TRUE") return false;

      return true;
    });

    // ✅ Convert to CSV
    const csv = [header, ...filtered]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // ✅ Send CSV File Download
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="Activity_Report.csv"`,
      },
    });
  } catch (err) {
    console.error("Export Error:", err);
    return new Response("Export failed", { status: 500 });
  }
}

# 📌 Team Activity Logging & Reporting Platform

A full-stack platform to log daily team activities, track blockers, and generate professional reports in multiple formats (CSV, PPT, PDF).

## 🚀 Features

✅ Log team activities with:

- Activity Type  
- Description  
- Duration  
- Status (Completed / Pending)  
- Blockers 🚨  

✅ Dashboard Analytics:

- Total Activities  
- Total Hours Worked  
- Average Task Duration  
- Blocker Count  
- Weekly Activity Summary  

✅ Export Reports:

- 📄 Download as CSV  
- 📊 Download as PowerPoint (PPT)  
- 📑 Download as PDF  

✅ Filters Supported:

- All Activities  
- Completed Activities  
- Pending Activities  
- Blocker Activities  

## 🖥️ Tech Stack

| Layer       | Technology |
|------------|------------|
| Frontend   | Next.js + React + Tailwind |
| UI Library | shadcn/ui |
| Charts     | Recharts |
| Backend    | Next.js API Routes |
| Database   | Google Sheets |
| Export     | CSV / PPTXGenJS / jsPDF |

---

## 📂 Project Structure

app/
├── api/
│ ├── export/ → CSV Export Route
│ ├── export-ppt/ → PPT Export Route
│ ├── export-pdf/ → PDF Export Route
│
├── dashboard/
│ ├── activity-reports.tsx
│
components/
├── ui/

## ⚙️ Environment Setup

Create a `.env.local` file in root:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account-email
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your-sheet-id
NEXT_PUBLIC_EXPORT_URL=https://script.google.com/a/macros/innovaturelabs.com/s/AKfycbyV1a-W5oYMnsskrNdhS9HMLbNUrZI6OO6k-Oo4MVhJw85N1XAUdZld1z35fC-25ggY/exec
NEXT_PUBLIC_SHEET_ID=your-sheet-id

🔑 Google Sheets Configuration
1. Create a Google Cloud Service Account

  Enable: Google Sheets API

  Download the JSON key file.

2. Share Your Sheet with Service Account Email
  Example: team-management@project.iam.gserviceaccount.com
  Give Viewer Access.

Run the Project

Install dependencies: npm install
Start development server: npm run dev
Open: http://localhost:3000

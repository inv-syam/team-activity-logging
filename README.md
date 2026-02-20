# 📌 Team Activity Logging & Reporting Platform

A modern full-stack platform to log daily team activities, track blockers, manage team members, and generate professional reports in multiple formats (CSV, PPT, PDF). Built with Next.js 16, React 19, TypeScript, and Google Sheets as the database.

## 🚀 Features

### ✅ Activity Management
- Log team activities with:
  - Member selection
  - Activity Type (customizable categories)
  - Description with URL linkification
  - Date selection
  - Duration (in minutes)
  - Status (Completed / Pending)
  - Blocker flag 🚨

### ✅ Interactive Dashboard
- **Calendar View**: Visual monthly calendar showing activities by day
- **Activity Heatmap**: See activity density at a glance
- **Day Details**: Click any day to view all activities
- **Real-time Filters**: Filter by member, activity type, or view all
- **Pending Tasks Dialog**: Quick access to all pending tasks
- **Theme Toggle**: Light/Dark mode support

### ✅ Analytics & Reports
- **Dashboard Overview**:
  - Total Activities count
  - Total Hours Worked
  - Average Task Duration
  - Blocker Count
  - Weekly Activity Summary

- **Visual Charts**:
  - Activities by Member (Bar Chart)
  - Activities by Type (Pie Chart)
  - Last 7 Days Activity Trend

- **Export Reports** (with date range and filters):
  - 📄 CSV Export
  - 📊 PowerPoint (PPT) Export with charts and KPIs
  - 📑 PDF Export with company logo and formatted tables

### ✅ Team Management
- Add and manage team members
- Assign roles and contact information
- Color-coded member identification

### ✅ Activity Types
- Create custom activity categories
- Assign colors and icons to types
- Flexible categorization system

### ✅ Automated Reporting (via Google Apps Script)
- Weekly PDF reports (sent every Monday at 9 AM)
- Monthly PDF reports (sent on 1st of each month at 9 AM)
- Email delivery to specified recipients

## 🖥️ Tech Stack

| Layer       | Technology |
|------------|------------|
| Frontend   | Next.js 16.1.6 + React 19.2.3 + TypeScript 5.7.3 |
| UI Library | shadcn/ui (Radix UI primitives) |
| Styling    | Tailwind CSS 3.4.17 + PostCSS |
| Charts     | Recharts 2.15.0 |
| Backend    | Next.js API Routes |
| Database   | Google Sheets (via googleapis 171.4.0) |
| Export     | CSV / PPTXGenJS 4.0.1 / jsPDF 4.1.0 + jspdf-autotable 5.0.7 |
| Forms      | React Hook Form 7.54.1 + Zod 3.24.1 |
| Icons      | Lucide React 0.544.0 |
| Theme      | next-themes 0.4.6 |

---

## 📂 Project Structure

```
/home/runner/work/team-activity-logging/team-activity-logging/
├── app/
│   ├── api/
│   │   ├── activities/route.ts      → Activities CRUD API
│   │   ├── members/route.ts         → Members CRUD API
│   │   ├── activity-types/route.ts  → Activity Types CRUD API
│   │   ├── export/route.ts          → CSV Export Route
│   │   ├── export-ppt/route.ts      → PowerPoint Export Route
│   │   └── export-pdf/route.ts      → PDF Export Route
│   ├── layout.tsx                    → Root layout with theme provider
│   ├── page.tsx                      → Main application page
│   └── globals.css                   → Global styles
│
├── components/
│   ├── activity-form.tsx             → Activity logging form
│   ├── activity-reports.tsx          → Reports and analytics page
│   ├── activity-types-panel.tsx      → Activity types management
│   ├── dashboard.tsx                 → Calendar dashboard
│   ├── day-details.tsx               → Day-specific activity details
│   ├── linkified-text.tsx            → URL linkification component
│   ├── members-panel.tsx             → Team members management
│   ├── theme-provider.tsx            → Theme context provider
│   └── ui/                           → shadcn/ui components
│
├── lib/
│   ├── google-sheets.ts              → Google Sheets integration
│   └── utils.ts                      → Utility functions
│
├── appscript/
│   └── appscript.txt                 → Google Apps Script for automated reports
│
├── public/
│   ├── company_logo.jpeg             → Company logo for PDF reports
│   └── placeholder.svg               → Placeholder assets
│
├── .env.example                      → Environment variables template
├── package.json                      → Dependencies and scripts
├── tsconfig.json                     → TypeScript configuration
└── tailwind.config.ts                → Tailwind CSS configuration
```

---

## ⚙️ Environment Setup

### 1. Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager
- Google Cloud Platform account
- Google Spreadsheet

### 2. Create Environment Variables

Create a `.env.local` file in the project root:

```env
# Google Sheets API credentials
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_CONTENT\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_spreadsheet_id
NEXT_PUBLIC_SHEET_ID=your_spreadsheet_id
```

### 3. Google Cloud Setup

#### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

#### Step 2: Enable APIs
Enable the following APIs:
- **Google Sheets API**
- **Google Drive API** (for Apps Script features)

#### Step 3: Create Service Account
1. Navigate to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Give it a name (e.g., "team-activity-logger")
4. Click **Create and Continue**
5. Skip granting roles (optional)
6. Click **Done**

#### Step 4: Generate Service Account Key
1. Click on the created service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create New Key**
4. Select **JSON** format
5. Click **Create** (JSON file will download)

#### Step 5: Extract Credentials
Open the downloaded JSON file and copy:
- `client_email` → Use as `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → Use as `GOOGLE_PRIVATE_KEY` (keep the `\n` characters)

### 4. Google Sheets Setup

#### Step 1: Create a Spreadsheet
1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Note the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```

#### Step 2: Share with Service Account
1. Click **Share** button
2. Paste the service account email (from `client_email`)
3. Grant **Editor** access
4. Uncheck "Notify people"
5. Click **Share**

#### Step 3: Sheet Structure
The application will automatically create three sheets:
- **Members**: Stores team member information
- **ActivityTypes**: Stores activity categories
- **Activities**: Stores all logged activities

---

## 🚀 Installation & Running

### Install Dependencies

Using npm:
```bash
npm install
```

Using pnpm:
```bash
pnpm install
```

### Development Mode

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

### Lint Code

```bash
npm run lint
```

---

## 📧 Automated Email Reports (Optional)

To enable automated weekly and monthly PDF reports:

### 1. Open Apps Script Editor
1. Open your Google Spreadsheet
2. Go to **Extensions** → **Apps Script**

### 2. Add the Script
Copy the content from `appscript/appscript.txt` and paste it into the script editor.

### 3. Configure Email
Update the email address in the script:
```javascript
const email = "your-email@example.com";
```

### 4. Create Triggers
Run the following functions once:
- `createWeeklyTrigger()` - Sends report every Monday at 9 AM
- `createMonthlyTrigger()` - Sends report on 1st of each month at 9 AM

### 5. Authorize
Grant necessary permissions when prompted.

---

## 🎨 Features Overview

### Dashboard Tab
- Visual calendar showing all activities
- Filter by member or activity type
- Click on any day to see detailed activities
- Add new activities with the "Log Activity" button

### Reports Tab
- View comprehensive analytics
- Bar charts showing hours by member
- Pie charts showing activities by type
- Export filtered data as CSV, PPT, or PDF
- Date range filtering
- Employee-specific reports

### Members Tab
- Add new team members
- View member details (name, role, email, color)
- Manage team roster

### Activity Types Tab
- Create custom activity categories
- Assign colors for visual identification
- Add emoji icons for better UX

---

## 🔧 Configuration

### Theme
The application supports light and dark modes. Users can toggle between themes using the theme switcher in the navigation bar.

### Customization
- Modify colors in `tailwind.config.ts`
- Update company logo at `public/company_logo.jpeg` for PDF reports
- Adjust chart colors in `components/activity-reports.tsx`

---

## 📝 Usage

1. **Add Team Members**: Go to Members tab and add your team
2. **Create Activity Types**: Go to Activity Types tab and create categories
3. **Log Activities**: Use "Log Activity" button to track work
4. **View Dashboard**: Check the calendar for activity overview
5. **Generate Reports**: Go to Reports tab and export filtered data

---

## 🤝 Contributing

This is a custom internal tool. For feature requests or bug reports, please contact the development team.

---

## 📄 License

Private - Internal Use Only

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download } from 'lucide-react'

export function ActivityReports({ activities, members, activityTypes }: any) {
  const [period, setPeriod] = useState('month')

  const [showExportPopup, setShowExportPopup] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [reportType, setReportType] = useState("all")

  // Calculate total hours by member
  const hoursByMember = members.map((member: any) => {
    const totalMinutes = activities
      .filter((activity: any) => activity.memberId === member.id)
      .reduce((sum: number, activity: any) => sum + activity.duration, 0)
    return {
      name: member.name,
      hours: parseFloat((totalMinutes / 60).toFixed(1)),
      minutes: totalMinutes,
    }
  })

  // Calculate activities by type
  const activitiesByType = activityTypes.map((type: any) => {
    const count = activities.filter((activity: any) => activity.activityType === type.id).length
    return {
      name: type.name,
      value: count,
      color: type.color,
    }
  })

  // Total statistics
  const totalActivities = activities.length
  const totalHours = activities.reduce((sum: number, activity: any) => sum + activity.duration, 0) / 60
  const avgActivityLength = totalActivities > 0 ? Math.round(activities.reduce((sum: number, activity: any) => sum + activity.duration, 0) / totalActivities) : 0

  const blockerActivities = activities.filter(
    (a: any) =>
      a.blocker === true ||
      a.blocker === "TRUE" ||
      a.blocker === "true"
  )

  const totalBlockers = blockerActivities.length
  
  // Activities by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count: activities.filter((activity: any) => {
        const actDate = new Date(activity.date)
        return actDate.toDateString() === date.toDateString()
      }).length,
    }
  }).reverse()

  const generateEmployeeReport = (format: "csv" | "ppt") => {
    if (!fromDate || !toDate) {
      alert("Please select date range")
      return
    }

    const employeeParam = selectedEmployee ? selectedEmployee : "";

    let url = "";
  
    if (format === "csv") {
      url = `/api/export?sheetId=${process.env.NEXT_PUBLIC_SHEET_ID}&employee=${employeeParam}&from=${fromDate}&to=${toDate}&type=${reportType}`;
    } else if (format === "ppt") {
      url = `/api/export-ppt?sheetId=${process.env.NEXT_PUBLIC_SHEET_ID}&employee=${employeeParam}&from=${fromDate}&to=${toDate}&type=${reportType}`;
    }
  
    window.open(url, "_blank");
  
    // Close popup after export
    setShowExportPopup(false)
    setSelectedEmployee("")
    setFromDate("")
    setToDate("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Activity Reports</h2>
          <p className="text-sm text-muted-foreground">Analytics and insights on team activities</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setShowExportPopup(true)}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Activities</p>
              <p className="text-3xl font-bold text-primary">{totalActivities}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-3xl font-bold text-primary">{totalHours.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg. Duration</p>
              <p className="text-3xl font-bold text-primary">{avgActivityLength}m</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Team Members</p>
              <p className="text-3xl font-bold text-primary">{members.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Blockers</p>
              <p className="text-3xl font-bold text-red-600">
                🚨 {totalBlockers}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Activities by Member</CardTitle>
            <CardDescription>Total hours logged per team member</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hoursByMember}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value) => `${value}h`}
                />
                <Legend />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Activities by Type</CardTitle>
            <CardDescription>Distribution of activity categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={activitiesByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {activitiesByType.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} activities`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Activities Last 7 Days</CardTitle>
          <CardDescription>Daily activity count</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Member Activity Summary</CardTitle>
          <CardDescription>Detailed breakdown by team member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {hoursByMember.map((member: any) => (
              <div key={member.name} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{member.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {activities.filter((a: any) => a.memberName === member.name).length} activities · {member.minutes} minutes total
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{member.hours}</div>
                  <p className="text-sm text-muted-foreground">hours</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>🚨 Current Blockers</CardTitle>
          <CardDescription>
            Activities that are blocked and need attention
          </CardDescription>
        </CardHeader>

        <CardContent>
          {totalBlockers === 0 ? (
            <p className="text-sm text-muted-foreground">
              No blockers reported 🎉
            </p>
          ) : (
            <div className="space-y-4">
              {blockerActivities.map((activity: any) => (
                <div
                  key={activity.id}
                  className="p-4 border border-red-500 rounded-xl bg-red-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-red-700">
                        {activity.memberName}
                      </h4>

                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>

                    <Badge className="bg-red-600 text-white">
                      Blocker 🚨
                    </Badge>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Date: {new Date(activity.date).toLocaleDateString()} · Status: {activity.status}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Export Popup */}
      {showExportPopup && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

        <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl p-6 space-y-6">

          {/* Title */}
          <div>
            <h3 className="text-xl font-bold text-foreground">
              Export Activity Report
            </h3>
            <p className="text-sm text-muted-foreground">
              Select employee and date range to export report.
            </p>
          </div>

          {/* Employee Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Select Employee
            </label>

            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full border border-border rounded-lg p-2 bg-background text-foreground"
            >
              <option value="">All Employees</option>

              {members.map((member: any) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">

            {/* From Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border border-border rounded-lg p-2 bg-background text-foreground"
              />
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border border-border rounded-lg p-2 bg-background text-foreground"
              />
            </div>

          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Report Type
            </label>

            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full border border-border rounded-lg p-2 bg-background text-foreground"
            >
              <option value="all">All Activities</option>
              <option value="pending">Pending Activities</option>
              <option value="completed">Completed Activities</option>
              <option value="blocker">Blocker Activities</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">

            <Button
              variant="outline"
              onClick={() => setShowExportPopup(false)}
            >
              Cancel
            </Button>

            <Button
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={() => generateEmployeeReport("csv")}
            >
              Download CSV
            </Button>

            <Button
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => generateEmployeeReport("ppt")}
            >
              Download PPT
            </Button>
          </div>
        </div>
      </div>
    )}
    </div>
  )
}

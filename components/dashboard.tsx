'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Filter, Check, Clock } from 'lucide-react'
import { PendingTasksDialog } from '@/components/ui/pending-tasks-dialog'

export function Dashboard({ activities, members, activityTypes, onSelectDay, onOpenForm }: any) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 11))
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [showPendingTasks, setShowPendingTasks] = useState(false)

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const filteredActivities = activities.filter((activity: any) => {
    const actDate = new Date(activity.date)
    const isSameMonth = actDate.getMonth() === currentDate.getMonth() && actDate.getFullYear() === currentDate.getFullYear()
    const memberMatch = !selectedMember || activity.memberId === selectedMember
    const typeMatch = !selectedType || activity.activityType === selectedType

    return isSameMonth && memberMatch && typeMatch
  })

  const activitiesByDate: { [key: number]: any[] } = {}
  filteredActivities.forEach((activity: any) => {
    const day = activity.date.getDate()
    if (!activitiesByDate[day]) {
      activitiesByDate[day] = []
    }
    activitiesByDate[day].push(activity)
  })

  const getActivityTypeColor = (typeId: string) => {
    const type = activityTypes.find((t: any) => t.id === typeId)
    return type?.color || '#000000'
  }

  const getActivityTypeIcon = (typeId: string) => {
    const type = activityTypes.find((t: any) => t.id === typeId)
    return type?.icon || '•'
  }

  const getActivityTypeName = (typeId: string) => {
    const type = activityTypes.find((t: any) => t.id === typeId)
    return type?.name || 'Activity'
  }

  const getMemberName = (memberId: string) => {
    const member = members.find((m: any) => m.id === memberId)
    return member?.name || 'Unknown'
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const monthName = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`

  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  const handleDayClick = (day: number) => {
    setSelectedDay(day)
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    onSelectDay(day, clickedDate)
    onOpenForm(clickedDate)
  }

  const calendarDays = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filter by:</span>
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={selectedMember ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedMember(null)}
          >
            All Members
          </Badge>
          {members.map((member: any) => (
            <Badge
              key={member.id}
              variant={selectedMember === member.id ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedMember(selectedMember === member.id ? null : member.id)}
            >
              {member.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <span className="text-sm text-muted-foreground">Activity Type:</span>
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={selectedType ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedType(null)}
          >
            All Types
          </Badge>
          {activityTypes.map((type: any) => (
            <Badge
              key={type.id}
              variant={selectedType === type.id ? 'default' : 'outline'}
              className="cursor-pointer"
              style={{ backgroundColor: getActivityTypeColor(type.id) }}
              color={getActivityTypeColor(type.id)}
              onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
            >
              {type.icon} {type.name}
            </Badge>
          ))}
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{monthName}</CardTitle>
              <CardDescription>Activity calendar — click a day to add or view activities</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setShowPendingTasks(true)}
              >
                <Clock className="w-4 h-4 mr-2" />
                Pending Tasks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={previousMonth}
                className="border-border hover:bg-secondary bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextMonth}
                className="border-border hover:bg-secondary bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm sm:text-base font-semibold text-muted-foreground py-2 sm:py-3">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 sm:gap-3 items-stretch">
              {calendarDays.map((day, index) => {
                const activityCount = day !== null ? (activitiesByDate[day] || []).length : 0
                return (
                  <div
                    key={index}
                    onClick={() => day !== null && handleDayClick(day)}
                    className={`rounded-lg border border-border p-2 sm:p-3 flex flex-col min-h-[8rem] cursor-pointer transition-all ${
                      day !== null
                        ? selectedDay === day
                          ? 'bg-primary/20 border-primary'
                          : 'bg-secondary/30 hover:bg-secondary/50 hover:border-primary/50'
                        : ''
                    }`}
                  >
                    {day !== null ? (
                      <>
                        <div className="text-sm sm:text-base font-medium text-foreground mb-1 sm:mb-2 shrink-0 text-center">{day}</div>
                        <div className="flex-1 space-y-1">
                          {(activitiesByDate[day] || []).map((activity: any) => {
                            const isCompleted = (activity.status || 'completed') === 'completed'
                            return (
                              <div
                                key={activity.id}
                                className="text-[10px] sm:text-xs py-0.5 sm:py-1 px-1.5 sm:px-2 rounded truncate text-white leading-tight flex items-center gap-1"
                                style={{ backgroundColor: getActivityTypeColor(activity.activityType) }}
                                title={activity.description}
                              >
                                {isCompleted ? (
                                  <Check className="w-3 h-3 shrink-0" style={{ strokeWidth: 3 }} />
                                ) : (
                                  <Clock className="w-3 h-3 shrink-0" style={{ strokeWidth: 3 }} />
                                )}
                                <span className="truncate font-bold">{getMemberName(activity.memberId)}</span>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <PendingTasksDialog
        open={showPendingTasks}
        onOpenChange={setShowPendingTasks}
        activities={activities}
        members={members}
        currentDate={currentDate}
      />
    </div>
  )
}

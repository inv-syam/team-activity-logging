'use client'

import { useEffect,useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LinkifiedText } from '@/components/linkified-text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X,Filter } from 'lucide-react'

export function DayDetails({ day, date, activities, members, activityTypes, onClose, onAddActivity }: any) {
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const formatDate = (date: Date) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
  }

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

  const getMemberColor = (memberId: string) => {
    const member = members.find((m: any) => m.id === memberId)
    return member?.color || 'bg-gray-600'
  }

  const dayActivities = activities.filter((activity: any) => {
    const actDate = new Date(activity.date)
    const selectedDate = new Date(date)

    const sameDate =
      actDate.getDate() === selectedDate.getDate() &&
      actDate.getMonth() === selectedDate.getMonth() &&
      actDate.getFullYear() === selectedDate.getFullYear()

    const matchesMember = !selectedMember || activity.memberId === selectedMember
    const matchesStatus = !selectedStatus || activity.status === selectedStatus

    return sameDate && matchesMember && matchesStatus
  })

  const totalDuration = dayActivities.reduce((sum: number, activity: any) => sum + activity.duration, 0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4 overflow-y-auto">
      <Card className="bg-card border-border w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <div>
            <h2 className="text-xl font-bold text-foreground">Activities for {formatDate(date)}</h2>
            <p className="text-sm text-muted-foreground mt-1">Day {day} of the month</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2 pt-4 pl-6">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by:</span>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={!selectedMember ? 'default' : 'outline'}
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
        <div className="flex items-center gap-2 mt-3  pt-4 pl-6">
          <span className="text-sm text-muted-foreground">Status:</span>

          <Badge
            variant={!selectedStatus ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedStatus(null)}
          >
            All
          </Badge>

          <Badge
            variant={selectedStatus === 'pending' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() =>
              setSelectedStatus(selectedStatus === 'pending' ? null : 'pending')
            }
          >
            Pending
          </Badge>

          <Badge
            variant={selectedStatus === 'completed' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() =>
              setSelectedStatus(selectedStatus === 'completed' ? null : 'completed')
            }
          >
            Completed
          </Badge>
        </div>


        <CardContent className="p-6 space-y-6 overflow-y-auto min-h-0 flex-1">
          {dayActivities.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{dayActivities.length}</div>
                  <div className="text-xs text-muted-foreground mt-1">Activities</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{totalDuration}</div>
                  <div className="text-xs text-muted-foreground mt-1">Minutes</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{(totalDuration / 60).toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Hours</div>
                </div>
              </div>

              <div className="space-y-3">
                {dayActivities.map((activity: any) => (
                  <div key={activity.id} className="border-l-2 border-primary pl-4 py-3 bg-secondary/20 rounded-r px-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">
                          <LinkifiedText text={activity.description} />
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">{getMemberName(activity.memberId)}</div>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <Badge className="text-xs" style={{ backgroundColor: getActivityTypeColor(activity.activityType), color: 'white' }}>
                            {getActivityTypeIcon(activity.activityType)} {getActivityTypeName(activity.activityType)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {activity.duration} min
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">No activities logged for this day</div>
              <Button
                onClick={onAddActivity}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Add First Activity
              </Button>
            </div>
          )}
        </CardContent>

        <div className="flex gap-3 justify-end p-6 pt-0 border-t border-border shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border hover:bg-secondary bg-transparent"
          >
            Close
          </Button>
          <Button
            onClick={onAddActivity}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Add Activity
          </Button>
        </div>
      </Card>
    </div>
  )
}

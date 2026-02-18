'use client'

import { Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Clock, User, Calendar } from 'lucide-react'

interface PendingTasksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activities: any[]
  members: any[]
  currentDate: Date
}

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export function PendingTasksDialog({
  open,
  onOpenChange,
  activities,
  members,
  currentDate,
}: PendingTasksDialogProps) {
  const selectedMonth = currentDate.getMonth()
  const selectedYear = currentDate.getFullYear()

  const pendingActivities = activities.filter((a: any) => {
    const actDate = new Date(a.date)
    return (
      (a.status || 'completed') !== 'completed' &&
      actDate.getMonth() === selectedMonth &&
      actDate.getFullYear() === selectedYear
    )
  })

  const memberPendingCounts = members.map((member: any) => {
    const count = pendingActivities.filter(
      (a: any) => a.memberId === member.id
    ).length
    return { ...member, pendingCount: count }
  })

  const totalPending = pendingActivities.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Pending Tasks
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {monthNames[selectedMonth]} {selectedYear} — {totalPending} pending{' '}
            {totalPending === 1 ? 'task' : 'tasks'}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 divide-y divide-border">
          {memberPendingCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No members found.
            </p>
          ) : (
            memberPendingCounts.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {member.name}
                  </span>
                </div>
                <span
                  className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold ${
                    member.pendingCount > 0
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {member.pendingCount}
                </span>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

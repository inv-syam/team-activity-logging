'use client'

import React from "react"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { X, Loader2 } from 'lucide-react'

export function ActivityForm({ members, activityTypes, onSubmit, onClose, initialDate }: any) {
  const getInitialDate = () => {
    if (initialDate) {
      const year = initialDate.getFullYear()
      const month = String(initialDate.getMonth() + 1).padStart(2, '0')
      const day = String(initialDate.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return new Date().toISOString().split('T')[0]
  }

  const [memberId, setMemberId] = useState('')
  const [activityType, setActivityType] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(getInitialDate())
  const [duration, setDuration] = useState('1')
  const [status, setStatus] = useState<'pending' | 'completed'>('completed')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [blocker, setBlocker] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!memberId || !activityType || !description) {
      alert('Please fill in all required fields')
      return
    }

    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const newActivity = {
        id: Date.now().toString(),
        memberId,
        memberName: members.find((m: any) => m.id === memberId)?.name || '',
        activityType,
        description,
        date: new Date(date),
        duration: parseInt(duration),
        status,
        blocker,
      }

      await onSubmit(newActivity)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isSubmitting])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className=" border-border w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Log New Activity</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="member" className="text-foreground">
                Team Member *
              </Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {members.map((member: any) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-foreground">
                Activity Type *
              </Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {activityTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.icon} {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-foreground">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-foreground">
                Duration (minutes)
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-secondary/80">
            <div className="space-y-0.5">
              <Label className="text-foreground">Status</Label>
              <p className="text-sm text-muted-foreground">
                {status === 'completed' ? 'Activity is done' : 'Activity is in progress'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${status === 'pending' ? 'text-foreground' : 'text-muted-foreground'}`}>Pending</span>
              <Switch
                checked={status === 'completed'}
                onCheckedChange={(checked) => setStatus(checked ? 'completed' : 'pending')}
              />
              <span className={`text-sm font-medium ${status === 'completed' ? 'text-foreground' : 'text-muted-foreground'}`}>Completed</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="What did the team member do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-border text-foreground min-h-24"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Blocker</span>
              <Switch
                checked={blocker}
                onCheckedChange={(checked) => setBlocker(checked)}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-border hover:bg-secondary bg-transparent"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Log Activity'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

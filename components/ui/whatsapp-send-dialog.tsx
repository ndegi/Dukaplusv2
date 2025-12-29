"use client"

import { useState } from "react"
import { MessageCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface WhatsAppSendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSend: (phoneNumber: string) => Promise<void>
  title?: string
  description?: string
  defaultPhone?: string
}

export function WhatsAppSendDialog({
  open,
  onOpenChange,
  onSend,
  title = "Send via WhatsApp",
  description = "Enter the customer's phone number with country code",
  defaultPhone = "",
}: WhatsAppSendDialogProps) {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!phoneNumber.trim()) {
      setError("Please enter a phone number")
      return
    }

    setIsSending(true)
    setError(null)

    try {
      await onSend(phoneNumber)
      onOpenChange(false)
      setPhoneNumber("")
    } catch (err) {
      setError("Failed to send. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              <Input
                id="phone"
                type="tel"
                placeholder="+254712345678"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value)
                  setError(null)
                }}
                className="flex-1"
                disabled={isSending}
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              setPhoneNumber("")
              setError(null)
            }}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="bg-emerald-600 hover:bg-emerald-700">
            {isSending ? (
              <>
                <Send className="w-4 h-4 mr-2 animate-pulse" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

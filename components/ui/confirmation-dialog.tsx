"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  variant?: "danger" | "warning" | "success"
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "danger",
}: ConfirmationDialogProps) {
  const getConfirmButtonClass = () => {
    switch (variant) {
      case "danger":
        return "btn-danger"
      case "warning":
        return "btn-warning"
      case "success":
        return "btn-success"
      default:
        return "btn-success"
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="dialog-content">
        <AlertDialogHeader>
          <AlertDialogTitle className="dialog-title">{title}</AlertDialogTitle>
          <AlertDialogDescription className="dialog-description">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
          <AlertDialogCancel className="btn-cancel w-full sm:w-auto">{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={`${getConfirmButtonClass()} w-full sm:w-auto`}>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

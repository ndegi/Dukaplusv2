"use client"

import { Eye, Download, Edit2, Trash2, Check, X } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface ActionButtonsProps {
  onView?: () => void
  onDownload?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onSubmit?: () => void
  onCancel?: () => void
  onPay?: () => void
  showView?: boolean
  showDownload?: boolean
  showEdit?: boolean
  showDelete?: boolean
  showSubmit?: boolean
  showCancel?: boolean
  showPay?: boolean
  size?: "sm" | "default" | "lg"
}

export function TableActionButtons({
  onView,
  onDownload,
  onEdit,
  onDelete,
  onSubmit,
  onCancel,
  onPay,
  showView = false,
  showDownload = false,
  showEdit = false,
  showDelete = false,
  showSubmit = false,
  showCancel = false,
  showPay = false,
  size = "sm",
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {showView && onView && (
        <button
          onClick={onView}
          className="action-btn-view p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}
      
      {showDownload && onDownload && (
        <Button onClick={onDownload} size={size} className="btn-success">
          <Download className="w-4 h-4" />
        </Button>
      )}

      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          className="action-btn-edit inline-flex items-center gap-1.5 px-2 py-1 rounded text-sm"
          title="Edit"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit</span>
        </button>
      )}

      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className="action-btn-delete p-2 rounded"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {showSubmit && onSubmit && (
        <Button onClick={onSubmit} size={size} className="btn-success">
          Submit
        </Button>
      )}

      {showPay && onPay && (
        <Button onClick={onPay} size={size} className="btn-warning">
          Pay
        </Button>
      )}

      {showCancel && onCancel && (
        <Button onClick={onCancel} size={size} className="btn-cancel">
          Cancel
        </Button>
      )}
    </div>
  )
}

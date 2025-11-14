"use client"

import { Eye, Download, Edit2, Trash2, Check, X, CreditCard } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
}: ActionButtonsProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-2">
        {showView && onView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onView}
                className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors text-blue-600 dark:text-blue-400"
                aria-label="View Details"
              >
                <Eye className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Details</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {showDownload && onDownload && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onDownload}
                className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors text-green-600 dark:text-green-400"
                aria-label="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download</p>
            </TooltipContent>
          </Tooltip>
        )}

        {showEdit && onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onEdit}
                className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors text-blue-600 dark:text-blue-400"
                aria-label="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit</p>
            </TooltipContent>
          </Tooltip>
        )}

        {showDelete && onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onDelete}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-red-600 dark:text-red-400"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete</p>
            </TooltipContent>
          </Tooltip>
        )}

        {showSubmit && onSubmit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onSubmit}
                className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors text-green-600 dark:text-green-400"
                aria-label="Submit"
              >
                <Check className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Submit</p>
            </TooltipContent>
          </Tooltip>
        )}

        {showPay && onPay && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onPay}
                className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors text-orange-600 dark:text-orange-400"
                aria-label="Pay"
              >
                <CreditCard className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pay</p>
            </TooltipContent>
          </Tooltip>
        )}

        {showCancel && onCancel && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-red-600 dark:text-red-400"
                aria-label="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cancel</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

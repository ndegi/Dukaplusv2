"use client"

import { Eye, Download, Edit2, Trash2, Check, X, CreditCard, FileText } from 'lucide-react'
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
  onCreateReceipt?: () => void
  showView?: boolean
  showDownload?: boolean
  showEdit?: boolean
  showDelete?: boolean
  showSubmit?: boolean
  showCancel?: boolean
  showPay?: boolean
  showCreateReceipt?: boolean
  size?: "sm" | "md" | "lg"
  status?: string
  docstatus?: number
}

export function TableActionButtons({
  onView,
  onDownload,
  onEdit,
  onDelete,
  onSubmit,
  onCancel,
  onPay,
  onCreateReceipt,
  showView = false,
  showDownload = false,
  showEdit = false,
  showDelete = false,
  showSubmit = false,
  showCancel = false,
  showPay = false,
  showCreateReceipt = false,
  size = "md",
  status,
  docstatus,
}: ActionButtonsProps) {
  const iconSize = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"
  const buttonPadding = size === "sm" ? "p-1.5" : size === "lg" ? "p-2.5" : "p-2"

  const isDraft = docstatus === 0 || status?.toLowerCase() === "draft"
  const CancelIcon = isDraft ? Trash2 : X
  const cancelLabel = isDraft ? "Delete" : "Cancel"

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-2">
        {showView && onView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onView}
                className={`${buttonPadding} hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors text-blue-600 dark:text-blue-400`}
                aria-label="View Details"
              >
                <Eye className={iconSize} />
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
                className={`${buttonPadding} hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors text-green-600 dark:text-green-400`}
                aria-label="Download"
              >
                <Download className={iconSize} />
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
                className={`${buttonPadding} hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors text-blue-600 dark:text-blue-400`}
                aria-label="Edit"
              >
                <Edit2 className={iconSize} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit</p>
            </TooltipContent>
          </Tooltip>
        )}

        {showSubmit && onSubmit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onSubmit}
                className={`${buttonPadding} hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors text-green-600 dark:text-green-400`}
                aria-label="Submit"
              >
                <Check className={iconSize} />
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
                className={`${buttonPadding} hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors text-orange-600 dark:text-orange-400`}
                aria-label="Pay"
              >
                <CreditCard className={iconSize} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pay</p>
            </TooltipContent>
          </Tooltip>
        )}

        {showCreateReceipt && onCreateReceipt && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onCreateReceipt}
                className={`${buttonPadding} hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors text-blue-600 dark:text-blue-400`}
                aria-label="Create Receipt"
              >
                <FileText className={iconSize} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create Receipt</p>
            </TooltipContent>
          </Tooltip>
        )}

        {(showCancel || showDelete) && (onCancel || onDelete) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onCancel || onDelete}
                className={`${buttonPadding} hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-red-600 dark:text-red-400`}
                aria-label={cancelLabel}
              >
                <CancelIcon className={iconSize} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{cancelLabel}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

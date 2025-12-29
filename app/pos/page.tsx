"use client"

import { useAuth } from "@/hooks/use-auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { POSInterface } from "@/components/pos/pos-interface"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { OpenShiftModal } from "@/components/shift/open-shift-modal"

export default function POSPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [currentSalesPerson, setCurrentSalesPerson] = useState<string | null>(null)
  const [showOpenShift, setShowOpenShift] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  useEffect(() => {
    console.log("[DukaPlus] POS Page: selectedCustomer changed to:", selectedCustomer)
  }, [selectedCustomer])

  if (isLoading || !user) {
    return null
  }

  return (
    <>
      <DashboardLayout
        searchTerm={searchTerm}
        quantity={quantity}
        selectedCustomer={selectedCustomer}
        onSearchChange={setSearchTerm}
        onQuantityChange={setQuantity}
        onCustomerChange={(customer) => {
          console.log("[DukaPlus] POS Page: onCustomerChange called with:", customer)
          setSelectedCustomer(customer)
        }}
        currentSalesPerson={currentSalesPerson}
        onSalesPersonChange={setCurrentSalesPerson}
      >
        <POSInterface user={user} searchTerm={searchTerm} quantity={quantity} selectedCustomer={selectedCustomer} />
      </DashboardLayout>

      {showOpenShift && (
        <OpenShiftModal
          onClose={() => setShowOpenShift(false)}
          onSuccess={() => {
            setShowOpenShift(false)
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

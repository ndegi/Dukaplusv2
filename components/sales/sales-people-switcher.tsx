"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faLock, faExclamationCircle } from "@fortawesome/free-solid-svg-icons"

interface SalesPerson {
  sales_person_id: string
  mobile_number?: string
}

interface SalesPeopleSwitcherProps {
  onSuccess: (salesPerson: string) => void
  onCancel: () => void
}

export function SalesPeopleSwitcher({ onSuccess, onCancel }: SalesPeopleSwitcherProps) {
  const [salesPeople, setSalesPeople] = useState<SalesPerson[]>([])
  const [selectedPerson, setSelectedPerson] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoadingPeople, setIsLoadingPeople] = useState(true)

  useEffect(() => {
    fetchSalesPeople()
  }, [])

  const fetchSalesPeople = async () => {
    try {
      const credentialsStr = sessionStorage.getItem("tenant_credentials")
      const credentials = credentialsStr ? JSON.parse(credentialsStr) : null

      const response = await fetch("/api/sales/people")
      const data = await response.json()

      if (response.ok && data.sales_people) {
        setSalesPeople(data.sales_people)
      } else {
        setError("Failed to fetch sales people")
      }
    } catch (err) {
      setError("Error loading sales people")
      console.error(err)
    } finally {
      setIsLoadingPeople(false)
    }
  }

  const handleValidatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedPerson || !password) {
      setError("Please select a sales person and enter password")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/sales/people/validate-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sales_person_id: selectedPerson,
          password: password,
        }),
      })

      const data = await response.json()

      if (response.ok && data.message?.status === 200) {
        onSuccess(selectedPerson)
      } else {
        setError(data.message?.message || "Invalid password")
      }
    } catch (err) {
      setError("Error validating password")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-[95%] md:max-w-2xl">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faLock} className="w-5 h-5" />
          Switch Sales Person
        </h2>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 flex items-start gap-2">
            <FontAwesomeIcon
              icon={faExclamationCircle}
              className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
            />
            <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleValidatePassword} className="space-y-3">
          {isLoadingPeople ? (
            <p className="text-gray-600 dark:text-gray-400 text-sm">Loading sales people...</p>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Sales Person
              </label>
              <Select value={selectedPerson} onValueChange={setSelectedPerson}>
                <SelectTrigger className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm">
                  <SelectValue placeholder="Choose sales person" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                  {salesPeople.map((person) => (
                    <SelectItem key={person.sales_person_id} value={person.sales_person_id}>
                      {person.sales_person_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Enter Password (Numerical)
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={password}
              onChange={(e) => {
                const numericValue = e.target.value.replace(/[^0-9]/g, "")
                setPassword(numericValue)
              }}
              placeholder="1-10 digits"
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-center text-xl font-bold tracking-widest bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-5 gap-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPassword((prev) => prev + num.toString())}
                className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-bold py-2 rounded-lg transition-colors text-sm"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPassword((prev) => prev + "0")}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-bold py-2 rounded-lg transition-colors text-sm col-span-2"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setPassword((prev) => prev.slice(0, -1))}
              className="bg-red-200 dark:bg-red-600 hover:bg-red-300 dark:hover:bg-red-700 text-gray-900 dark:text-white font-bold py-2 rounded-lg transition-colors text-sm col-span-2"
            >
              Clear
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading || !selectedPerson}
              className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white font-bold h-9 text-sm"
            >
              {isLoading ? "Validating..." : "Confirm"}
            </Button>
            <Button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-400 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-700 text-white font-bold h-9 text-sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

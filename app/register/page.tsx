"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Country {
  name: string
  iso2: string
  currency?: string
}

interface Currency {
  code: string
  name: string
}

const API_KEY = "R0hUcGNpejNLbVhnbDRiSkg2UVBhaUJIcjRoDukaPluslCa20ydlZnOTFpRw=="

const FALLBACK_COUNTRIES = [
  { name: "Kenya", iso2: "KE", currency: "KES" },
  { name: "Tanzania", iso2: "TZ", currency: "TZS" },
  { name: "Uganda", iso2: "UG", currency: "UGX" },
  { name: "Rwanda", iso2: "RW", currency: "RWF" },
  { name: "United States", iso2: "US", currency: "USD" },
  { name: "United Kingdom", iso2: "GB", currency: "GBP" },
]

const FALLBACK_CURRENCIES = [
  { code: "KES", name: "Kenyan Shilling" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "RWF", name: "Rwandan Franc" },
]

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobileNumber: "",
    businessName: "",
    referralCode: "",
    country: "",
    currency: "",
  })
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        console.log("[DukaPlus] Fetching countries...")
        const response = await fetch("https://api.countrystatecity.in/v1/countries", {
          headers: { "X-CSCAPI-KEY": API_KEY },
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const fetchedCountries = await response.json()

        if (Array.isArray(fetchedCountries)) {
          setCountries(fetchedCountries)
          const kenya = fetchedCountries.find((country: Country) => country.name === "Kenya")
          if (kenya) {
            setFormData((prev) => ({ ...prev, country: kenya.name }))
          }
        } else {
          throw new Error("Invalid response format")
        }
      } catch (error) {
        console.log("[DukaPlus] Failed to load countries, using fallback:", error)
        setCountries(FALLBACK_COUNTRIES)
        setFormData((prev) => ({ ...prev, country: "Kenya" }))
      }
    }

    const fetchCurrencies = async () => {
      try {
        console.log("[DukaPlus] Fetching currencies...")
        const response = await fetch("https://openexchangerates.org/api/currencies.json")

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()

        if (data && typeof data === "object") {
          const currencyList = Object.entries(data).map(([code, name]) => ({
            code,
            name: name as string,
          }))
          setCurrencies(currencyList)
          const defaultCurrency = currencyList.find((c) => c.code === "KES")
          if (defaultCurrency) {
            setFormData((prev) => ({ ...prev, currency: defaultCurrency.code }))
          }
        } else {
          throw new Error("Invalid response format")
        }
      } catch (error) {
        console.log("[DukaPlus] Failed to fetch currencies, using fallback:", error)
        setCurrencies(FALLBACK_CURRENCIES)
        setFormData((prev) => ({ ...prev, currency: "KES" }))
      }
    }

    const fetchData = async () => {
      setIsLoadingData(true)
      await Promise.all([fetchCountries(), fetchCurrencies()])
      setIsLoadingData(false)
    }

    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!agreed) {
      setError("Please agree to the terms and conditions")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_number: formData.mobileNumber,
          email_address: formData.email,
          full_name: formData.fullName,
          referral_code: formData.referralCode,
          business_name: formData.businessName,
          country: formData.country,
          preferred_currency: formData.currency,
        }),
      })

      const data = await response.json()

      if (response.ok && data.message?.status === 200) {
        alert("Registration successful! Please login to continue.")
        router.push("/login")
      } else {
        setError(data.message?.message || "Registration failed")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="card-base p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Image src="/images/icon.png" alt="DukaPlus" width={40} height={40} className="rounded-lg" />
              <h1 className="text-2xl font-bold text-foreground">DukaPlus</h1>
            </div>
            <h2 className="text-xl font-semibold mb-2">Create Account</h2>
            <p className="text-muted-foreground text-sm">Join thousands of businesses using DukaPlus</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="alert-error">
                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Full Name *</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={isLoading || isLoadingData}
                  className="input-base"
                  required
                />
              </div>

              <div>
                <label className="form-label">Email Address *</label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={isLoading || isLoadingData}
                  className="input-base"
                  required
                />
              </div>

              <div>
                <label className="form-label">Mobile Number *</label>
                <Input
                  type="tel"
                  placeholder="+254XXXXXXXXX"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  disabled={isLoading || isLoadingData}
                  className="input-base"
                  required
                />
              </div>

              <div>
                <label className="form-label">Business Name *</label>
                <Input
                  type="text"
                  placeholder="My Business"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  disabled={isLoading || isLoadingData}
                  className="input-base"
                  required
                />
              </div>

              <div>
                <label className="form-label">Country *</label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                  disabled={isLoading || isLoadingData}
                >
                  <SelectTrigger className="select-base">
                    <SelectValue placeholder={isLoadingData ? "Loading countries..." : "Select country"} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.iso2} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="form-label">Currency *</label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  disabled={isLoading || isLoadingData}
                >
                  <SelectTrigger className="select-base">
                    <SelectValue placeholder={isLoadingData ? "Loading currencies..." : "Select currency"} />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Referral Code (Optional)</label>
                <Input
                  type="text"
                  placeholder="Enter referral code"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                  disabled={isLoading || isLoadingData}
                  className="input-base"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={isLoading || isLoadingData}
                className="mt-1 w-4 h-4 rounded border-gray-300"
              />
              <p className="text-sm text-muted-foreground">
                By creating an account, you agree to our{" "}
                <a
                  href="https://www.duka.plus/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="https://www.duka.plus/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Privacy Policy
                </a>
              </p>
            </div>

            <Button
              type="submit"
              disabled={!agreed || isLoading || isLoadingData}
              className="btn-create w-full h-11 justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : isLoadingData ? (
                "Loading..."
              ) : (
                "Create Account"
              )}
            </Button>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-semibold">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

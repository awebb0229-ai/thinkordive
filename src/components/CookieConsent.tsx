import { toast } from "sonner"
import { useEffect } from "react"

export function CookieConsent() {
  useEffect(() => {
    if (typeof window === "undefined") return

    const accepted = localStorage.getItem("cookie-consent")

    if (!accepted) {
    toast("We use cookies to improve your experience.", {
      position: "bottom-center",
      duration: Infinity,
      action: {
        label: "Accept",
        onClick: () => localStorage.setItem("cookie-consent", "true"),
    },
    })
    }
  }, [])

  return null
}
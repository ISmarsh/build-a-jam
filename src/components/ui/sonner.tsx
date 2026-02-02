/**
 * Sonner Toaster wrapper — styled for our dark theme
 *
 * LEARNING NOTES - LIBRARY vs CUSTOM:
 *
 * 1. ANGULAR vs REACT:
 *    Angular: inject MatSnackBar service, call service.open() imperatively.
 *    React (custom): build a ToastContext with provider, useCallback, timeouts.
 *    React (library): just import toast() from sonner — no context needed.
 *
 * 2. WHY SONNER OVER CUSTOM?
 *    Our custom ToastContext was a great learning exercise for Context and
 *    useCallback, but Sonner gives us:
 *    - Swipe-to-dismiss
 *    - Pause on hover
 *    - Accessible announcements
 *    - Rich variants (success, warning, error)
 *    - Zero context/provider overhead (toast() is a plain function)
 *
 * 3. THE PATTERN:
 *    <Toaster /> renders once in App.tsx (not as a wrapper/provider).
 *    Anywhere in the app: import { toast } from 'sonner'; toast('Done!');
 *    No useContext, no hook — just a function call.
 */

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gray-800 group-[.toaster]:text-gray-100 group-[.toaster]:border-gray-700 group-[.toaster]:shadow-lg group-[.toaster]:!w-fit group-[.toaster]:inset-x-0 group-[.toaster]:mx-auto",
          description: "group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-gray-700 group-[.toast]:text-gray-300",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

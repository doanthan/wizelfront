import { cn } from "@/lib/utils"

export function Loading({ 
  className,
  size = "default",
  text = "Loading...",
  showText = true 
}) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    default: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4"
  }

  const textSizeClasses = {
    sm: "text-xs",
    default: "text-sm",
    lg: "text-base"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div 
        className={cn(
          "animate-spin rounded-full border-sky-blue border-t-transparent",
          sizeClasses[size]
        )}
        aria-label="Loading"
      />
      {showText && (
        <p className={cn("text-gray-600 dark:text-gray-400 font-medium", textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  )
}

export function LoadingSpinner({ className, size = "default" }) {
  const sizeClasses = {
    xs: "h-3 w-3 border-2",
    sm: "h-4 w-4 border-2",
    default: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
    xl: "h-12 w-12 border-4"
  }

  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-sky-blue border-t-transparent",
        sizeClasses[size],
        className
      )}
      aria-label="Loading"
    />
  )
}

export function LoadingOverlay({ 
  children, 
  isLoading, 
  text = "Loading...",
  blur = true 
}) {
  if (!isLoading) return children

  return (
    <div className="relative">
      <div className={cn(
        "transition-all duration-200",
        blur && "blur-sm opacity-50 pointer-events-none"
      )}>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50">
        <Loading text={text} />
      </div>
    </div>
  )
}

export function LoadingDots({ className, size = "default" }) {
  const sizeClasses = {
    sm: "space-x-1",
    default: "space-x-2",
    lg: "space-x-3"
  }

  const dotSizeClasses = {
    sm: "h-1.5 w-1.5",
    default: "h-2 w-2",
    lg: "h-3 w-3"
  }

  return (
    <div className={cn("flex items-center", sizeClasses[size], className)}>
      <div 
        className={cn(
          "bg-sky-blue rounded-full animate-pulse",
          dotSizeClasses[size]
        )} 
        style={{ animationDelay: "0ms" }}
      />
      <div 
        className={cn(
          "bg-sky-blue rounded-full animate-pulse",
          dotSizeClasses[size]
        )} 
        style={{ animationDelay: "150ms" }}
      />
      <div 
        className={cn(
          "bg-sky-blue rounded-full animate-pulse",
          dotSizeClasses[size]
        )} 
        style={{ animationDelay: "300ms" }}
      />
    </div>
  )
}

export function LoadingSkeleton({ 
  className,
  lines = 3,
  showAvatar = false,
  showImage = false 
}) {
  return (
    <div className={cn("animate-pulse", className)}>
      {showAvatar && (
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>
        </div>
      )}
      
      {showImage && (
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded" 
            style={{ width: `${Math.random() * 40 + 60}%` }}
          />
        ))}
      </div>
    </div>
  )
}
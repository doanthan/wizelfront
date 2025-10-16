import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, onChange, value, onFocus, onBlur, autoFocus, ...restProps }, ref) => {
  const internalRef = React.useRef(null);
  const textareaRef = ref || internalRef;
  const hasAutoFocused = React.useRef(false);

  // Capture initial value once, then ignore value prop changes
  const [initialValue] = React.useState(value || '');

  // Handle autoFocus manually on mount only to prevent cursor jumping on re-renders
  React.useEffect(() => {
    if (autoFocus && !hasAutoFocused.current) {
      hasAutoFocused.current = true;
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.focus();
        // Move cursor to end
        const len = textarea.value.length;
        textarea.setSelectionRange(len, len);
      }
    }
  }, [autoFocus]);

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  // Use defaultValue with initial value - makes it truly uncontrolled
  // The 'value' and 'autoFocus' props are extracted above so they won't be in restProps
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white ring-offset-white dark:ring-offset-gray-950 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={textareaRef}
      defaultValue={initialValue}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      {...restProps}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
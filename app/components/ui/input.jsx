import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, onChange, value, onFocus, onBlur, autoFocus, ...restProps }, ref) => {
  const internalRef = React.useRef(null);
  const inputRef = ref || internalRef;
  const hasAutoFocused = React.useRef(false);

  // Capture initial value once, then ignore value prop changes
  const [initialValue] = React.useState(value || '');

  // Handle autoFocus manually on mount only to prevent cursor jumping on re-renders
  React.useEffect(() => {
    if (autoFocus && !hasAutoFocused.current) {
      hasAutoFocused.current = true;
      const input = inputRef.current;
      if (input) {
        input.focus();
        // Move cursor to end
        const len = input.value.length;
        input.setSelectionRange(len, len);
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
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:ring-offset-gray-950 dark:placeholder:text-gray-400 dark:focus-visible:ring-sky-blue",
        className
      )}
      ref={inputRef}
      defaultValue={initialValue}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      {...restProps}
    />
  );
});

Input.displayName = "Input";

export { Input };
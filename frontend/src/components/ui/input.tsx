import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-[var(--color-text-primary)] mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={errorId}
          className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors
            bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]
            placeholder:text-[var(--color-text-muted)]
            focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-border-focus)] focus-visible:border-[var(--color-border-focus)]
            ${error
              ? "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]"
              : "border-[var(--color-border-primary)]"
            }
            ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1 text-sm text-[var(--color-danger-text)]" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };

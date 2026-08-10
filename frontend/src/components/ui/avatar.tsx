interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={`rounded-full object-cover ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-[var(--color-brand-light)] text-[var(--color-brand-text)] font-medium flex items-center justify-center ${sizes[size]} ${className}`}
      role="img"
      aria-label={name || "User avatar"}
    >
      {initials}
    </div>
  );
}

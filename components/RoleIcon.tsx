import type { RoleId } from "@/lib/roles";

export default function RoleIcon({
  role,
  className = "",
}: {
  role: RoleId;
  className?: string;
}) {
  const common = {
    className: `role-icon ${className}`,
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true as const,
  };

  switch (role) {
    case "owner":
      // Crown
      return (
        <svg {...common}>
          <path
            d="M3.5 17.5h17l-1.2-9.2-4.3 3.6L12 5.5 8.999 11.9 4.7 8.3 3.5 17.5Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path d="M5 19.2h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="5.2" r="1.3" fill="currentColor" />
          <circle cx="4.5" cy="8" r="1.1" fill="currentColor" />
          <circle cx="19.5" cy="8" r="1.1" fill="currentColor" />
        </svg>
      );

    case "admin":
      // Red shield
      return (
        <svg {...common}>
          <path
            d="M12 2.5 19.5 5.5v5.6c0 4.8-3.2 8.8-7.5 10.3C7.7 19.9 4.5 15.9 4.5 11.1V5.5L12 2.5Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M12 7.2v8.2M9.2 10.8h5.6"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case "moderator":
      // Blue shield
      return (
        <svg {...common}>
          <path
            d="M12 2.5 19.5 5.5v5.6c0 4.8-3.2 8.8-7.5 10.3C7.7 19.9 4.5 15.9 4.5 11.1V5.5L12 2.5Z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M9.2 12.2 11.2 14.2 15.2 9.8"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "content_creator":
      // White YouTube logo on red circle background
      return (
        <svg {...common}>
          <path
            d="M21.2 8.1c-.2-.8-.8-1.4-1.6-1.5C18 6.3 12 6.3 12 6.3s-6 0-7.6.3c-.8.1-1.4.7-1.6 1.5C2.5 9.6 2.5 12 2.5 12s0 2.4.3 3.9c.2.8.8 1.4 1.6 1.5 1.6.3 7.6.3 7.6.3s6 0 7.6-.3c.8-.1 1.4-.7 1.6-1.5.3-1.5.3-3.9.3-3.9s0-2.4-.3-3.9Z"
            fill="currentColor"
          />
          <path d="M10.2 9.3v5.4L14.9 12l-4.7-2.7Z" fill="#ff0033" />
        </svg>
      );

    case "verified":
      // Check mark (seal shape is CSS)
      return (
        <svg {...common}>
          <path
            d="M7.2 12.2 10.3 15.3 16.8 8.6"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    default:
      return null;
  }
}

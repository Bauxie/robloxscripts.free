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
      // Shield with star
      return (
        <svg {...common}>
          <path
            d="M12 2.8 19.2 5.6v5.3c0 4.5-3 8.3-7.2 9.7C7.8 19.2 4.8 15.4 4.8 10.9V5.6L12 2.8Z"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="m12 8.2 1.05 2.2 2.4.28-1.8 1.6.52 2.35L12 13.5l-2.17 1.13.52-2.35-1.8-1.6 2.4-.28L12 8.2Z"
            fill="currentColor"
          />
        </svg>
      );

    case "moderator":
      // Gavel / moderation hammer
      return (
        <svg {...common}>
          <path
            d="M14.2 4.2 19.8 9.8l-2.1 2.1-5.6-5.6 2.1-2.1Z"
            fill="currentColor"
          />
          <path
            d="m8.6 9.8 5.6 5.6-2.1 2.1-5.6-5.6 2.1-2.1Z"
            fill="currentColor"
            fillOpacity="0.85"
          />
          <path
            d="M6.2 16.8 4.4 18.6c-.7.7-.7 1.8 0 2.5.7.7 1.8.7 2.5 0l1.8-1.8-2.5-2.5Z"
            fill="currentColor"
          />
          <path
            d="M10.4 7.8c1.2-1.2 3.1-1.2 4.3 0l1.5 1.5c1.2 1.2 1.2 3.1 0 4.3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );

    case "content_creator":
      // YouTube-style play badge
      return (
        <svg {...common}>
          <path
            d="M21.6 7.4c-.2-1-1-1.8-2-2C17.8 5 12 5 12 5s-5.8 0-7.6.4c-1 .2-1.8 1-2 2C2 9.2 2 12 2 12s0 2.8.4 4.6c.2 1 1 1.8 2 2C6.2 19 12 19 12 19s5.8 0 7.6-.4c1-.2 1.8-1 2-2 .4-1.8.4-4.6.4-4.6s0-2.8-.4-4.6Z"
            fill="currentColor"
          />
          <path d="M10 8.8v6.4L15.6 12 10 8.8Z" fill="#fff" />
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

import { ICON_PATHS } from "./iconPaths";

export default function Icon({ name, size = 22, strokeWidth = 2 }) {
  const content = ICON_PATHS[name];

  if (!content) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={true}
      className="flIcon"
    >
      {content}
    </svg>
  );
}

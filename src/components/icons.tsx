import type { SVGProps } from "react";

export function GitLogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 18h-6" />
      <path d="M18 6h-6" />
      <path d="M6 18V6" />
      <path d="M6 12h6" />
      <circle cx="18" cy="18" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="12" r="3" />
    </svg>
  );
}

import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 22, p: SVGProps<SVGSVGElement>) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p,
});

export const SearchIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);
export const UserIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>);
export const BagIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>);
export const LeafIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15Z" /><path d="M5 19c3-4 6-7 10-10" /></svg>);
export const HeartIcon = ({ size, filled, ...p }: P & { filled?: boolean }) => (<svg {...base(size, p)} fill={filled ? "currentColor" : "none"}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" /></svg>);
export const CloseIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const MenuIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M4 7h16M4 12h16M4 17h10" /></svg>);
export const ChevronIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="m9 6 6 6-6 6" /></svg>);
export const ArrowIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const PlusIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M12 5v14M5 12h14" /></svg>);
export const MinusIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M5 12h14" /></svg>);
export const CheckIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="m5 12 5 5L20 7" /></svg>);
export const PlayIcon = ({ size, ...p }: P) => (<svg {...base(size, p)} fill="currentColor" stroke="none"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" /></svg>);
export const PauseIcon = ({ size, ...p }: P) => (<svg {...base(size, p)} fill="currentColor" stroke="none"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>);
export const StarIcon = ({ size, ...p }: P) => (<svg {...base(size, p)} fill="currentColor" stroke="none"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" /></svg>);
export const SparkleIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></svg>);
export const DropIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></svg>);
export const RabbitIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M9 10C8 6 8 3 9.5 3S12 6 12 9M15 10c1-4 1-7-.5-7S12 6 12 9" /><ellipse cx="12" cy="15" rx="5.5" ry="5" /><circle cx="10" cy="14" r=".6" fill="currentColor" /><circle cx="14" cy="14" r=".6" fill="currentColor" /></svg>);
export const EyeIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>);
export const HandIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v7c0 4-2.5 8-7 8-3 0-4.5-1.5-6-4l-2-3.5a1.5 1.5 0 0 1 2.6-1.5L8 14" /></svg>);
export const SunIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
export const MoonIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" /></svg>);
export const ChatIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M4 5h16v11H9l-5 4V5Z" /></svg>);
export const GiftIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><rect x="3" y="9" width="18" height="12" rx="2" /><path d="M3 13h18M12 9v12M12 9S10 4 7.5 5 9 9 12 9Zm0 0s2-5 4.5-4S15 9 12 9Z" /></svg>);
export const TruckIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>);
export const CameraIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>);
export const TrashIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>);
export const LockIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>);
export const InstagramIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></svg>);
export const TiktokIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.5 2.5 4.5 5 4.5" /></svg>);
export const PinterestIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><circle cx="12" cy="12" r="9" /><path d="M11 8.5c3-1 5 .5 5 3 0 2.5-1.8 4-3.5 3.5-1-.3-1.5-1-1.5-1L10 20" /></svg>);
export const YoutubeIcon = ({ size, ...p }: P) => (<svg {...base(size, p)}><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="m10 9 5 3-5 3V9Z" fill="currentColor" /></svg>);

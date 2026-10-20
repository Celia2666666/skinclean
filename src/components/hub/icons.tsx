import type { SVGProps } from "react";

/** Icônes du Marketing Hub (trait 1.6, style cohérent avec les icônes du site). */
type P = SVGProps<SVGSVGElement> & { size?: number };
const I = (d: React.ReactNode) => function Icon({ size = 18, ...p }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>
      {d}
    </svg>
  );
};

export const HomeI = I(<><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /></>);
export const TargetI = I(<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></>);
export const CalendarI = I(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>);
export const ShareI = I(<><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" /></>);
export const PaletteI = I(<><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.2-1.6-.4-1 .2-2.4 1.6-2.4H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10Z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></>);
export const MegaphoneI = I(<><path d="M4 10v4h3l7 4V6L7 10H4Z" /><path d="M17 9a4 4 0 0 1 0 6" /></>);
export const SearchI = I(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const AdsI = I(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 15l2.5-6 2.5 6M7.8 13h3.4M15 9v6h1.5a2 2 0 0 0 0-6H15Z" /></>);
export const MailI = I(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6 8.5 7 8.5-7" /></>);
export const StoreI = I(<><path d="M4 9h16l-1-4H5L4 9Z" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>);
export const RoadmapI = I(<><path d="M4 6h10M4 12h16M4 18h7" /><circle cx="17" cy="6" r="2" /><circle cx="14" cy="18" r="2" /></>);
export const ChartI = I(<><path d="M4 20V4M4 20h16" /><path d="m7 15 4-4 3 3 5-6" /></>);
export const ChatI = I(<><path d="M4 5h16v11H9l-5 4V5Z" /></>);
export const SparkI = I(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></>);
export const UserI = I(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>);
export const BellI = I(<><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>);
export const LogoutI = I(<><path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" /></>);
export const PlusI = I(<path d="M12 5v14M5 12h14" />);
export const CheckI = I(<path d="m5 12 5 5L20 7" />);
export const XI = I(<path d="M6 6l12 12M18 6 6 18" />);
export const EditI = I(<><path d="M4 20h4L19 9l-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>);
export const EyeI = I(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>);
export const SendI = I(<path d="M4 12 20 4l-6 16-3-7-7-1Z" />);
export const ClockI = I(<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>);
export const CopyI = I(<><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>);
export const DownloadI = I(<><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></>);
export const UploadI = I(<><path d="M12 20V9M7 14l5-5 5 5M5 4h14" /></>);
export const TrashI = I(<><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></>);
export const ArrowRightI = I(<path d="M5 12h14M13 6l6 6-6 6" />);
export const ChevronLeftI = I(<path d="m15 6-6 6 6 6" />);
export const ChevronRightI = I(<path d="m9 6 6 6-6 6" />);
export const ChevronDownI = I(<path d="m6 9 6 6 6-6" />);
export const DotsI = I(<><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>);
export const FilterI = I(<path d="M4 5h16l-6 8v6l-4-2v-4L4 5Z" />);
export const LinkI = I(<><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></>);
export const ImageI = I(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></>);
export const VideoI = I(<><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></>);
export const TextI = I(<path d="M5 6V4h14v2M12 4v16M9 20h6" />);
export const SquareI = I(<rect x="4" y="4" width="16" height="16" rx="3" />);
export const LayersI = I(<><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>);
export const PauseI = I(<><path d="M9 6v12M15 6v12" /></>);
export const PlayI = I(<path d="M8 5v14l11-7L8 5Z" />);
export const RefreshI = I(<><path d="M20 11a8 8 0 0 0-14-5l-2 2M4 13a8 8 0 0 0 14 5l2-2" /><path d="M4 4v4h4M20 20v-4h-4" /></>);
export const LockI = I(<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>);
export const FolderI = I(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />);
export const GridI = I(<><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>);
export const ListI = I(<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />);
export const AlertI = I(<><path d="M12 4 2.5 20h19L12 4Z" /><path d="M12 10v4M12 17h.01" /></>);
export const InfoI = I(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>);
export const PaperclipI = I(<path d="m20 12-8 8a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7-7" />);
export const MenuI = I(<path d="M4 7h16M4 12h16M4 17h16" />);
export const UndoI = I(<><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></>);
export const MoveI = I(<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3" />);
export const HeartI = I(<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />);
export const CommentI = I(<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12Z" />);
export const BookmarkI = I(<path d="M6 4h12v17l-6-4-6 4V4Z" />);
export const InstagramI = I(<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></>);
export const TiktokI = I(<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.5 2.5 4.5 5 4.5" />);
export const FacebookI = I(<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z" />);
export const PinterestI = I(<><circle cx="12" cy="12" r="9" /><path d="M11 8.5c3-1 5 .5 5 3 0 2.5-1.8 4-3.5 3.5-1-.3-1.5-1-1.5-1L10 20" /></>);
export const StoryI = I(<><circle cx="12" cy="12" r="9" strokeDasharray="3 2.2" /><circle cx="12" cy="12" r="5" /></>);
export const BlogI = I(<><path d="M5 4h10l4 4v12H5V4Z" /><path d="M9 12h6M9 16h6M9 8h3" /></>);

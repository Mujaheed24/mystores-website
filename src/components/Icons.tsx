type P = { size?: number; fill?: boolean };
const I = (d: string, extra?: string) =>
  function Icon({ size = 24, fill }: P) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={d} />{extra && <path d={extra} />}
      </svg>
    );
  };
export const IconChat = I("M4 4h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9.5L5 20.5V17H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z", "M8 9h8M8 12.5h5");
export const IconPlus = I("M12 5v14M5 12h14");
export const IconHome = I("M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z");
export const IconBox = I("M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5", "M12 13v8");
export const IconShop = I("M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0", "M10 20v-6h4v6");
export const IconCheck = I("M5 12.5l4.5 4.5L19 7");
export const IconShare = I("M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13");
export const IconStar = I("M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z");
export const IconSearch = I("M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4.3-4.3");
export const IconCopy = I("M9 9h11v11H9zM5 15V5h10");
export const IconTrash = I("M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3");
export const IconEdit = I("M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4");
export const IconArrow = I("M5 12h14M13 5l7 7-7 7");
export const IconTag = I("M3 12V4h8l10 10-8 8z", "M7.5 8.5h.01");
export const IconLink = I("M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1");
export const IconSun = I("M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4");
export const IconMoon = I("M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z");
export const IconExpand = I("M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7");
export const IconClose = I("M6 6l12 12M18 6L6 18");

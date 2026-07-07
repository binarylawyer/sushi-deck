import type { SVGProps } from "react";

/**
 * Minimal inline icon set so the kit carries no icon-library dependency.
 * Stroke icons at a 24-box, sized via the `size` prop.
 */
function Svg({ size = 18, children, ...rest }: SVGProps<SVGSVGElement> & { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...rest}
        >
            {children}
        </svg>
    );
}

export const ChevronLeft = (p: { size?: number }) => (
    <Svg {...p}><path d="m15 18-6-6 6-6" /></Svg>
);
export const ChevronRight = (p: { size?: number }) => (
    <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>
);
export const Grid = (p: { size?: number }) => (
    <Svg {...p}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Svg>
);
export const Presentation = (p: { size?: number }) => (
    <Svg {...p}><path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="m7 21 5-5 5 5" /></Svg>
);
export const Scroll = (p: { size?: number }) => (
    <Svg {...p}><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1" /><path d="M8 3v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" /><path d="M12 8h5M12 12h5" /></Svg>
);
export const Maximize = (p: { size?: number }) => (
    <Svg {...p}><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" /></Svg>
);
export const Play = (p: { size?: number }) => (
    <Svg {...p}><polygon points="6 3 20 12 6 21 6 3" /></Svg>
);

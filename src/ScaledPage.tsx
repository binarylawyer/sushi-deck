import type { CSSProperties, ReactNode } from "react";
import { DEFAULT_PAGE_H, DEFAULT_PAGE_W } from "./types";

/**
 * Wraps a fixed-canvas `.dk-page` artboard and scales it by `scale`, producing
 * a holder of the correct post-scale footprint so it lays out normally in
 * flow (used by both present and scroll views).
 */
export function ScaledPage({
    children,
    scale,
    width = DEFAULT_PAGE_W,
    height = DEFAULT_PAGE_H,
    style,
}: {
    children: ReactNode;
    scale: number;
    width?: number;
    height?: number;
    style?: CSSProperties;
}) {
    return (
        <div
            style={{
                position: "relative",
                width: width * scale,
                height: height * scale,
                flex: "0 0 auto",
                ...style,
            }}
        >
            <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
                {children}
            </div>
        </div>
    );
}

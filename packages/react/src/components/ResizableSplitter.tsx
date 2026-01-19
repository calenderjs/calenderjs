"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface ResizableSplitterProps {
    /** 左侧面板内容 */
    left: React.ReactNode;
    /** 右侧面板内容 */
    right: React.ReactNode;
    /** 初始左侧面板宽度（百分比，0-100） */
    initialLeftWidth?: number;
    /** 左侧面板最小宽度（百分比） */
    minLeftWidth?: number;
    /** 左侧面板最大宽度（百分比） */
    maxLeftWidth?: number;
    /** 自定义 CSS 类名 */
    className?: string;
}

/**
 * ResizableSplitter - 可调整大小的分割面板组件
 *
 * 提供一个可拖拽的分割器，允许用户调整左右两个面板的宽度。
 *
 * @example
 * ```tsx
 * import { ResizableSplitter } from '@calenderjs/react';
 *
 * function App() {
 *   return (
 *     <ResizableSplitter
 *       left={<div>左侧内容</div>}
 *       right={<div>右侧内容</div>}
 *       initialLeftWidth={40}
 *       minLeftWidth={20}
 *       maxLeftWidth={80}
 *     />
 *   );
 * }
 * ```
 */
export default function ResizableSplitter({
    left,
    right,
    initialLeftWidth = 40,
    minLeftWidth = 20,
    maxLeftWidth = 80,
    className = "",
}: ResizableSplitterProps) {
    const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const splitterRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const newLeftWidth =
                ((e.clientX - containerRect.left) / containerRect.width) * 100;

            // 限制在最小和最大宽度之间
            const clampedWidth = Math.max(
                minLeftWidth,
                Math.min(maxLeftWidth, newLeftWidth)
            );

            setLeftWidth(clampedWidth);
        },
        [isDragging, minLeftWidth, maxLeftWidth]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";

            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div
            ref={containerRef}
            className={`resizable-splitter ${className}`}
            style={{
                display: "flex",
                width: "100%",
                height: "100%",
                position: "relative",
            }}
        >
            {/* Left Panel */}
            <div
                style={{
                    width: `${leftWidth}%`,
                    height: "100%",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {left}
            </div>

            {/* Splitter */}
            <div
                ref={splitterRef}
                onMouseDown={handleMouseDown}
                style={{
                    width: "var(--resizable-splitter-width, 4px)",
                    height: "100%",
                    cursor: "col-resize",
                    backgroundColor: "var(--resizable-splitter-bg-color, #ddd)",
                    position: "relative",
                    flexShrink: 0,
                    transition: isDragging
                        ? "none"
                        : "var(--resizable-splitter-transition, background-color 0.2s)",
                }}
                onMouseEnter={(e) => {
                    if (!isDragging) {
                        e.currentTarget.style.backgroundColor =
                            "var(--resizable-splitter-hover-bg-color, #bbb)";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isDragging) {
                        e.currentTarget.style.backgroundColor =
                            "var(--resizable-splitter-bg-color, #ddd)";
                    }
                }}
            >
                {/* Splitter Handle */}
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "var(--resizable-splitter-handle-width, 20px)",
                        height: "var(--resizable-splitter-handle-height, 40px)",
                        borderRadius:
                            "var(--resizable-splitter-handle-border-radius, 4px)",
                        backgroundColor:
                            "var(--resizable-splitter-handle-bg-color, rgba(0,0,0,0.1))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "var(--resizable-splitter-dot-gap, 2px)",
                        }}
                    >
                        <div
                            style={{
                                width: "var(--resizable-splitter-dot-size, 3px)",
                                height: "var(--resizable-splitter-dot-size, 3px)",
                                borderRadius: "50%",
                                backgroundColor:
                                    "var(--resizable-splitter-dot-color, #999)",
                            }}
                        />
                        <div
                            style={{
                                width: "var(--resizable-splitter-dot-size, 3px)",
                                height: "var(--resizable-splitter-dot-size, 3px)",
                                borderRadius: "50%",
                                backgroundColor:
                                    "var(--resizable-splitter-dot-color, #999)",
                            }}
                        />
                        <div
                            style={{
                                width: "var(--resizable-splitter-dot-size, 3px)",
                                height: "var(--resizable-splitter-dot-size, 3px)",
                                borderRadius: "50%",
                                backgroundColor:
                                    "var(--resizable-splitter-dot-color, #999)",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Right Panel */}
            <div
                style={{
                    flex: 1,
                    height: "100%",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {right}
            </div>
        </div>
    );
}

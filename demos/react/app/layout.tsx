import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "CalenderJS Demo - DSL → Calendar",
    description: "CalenderJS 演示网站：展示 DSL → Data Model → Event 验证 → Calendar 显示的完整流程",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="zh-CN">
            <body style={{ margin: 0, padding: 0, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
                {children}
            </body>
        </html>
    );
}

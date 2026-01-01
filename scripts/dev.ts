#!/usr/bin/env node

/**
 * 交互式开发服务器启动脚本
 * 使用 ora 显示加载动画，inquirer 提供选择菜单
 */

import { spawn } from "child_process";
import inquirer from "inquirer";
import ora from "ora";

// 命令行参数常量
const HELP_FLAGS = ["--help", "-h"] as const;

// Demo 选项配置
const DEMO_OPTIONS = [
    {
        name: "CalendarJS React Demo",
        value: "react",
        description: "CalendarJS React 组件演示",
        package: "demos-react",
        command: ["pnpm", "--filter", "demos-react", "dev"],
    },
] as const;

// 类型定义
type DemoOption = (typeof DEMO_OPTIONS)[number];

/**
 * 获取命令行参数
 */
function getCommandLineArgs(): string[] {
    return process.argv.slice(2);
}

/**
 * 验证 demo 名称是否有效
 */
function isValidDemo(demo: string): boolean {
    return DEMO_OPTIONS.some((opt) => opt.value === demo.toLowerCase());
}

/**
 * 查找 demo 选项
 */
function findDemoOption(demo: string): DemoOption | undefined {
    return DEMO_OPTIONS.find((opt) => opt.value === demo.toLowerCase());
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
    console.log("\n📖 使用方法:");
    console.log("  pnpm dev              # 显示交互式菜单");
    console.log("  pnpm dev <demo>        # 直接启动指定的 demo\n");
    console.log("可用的 demo:");
    DEMO_OPTIONS.forEach((option) => {
        console.log(`  ${option.value.padEnd(10)} - ${option.description}`);
    });
    console.log("\n示例:");
    DEMO_OPTIONS.forEach((option) => {
        console.log(`  pnpm dev ${option.value}`);
    });
    console.log();
}

/**
 * 显示选择菜单并获取用户选择
 */
async function selectDemo(): Promise<string> {
    const spinner = ora("加载演示项目列表").start();

    // 模拟加载过程，提供更好的用户体验
    await new Promise((resolve) => setTimeout(resolve, 300));
    spinner.stop();

    const { demo } = await inquirer.prompt([
        {
            type: "list",
            name: "demo",
            message: "请选择要启动的演示项目：",
            choices: DEMO_OPTIONS.map((option) => ({
                name: `${option.name.padEnd(15)} - ${option.description}`,
                value: option.value,
            })),
        },
    ]);

    return demo;
}

/**
 * 启动开发服务器
 */
function startDevServer(demo: string): void {
    const option = findDemoOption(demo);
    if (!option) {
        const errorSpinner = ora();
        errorSpinner.fail(`未找到演示项目: ${demo}`);
        console.error("\n请使用 --help 查看可用的演示项目。\n");
        process.exit(1);
    }

    const spinner = ora({
        text: `正在启动 ${option.name} 开发服务器...`,
        color: "cyan",
    }).start();
    // 确定启动命令
    const command = option.command || [
        "pnpm",
        "--filter",
        option.package,
        "dev",
    ];
    const [cmd, ...args] = command;

    // 使用 spawn 启动开发服务器（非阻塞，支持长时间运行）
    const childProcess = spawn(cmd, args, {
        stdio: "inherit",
        cwd: process.cwd(),
        shell: process.platform === "win32",
    });

    // 监听进程启动
    let serverStarted = false;
    const startTimeout = setTimeout(() => {
        if (!serverStarted) {
            spinner.succeed(`${option.name} 开发服务器正在启动`);
            console.log(`📦 包名: ${option.package}`);
            console.log("💡 提示: 开发服务器输出将显示在下方\n");
            serverStarted = true;
        }
    }, 1500);

    // 处理进程退出
    childProcess.on("exit", (code) => {
        clearTimeout(startTimeout);
        spinner.stop();
        if (code !== 0 && code !== null) {
            const exitSpinner = ora();
            exitSpinner.fail(`开发服务器退出，代码: ${code}`);
            process.exit(code);
        }
    });

    // 处理错误
    childProcess.on("error", (error) => {
        clearTimeout(startTimeout);
        spinner.fail(`启动 ${option.name} 开发服务器失败`);
        const errorSpinner = ora();
        errorSpinner.fail(`错误详情: ${error.message}`);
        process.exit(1);
    });

    // 处理 Ctrl+C
    process.on("SIGINT", () => {
        clearTimeout(startTimeout);
        spinner.stop();
        const stopSpinner = ora("正在关闭开发服务器...");
        stopSpinner.start();
        childProcess.kill("SIGINT");
        setTimeout(() => {
            stopSpinner.succeed("开发服务器已关闭");
            process.exit(0);
        }, 500);
    });
}

/**
 * 主函数
 */
async function main(): Promise<void> {
    try {
        const args = getCommandLineArgs();

        // 检查是否需要显示帮助
        if (
            args.some((arg) =>
                HELP_FLAGS.includes(arg as (typeof HELP_FLAGS)[number])
            )
        ) {
            showHelp();
            process.exit(0);
        }

        // 如果提供了参数，直接使用
        if (args.length > 0) {
            const demoArg = args[0].toLowerCase();
            if (isValidDemo(demoArg)) {
                const option = findDemoOption(demoArg);
                const welcomeSpinner = ora(
                    `准备启动 ${option?.name || demoArg}`
                ).start();
                await new Promise((resolve) => setTimeout(resolve, 500));
                welcomeSpinner.stop();
                startDevServer(demoArg);
                return;
            }
            // 参数无效，显示错误和帮助
            const errorSpinner = ora();
            errorSpinner.fail(`无效的 demo 名称: ${args[0]}`);
            console.log();
            showHelp();
            process.exit(1);
        }

        // 没有提供参数，显示交互式菜单
        const welcomeSpinner = ora("欢迎使用 CalenderJS 开发服务器").start();
        await new Promise((resolve) => setTimeout(resolve, 500));
        welcomeSpinner.stop();
        console.log("\n🚀 CalenderJS 开发服务器\n");

        const selectedDemo = await selectDemo();
        startDevServer(selectedDemo);
    } catch (error) {
        if (
            error instanceof Error &&
            error.message.includes("User force closed")
        ) {
            const cancelSpinner = ora();
            cancelSpinner.info("已取消");
            process.exit(0);
        }
        const errorSpinner = ora();
        errorSpinner.fail(
            `发生错误: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
        process.exit(1);
    }
}

// 运行主函数
main().catch((error) => {
    const errorSpinner = ora();
    errorSpinner.fail(
        `未处理的错误: ${
            error instanceof Error ? error.message : String(error)
        }`
    );
    process.exit(1);
});

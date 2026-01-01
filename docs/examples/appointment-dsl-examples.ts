/**
 * Appointment DSL 示例
 *
 * 这些示例展示了如何使用 Appointment DSL 定义不同类型的预约
 */

import { AppointmentType, AppointmentDSL } from "@calenderjs/event-dsl";

// ============================================
// 示例 1: 标准会议预约
// ============================================
export const meetingAppointmentType: AppointmentType = {
    id: "meeting",
    name: "会议",
    description: "标准会议预约，支持参会人员、地点等",
    fields: [
        {
            name: "title",
            type: "string",
            required: true,
            description: "会议标题",
            validation: [
                { type: "minLength", value: 1, errorMessage: "标题不能为空" },
                {
                    type: "maxLength",
                    value: 100,
                    errorMessage: "标题不能超过100个字符",
                },
            ],
        },
        {
            name: "description",
            type: "string",
            required: false,
            description: "会议描述",
        },
        {
            name: "attendees",
            type: "array",
            required: false,
            description: "参会人员邮箱列表",
            items: {
                type: "string",
                validation: [
                    {
                        type: "pattern",
                        value: "^[^@]+@[^@]+\\.[^@]+$",
                        errorMessage: "请输入有效的邮箱地址",
                    },
                ],
            },
        },
        {
            name: "location",
            type: "string",
            required: false,
            description: "会议地点",
        },
        {
            name: "priority",
            type: "enum",
            required: false,
            default: "normal",
            enum: ["low", "normal", "high", "urgent"],
            description: "优先级",
        },
        {
            name: "meetingLink",
            type: "string",
            required: false,
            description: "会议链接（如 Zoom、Teams 等）",
        },
    ],
    display: {
        color: "#4285f4",
        icon: "meeting",
        titleTemplate: "${title}",
        descriptionTemplate:
            '${location ? location + " • " : ""}${attendees ? attendees.length + " 人" : ""}',
    },
    behavior: {
        draggable: true,
        resizable: true,
        editable: true,
        deletable: true,
        copyable: true,
        allowOverlap: false,
        minDuration: 15,
        maxDuration: 480,
        defaultDuration: 60,
        timeConstraints: [
            {
                type: "workingHours",
                value: { start: "09:00", end: "18:00" },
                errorMessage: "会议只能在工作时间内安排（09:00-18:00）",
            },
            {
                type: "dayOfWeek",
                value: [1, 2, 3, 4, 5], // 周一到周五
                errorMessage: "会议只能在工作日安排",
            },
        ],
    },
    validation: [
        {
            type: "crossField",
            expression: (appointment: any) => {
                return appointment.endTime > appointment.startTime;
            },
            errorMessage: "结束时间必须晚于开始时间",
        },
        {
            type: "custom",
            expression: (appointment: any) => {
                const duration =
                    (appointment.endTime - appointment.startTime) / (1000 * 60);
                return duration >= 15 && duration <= 480;
            },
            errorMessage: "会议时长必须在15分钟到8小时之间",
        },
    ],
};

// ============================================
// 示例 2: 假期预约
// ============================================
export const vacationAppointmentType: AppointmentType = {
    id: "vacation",
    name: "假期",
    description: "员工假期预约，需要审批",
    fields: [
        {
            name: "title",
            type: "string",
            required: true,
            default: "假期",
        },
        {
            name: "vacationType",
            type: "enum",
            required: true,
            enum: ["annual", "sick", "personal", "maternity", "other"],
            description: "假期类型",
            default: "annual",
        },
        {
            name: "approvalStatus",
            type: "enum",
            required: true,
            default: "pending",
            enum: ["pending", "approved", "rejected"],
            description: "审批状态",
        },
        {
            name: "approver",
            type: "string",
            required: false,
            description: "审批人邮箱",
        },
        {
            name: "reason",
            type: "string",
            required: false,
            description: "请假原因",
        },
    ],
    display: {
        color: "#ff9800",
        icon: "vacation",
        titleTemplate:
            '${vacationType === "annual" ? "年假" : vacationType === "sick" ? "病假" : vacationType === "personal" ? "事假" : vacationType === "maternity" ? "产假" : "其他"} - ${title}',
        descriptionTemplate:
            '${approvalStatus === "approved" ? "✓ 已批准" : approvalStatus === "pending" ? "⏳ 待审批" : "✗ 已拒绝"}${approver ? " by " + approver : ""}',
    },
    behavior: {
        draggable: false, // 假期不可拖拽（需要重新审批）
        resizable: true,
        editable: true,
        deletable: true,
        allowOverlap: false,
        minDuration: 60, // 至少1小时
        timeConstraints: [
            {
                type: "dayOfWeek",
                value: [1, 2, 3, 4, 5], // 周一到周五
                errorMessage: "假期只能在工作日申请",
            },
        ],
    },
    validation: [
        {
            type: "custom",
            expression: (appointment: any) => {
                // 假期必须是全天事件
                const start = new Date(appointment.startTime);
                const end = new Date(appointment.endTime);
                return (
                    start.getHours() === 0 &&
                    start.getMinutes() === 0 &&
                    end.getHours() === 23 &&
                    end.getMinutes() === 59
                );
            },
            errorMessage: "假期必须是全天事件",
        },
    ],
};

// ============================================
// 示例 3: 重复预约
// ============================================
export const recurringAppointmentType: AppointmentType = {
    id: "recurring",
    name: "重复预约",
    description: "支持重复规则的预约（如每周例会）",
    fields: [
        {
            name: "title",
            type: "string",
            required: true,
        },
        {
            name: "description",
            type: "string",
            required: false,
        },
        {
            name: "recurrence",
            type: "object",
            required: true,
            properties: {
                frequency: {
                    type: "enum",
                    required: true,
                    enum: ["daily", "weekly", "monthly", "yearly"],
                    description: "重复频率",
                },
                interval: {
                    type: "number",
                    required: true,
                    default: 1,
                    description: "间隔（如每2周）",
                    validation: [
                        {
                            type: "min",
                            value: 1,
                            errorMessage: "间隔必须大于0",
                        },
                        {
                            type: "max",
                            value: 100,
                            errorMessage: "间隔不能超过100",
                        },
                    ],
                },
                endDate: {
                    type: "date",
                    required: false,
                    description: "结束日期",
                },
                count: {
                    type: "number",
                    required: false,
                    description: "重复次数",
                },
                daysOfWeek: {
                    type: "array",
                    required: false,
                    description: "星期几（0=周日）",
                    items: {
                        type: "number",
                        validation: [
                            {
                                type: "min",
                                value: 0,
                                errorMessage: "星期值必须在0-6之间",
                            },
                            {
                                type: "max",
                                value: 6,
                                errorMessage: "星期值必须在0-6之间",
                            },
                        ],
                    },
                },
            },
        },
    ],
    display: {
        color: "#9c27b0",
        icon: "recurring",
        titleTemplate: "${title} (重复)",
        descriptionTemplate:
            '${recurrence.frequency === "daily" ? "每天" : recurrence.frequency === "weekly" ? "每周" : recurrence.frequency === "monthly" ? "每月" : "每年"}',
    },
    behavior: {
        draggable: true,
        resizable: true,
        editable: true,
        deletable: true,
        allowOverlap: false,
    },
    validation: [
        {
            type: "crossField",
            expression: (appointment: any) => {
                const recurrence = appointment.recurrence;
                // endDate 和 count 至少有一个
                return !!(recurrence.endDate || recurrence.count);
            },
            errorMessage: "重复预约必须指定结束日期或重复次数",
        },
    ],
};

// ============================================
// 示例 4: 培训预约
// ============================================
export const trainingAppointmentType: AppointmentType = {
    id: "training",
    name: "培训",
    description: "培训课程预约",
    fields: [
        {
            name: "title",
            type: "string",
            required: true,
            description: "培训标题",
        },
        {
            name: "instructor",
            type: "string",
            required: true,
            description: "讲师",
        },
        {
            name: "capacity",
            type: "number",
            required: true,
            description: "容量（最大人数）",
            validation: [
                { type: "min", value: 1, errorMessage: "容量必须大于0" },
                { type: "max", value: 1000, errorMessage: "容量不能超过1000" },
            ],
        },
        {
            name: "enrolled",
            type: "number",
            required: false,
            default: 0,
            description: "已报名人数",
        },
        {
            name: "materials",
            type: "array",
            required: false,
            description: "培训材料链接",
            items: {
                type: "string",
            },
        },
    ],
    display: {
        color: "#4caf50",
        icon: "training",
        titleTemplate: "${title}",
        descriptionTemplate: "讲师: ${instructor} • ${enrolled}/${capacity} 人",
    },
    behavior: {
        draggable: true,
        resizable: true,
        editable: true,
        deletable: true,
        allowOverlap: false,
        minDuration: 30,
        maxDuration: 480,
        defaultDuration: 120,
    },
    validation: [
        {
            type: "custom",
            expression: (appointment: any) => {
                return appointment.enrolled <= appointment.capacity;
            },
            errorMessage: "已报名人数不能超过容量",
        },
    ],
};

// ============================================
// 完整的 DSL 配置示例
// ============================================
export const exampleDSL: AppointmentDSL = {
    types: [
        meetingAppointmentType,
        vacationAppointmentType,
        recurringAppointmentType,
        trainingAppointmentType,
    ],
    rules: [
        // 全局规则：所有预约必须至少提前1小时创建
        {
            type: "custom",
            expression: (appointment: any) => {
                const now = new Date();
                const startTime = new Date(appointment.startTime);
                const diff = startTime.getTime() - now.getTime();
                return diff >= 60 * 60 * 1000; // 1小时
            },
            errorMessage: "预约必须至少提前1小时创建",
        },
    ],
    validators: [
        // 全局验证器：检查时间冲突
        {
            type: "custom",
            expression: async (appointment: any, allAppointments: any[]) => {
                return !allAppointments.some((apt) => {
                    if (apt.id === appointment.id) return false;
                    return (
                        apt.startTime < appointment.endTime &&
                        apt.endTime > appointment.startTime
                    );
                });
            },
            errorMessage: "该时间段已有其他预约",
        },
    ],
};

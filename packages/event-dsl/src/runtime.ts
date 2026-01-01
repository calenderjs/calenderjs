/**
 * Appointment DSL 运行时
 * 
 * 在组件中使用，提供类型检查、验证和渲染功能
 */

import {
  CompiledDSL,
  CompiledType,
  ValidationResult,
  RenderedAppointment,
  Appointment,
  BehaviorConfig,
} from './types';

/**
 * DSL 运行时
 */
export class AppointmentDSLRuntime {
  private compiledDSL: CompiledDSL;

  constructor(compiledDSL: CompiledDSL) {
    this.compiledDSL = compiledDSL;
  }

  /**
   * 验证预约数据
   */
  validate(appointment: Appointment, typeId: string): ValidationResult {
    const type = this.compiledDSL.types.find(t => t.id === typeId);
    if (!type) {
      return { valid: false, errors: [`未知的预约类型: ${typeId}`] };
    }
    return type.validator(appointment);
  }

  /**
   * 获取预约类型定义
   */
  getType(typeId: string): CompiledType | undefined {
    return this.compiledDSL.types.find(t => t.id === typeId);
  }

  /**
   * 渲染预约
   */
  render(appointment: Appointment, typeId: string): RenderedAppointment {
    const type = this.getType(typeId);
    if (!type) {
      // 如果没有找到类型，返回默认渲染
      return {
        title: appointment.title,
        description: appointment.description,
        color: appointment.color || '#4285f4',
      };
    }
    return type.renderer(appointment);
  }

  /**
   * 获取所有类型
   */
  getTypes(): CompiledType[] {
    return this.compiledDSL.types;
  }

  /**
   * 获取行为配置
   */
  getBehavior(typeId: string): BehaviorConfig | undefined {
    const type = this.getType(typeId);
    return type?.behavior;
  }

  /**
   * 检查时间约束
   */
  checkTimeConstraints(
    appointment: Appointment,
    typeId: string
  ): ValidationResult {
    const behavior = this.getBehavior(typeId);
    if (!behavior || !behavior.timeConstraints) {
      return { valid: true, errors: [] };
    }

    const errors: string[] = [];
    const startTime = new Date(appointment.startTime);
    const endTime = new Date(appointment.endTime);

    behavior.timeConstraints.forEach(constraint => {
      switch (constraint.type) {
        case 'workingHours':
          const { start, end } = constraint.value;
          const startHour = parseInt(start.split(':')[0]);
          const startMinute = parseInt(start.split(':')[1]);
          const endHour = parseInt(end.split(':')[0]);
          const endMinute = parseInt(end.split(':')[1]);

          const appointmentStartHour = startTime.getHours();
          const appointmentStartMinute = startTime.getMinutes();
          const appointmentEndHour = endTime.getHours();
          const appointmentEndMinute = endTime.getMinutes();

          const appointmentStart = appointmentStartHour * 60 + appointmentStartMinute;
          const appointmentEnd = appointmentEndHour * 60 + appointmentEndMinute;
          const workingStart = startHour * 60 + startMinute;
          const workingEnd = endHour * 60 + endMinute;

          if (appointmentStart < workingStart || appointmentEnd > workingEnd) {
            errors.push(constraint.errorMessage || '不在工作时间内');
          }
          break;

        case 'dayOfWeek':
          const allowedDays = constraint.value as number[];
          const dayOfWeek = startTime.getDay();
          if (!allowedDays.includes(dayOfWeek)) {
            errors.push(constraint.errorMessage || '不在允许的日期');
          }
          break;

        case 'dateRange':
          const { start: rangeStart, end: rangeEnd } = constraint.value;
          const startDate = new Date(rangeStart);
          const endDate = new Date(rangeEnd);
          if (startTime < startDate || endTime > endDate) {
            errors.push(constraint.errorMessage || '不在允许的日期范围内');
          }
          break;
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

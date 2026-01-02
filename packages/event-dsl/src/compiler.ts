/**
 * Appointment DSL 编译器
 * 
 * 将 DSL 定义编译为可执行的验证器和渲染器
 */

import {
  AppointmentDSL,
  AppointmentType,
  ValidationResult,
  RenderedAppointment,
  FieldDefinition,
  FieldValidationRule,
  BehaviorConfig,
  CompiledDSL,
  CompiledType,
  CompiledValidator,
  ValidatorFunction,
  RendererFunction,
} from './types';

/**
 * DSL 编译器
 */
export class AppointmentDSLCompiler {
  /**
   * 编译 DSL 定义
   */
  compile(dsl: AppointmentDSL): CompiledDSL {
    return {
      types: this.compileTypes(dsl.types),
      validators: this.compileValidators(dsl.validators || []),
    };
  }

  /**
   * 编译预约类型列表
   * 
   * 注意：DSL 是生成工具，用于生成符合 Event Data Model 的数据
   * Event Data Model 是 SSOT，定义了 Event 接口结构
   */
  private compileTypes(types: AppointmentType[]): CompiledType[] {
    return types.map(type => ({
      id: type.id,
      name: type.name,
      validator: this.generateValidator(type),
      renderer: this.generateRenderer(type),
      behavior: type.behavior,
    }));
  }

  /**
   * 生成验证器函数
   */
  private generateValidator(type: AppointmentType): ValidatorFunction {
    return (appointment: any): ValidationResult => {
      const errors: string[] = [];

      // 字段验证
      type.fields.forEach(field => {
        const value = appointment[field.name] ?? appointment.dslData?.[field.name];

        // 必填验证
        if (field.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field.name} 是必填字段`);
          return;
        }

        // 字段级验证
        if (field.validation && value !== undefined && value !== null) {
          field.validation.forEach(rule => {
            if (!this.validateFieldRule(value, rule)) {
              errors.push(rule.errorMessage);
            }
          });
        }
      });

      // 跨字段验证
      if (type.validation) {
        type.validation.forEach(rule => {
          if (rule.type === 'crossField' || rule.type === 'custom') {
            const fn = typeof rule.expression === 'function'
              ? rule.expression
              : this.compileExpression(rule.expression as string);
            if (!fn(appointment)) {
              errors.push(rule.errorMessage);
            }
          }
        });
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    };
  }

  /**
   * 验证字段规则
   */
  private validateFieldRule(value: any, rule: FieldValidationRule): boolean {
    switch (rule.type) {
      case 'min':
        return typeof value === 'number' && value >= (rule.value ?? 0);
      case 'max':
        return typeof value === 'number' && value <= (rule.value ?? Infinity);
      case 'minLength':
        return typeof value === 'string' && value.length >= (rule.value ?? 0);
      case 'maxLength':
        return typeof value === 'string' && value.length <= (rule.value ?? Infinity);
      case 'pattern':
        return typeof value === 'string' && new RegExp(rule.value).test(value);
      case 'custom':
        if (typeof rule.value === 'function') {
          return rule.value(value);
        }
        return true;
      default:
        return true;
    }
  }

  /**
   * 编译表达式（简化实现）
   */
  private compileExpression(expression: string): Function {
    // 简单的表达式编译，实际应该使用更安全的表达式解析器
    try {
      return new Function('appointment', `return ${expression}`);
    } catch {
      return () => true;
    }
  }

  /**
   * 生成渲染器函数
   */
  private generateRenderer(type: AppointmentType): RendererFunction {
    return (appointment: any): RenderedAppointment => {
      const data = { ...appointment, ...(appointment.dslData || {}) };
      
      const title = this.renderTemplate(
        type.display.titleTemplate || '${title}',
        data
      );
      
      const description = type.display.descriptionTemplate
        ? this.renderTemplate(type.display.descriptionTemplate, data)
        : undefined;

      return {
        title,
        description,
        color: type.display.color,
        icon: type.display.icon,
      };
    };
  }

  /**
   * 渲染模板（支持 ${fieldName} 变量替换）
   */
  private renderTemplate(template: string, data: any): string {
    return template.replace(/\${([^}]+)}/g, (match, key) => {
      const value = this.getNestedValue(data, key.trim());
      return value !== undefined && value !== null ? String(value) : '';
    });
  }

  /**
   * 获取嵌套值（支持点号路径，如 attendees.length）
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) {
        return undefined;
      }
      return current[key];
    }, obj);
  }

  /**
   * 编译验证器列表
   */
  private compileValidators(validators: any[]): CompiledValidator[] {
    return validators.map(validator => ({
      name: validator.name,
      validate: validator.validate,
    }));
  }
}

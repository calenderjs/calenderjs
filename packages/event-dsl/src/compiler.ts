/**
 * Appointment DSL 编译器
 * 
 * 将 DSL 定义编译为可执行的验证器和渲染器
 */

import {
  AppointmentDSL,
  AppointmentType,
  CompiledDSL,
  CompiledType,
  ValidationResult,
  RenderedAppointment,
  FieldDefinition,
  FieldValidationRule,
} from './types';

/**
 * 编译后的 DSL
 */
export interface CompiledDSL {
  types: CompiledType[];
  validators: CompiledValidator[];
}

/**
 * 编译后的预约类型
 */
export interface CompiledType {
  id: string;
  name: string;
  schema: any; // JSON Schema
  validator: ValidatorFunction;
  renderer: RendererFunction;
  behavior: BehaviorConfig;
}

/**
 * 编译后的验证器
 */
export interface CompiledValidator {
  name: string;
  validate: ValidatorFunction;
}

/**
 * 验证器函数类型
 */
export type ValidatorFunction = (appointment: any) => ValidationResult;

/**
 * 渲染器函数类型
 */
export type RendererFunction = (appointment: any) => RenderedAppointment;

/**
 * 行为配置（从类型中提取）
 */
import { BehaviorConfig } from './types';

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
   */
  private compileTypes(types: AppointmentType[]): CompiledType[] {
    return types.map(type => ({
      id: type.id,
      name: type.name,
      schema: this.generateJSONSchema(type),
      validator: this.generateValidator(type),
      renderer: this.generateRenderer(type),
      behavior: type.behavior,
    }));
  }

  /**
   * 生成 JSON Schema
   */
  private generateJSONSchema(type: AppointmentType): any {
    const schema: any = {
      type: 'object',
      properties: {},
      required: [],
    };

    type.fields.forEach(field => {
      schema.properties[field.name] = this.fieldToJSONSchema(field);
      if (field.required) {
        schema.required.push(field.name);
      }
    });

    return schema;
  }

  /**
   * 将字段定义转换为 JSON Schema
   */
  private fieldToJSONSchema(field: FieldDefinition): any {
    const schema: any = {};

    switch (field.type) {
      case 'string':
        schema.type = 'string';
        break;
      case 'number':
        schema.type = 'number';
        break;
      case 'boolean':
        schema.type = 'boolean';
        break;
      case 'date':
        schema.type = 'string';
        schema.format = 'date-time';
        break;
      case 'time':
        schema.type = 'string';
        schema.format = 'time';
        break;
      case 'enum':
        schema.type = 'string';
        schema.enum = field.enum;
        break;
      case 'array':
        schema.type = 'array';
        if (field.items) {
          schema.items = this.fieldToJSONSchema(field.items);
        }
        break;
      case 'object':
        schema.type = 'object';
        if (field.properties) {
          schema.properties = {};
          Object.entries(field.properties).forEach(([key, prop]) => {
            schema.properties[key] = this.fieldToJSONSchema(prop);
          });
        }
        break;
    }

    if (field.default !== undefined) {
      schema.default = field.default;
    }

    return schema;
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

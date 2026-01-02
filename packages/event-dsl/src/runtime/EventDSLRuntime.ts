/**
 * Event DSL 运行时引擎
 * 
 * 根据 RFC-0001 定义
 */

import { EventTypeAST } from '../ast/types';
import type { Event } from '@calenderjs/event-model';
import { ValidationContext, RenderContext, User } from '@calenderjs/core';
import type { ValidationResult, RenderedAppointment } from '../types';

/**
 * Event DSL 运行时引擎
 * 
 * 用于执行 DSL AST，进行验证、渲染和行为检查
 */
export class EventDSLRuntime {
  private ast: EventTypeAST;

  constructor(ast: EventTypeAST) {
    this.ast = ast;
  }

  /**
   * 获取 AST（只读）
   */
  getAST(): EventTypeAST {
    return this.ast;
  }

  /**
   * 验证事件
   */
  validate(event: Event, context: ValidationContext): ValidationResult {
    const errors: string[] = [];

    // 执行验证规则
    for (const rule of this.ast.validate) {
      const result = this.evaluateValidationRule(rule, event, context);
      if (!result.valid) {
        errors.push(...(result.errors || []));
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : [],
    };
  }

  /**
   * 渲染事件
   */
  render(event: Event, context: RenderContext): RenderedAppointment {
    const rendered: RenderedAppointment = {
      title: event.title,
      color: '#4285f4',
      description: '',
    };

    // 执行显示规则
    for (const rule of this.ast.display) {
      const value = this.evaluateDisplayValue(rule.value, event, context);
      switch (rule.name) {
        case 'color':
          rendered.color = value as string;
          break;
        case 'icon':
          rendered.icon = value as string;
          break;
        case 'title':
          rendered.title = value as string;
          break;
        case 'description':
          rendered.description = value as string;
          break;
      }
    }

    return rendered;
  }

  /**
   * 检查是否可以执行某个操作
   */
  canPerform(action: string, event: Event, user: User): boolean {
    // 查找对应的行为规则
    const behaviorRule = this.ast.behavior.find(rule => rule.name === action);
    if (!behaviorRule) {
      return false;
    }

    // 评估行为值
    if (typeof behaviorRule.value === 'boolean') {
      return behaviorRule.value;
    }

    // 评估表达式
    return this.evaluateExpression(behaviorRule.value, event, { user });
  }

  /**
   * 评估验证规则
   */
  private evaluateValidationRule(rule: any, event: Event, context: ValidationContext): ValidationResult {
    if (!rule) {
      return { valid: true, errors: [] };
    }

    // When 规则：条件满足时执行子规则
    if (rule.type === 'When') {
      const conditionResult = this.evaluateExpression(rule.condition, event, context);
      if (conditionResult) {
        const errors: string[] = [];
        for (const subRule of rule.rules || []) {
          const result = this.evaluateValidationRule(subRule, event, context);
          if (!result.valid) {
            errors.push(...(result.errors || []));
          }
        }
        return {
          valid: errors.length === 0,
          errors: errors.length > 0 ? errors : [],
        };
      }
      return { valid: true, errors: [] };
    }

    // Between 规则：字段值在范围内
    if (rule.type === 'Between') {
      const fieldValue = this.getFieldValue(rule.field, event, context);
      const min = this.getLiteralValue(rule.min);
      const max = this.getLiteralValue(rule.max);
      
      if (fieldValue === undefined || fieldValue === null) {
        return { valid: false, errors: [`字段 ${rule.field.path.join('.')} 未定义`] };
      }

      const numValue = typeof fieldValue === 'number' ? fieldValue : Number(fieldValue);
      const numMin = typeof min === 'number' ? min : Number(min);
      const numMax = typeof max === 'number' ? max : Number(max);

      if (isNaN(numValue) || isNaN(numMin) || isNaN(numMax)) {
        return { valid: false, errors: [`字段 ${rule.field.path.join('.')} 无法进行数值比较`] };
      }

      const valid = numValue >= numMin && numValue <= numMax;
      return {
        valid,
        errors: valid ? undefined : [`字段 ${rule.field.path.join('.')} 必须在 ${min} 和 ${max} 之间`],
      };
    }

    // Comparison 规则：比较表达式
    if (rule.type === 'Comparison') {
      const leftValue = this.getExpressionValue(rule.left, event, context);
      const rightValue = this.getLiteralValue(rule.right);
      const result = this.compareValues(leftValue, rightValue, rule.operator);
      
      return {
        valid: result,
        errors: result ? undefined : [`验证失败: ${rule.operator} 比较不满足`],
      };
    }

    // NoConflict 规则：检查时间冲突
    if (rule.type === 'NoConflict') {
      const hasConflict = this.checkTimeConflict(event, context.events || []);
      return {
        valid: !hasConflict,
        errors: hasConflict ? ['事件时间与其他事件冲突'] : undefined,
      };
    }

    // Conflict 规则：检查是否有冲突（与 NoConflict 相反）
    if (rule.type === 'Conflict') {
      const hasConflict = this.checkTimeConflict(event, context.events || []);
      return {
        valid: hasConflict,
        errors: hasConflict ? undefined : ['事件时间未与其他事件冲突'],
      };
    }

    // BinaryExpression 规则：逻辑表达式（and/or）
    if (rule.type === 'BinaryExpression') {
      const leftResult = this.evaluateExpression(rule.left, event, context);
      const rightResult = this.evaluateExpression(rule.right, event, context);
      
      if (rule.operator === 'and') {
        return { valid: leftResult && rightResult };
      } else if (rule.operator === 'or') {
        return { valid: leftResult || rightResult };
      }
    }

    // UnaryExpression 规则：逻辑非
    if (rule.type === 'UnaryExpression' && rule.operator === 'not') {
      const argResult = this.evaluateExpression(rule.argument, event, context);
      return { valid: !argResult };
    }

    // 默认返回有效
    return { valid: true };
  }

  /**
   * 评估显示值
   */
  private evaluateDisplayValue(value: any, event: Event, context: RenderContext): any {
    if (typeof value === 'string') {
      return value;
    }

    if (value?.type === 'Conditional') {
      const condition = this.evaluateExpression(value.condition, event, context);
      return condition ? this.evaluateDisplayValue(value.consequent, event, context) : 
                         (value.alternate ? this.evaluateDisplayValue(value.alternate, event, context) : '');
    }

    if (value?.type === 'Template') {
      return this.evaluateTemplate(value, event, context);
    }

    return value;
  }

  /**
   * 评估表达式
   */
  private evaluateExpression(expr: any, event: Event, context: any): boolean {
    if (!expr) {
      return false;
    }

    // FieldAccess：字段访问，转换为布尔值
    if (expr.type === 'FieldAccess') {
      const value = this.getFieldValue(expr, event, context);
      return Boolean(value);
    }

    // Comparison：比较表达式
    if (expr.type === 'Comparison') {
      const leftValue = this.getExpressionValue(expr.left, event, context);
      const rightValue = this.getLiteralValue(expr.right);
      return this.compareValues(leftValue, rightValue, expr.operator);
    }

    // BinaryExpression：逻辑表达式（and/or）
    if (expr.type === 'BinaryExpression') {
      const leftResult = this.evaluateExpression(expr.left, event, context);
      const rightResult = this.evaluateExpression(expr.right, event, context);
      
      if (expr.operator === 'and') {
        return leftResult && rightResult;
      } else if (expr.operator === 'or') {
        return leftResult || rightResult;
      }
    }

    // UnaryExpression：逻辑非
    if (expr.type === 'UnaryExpression' && expr.operator === 'not') {
      const argResult = this.evaluateExpression(expr.argument, event, context);
      return !argResult;
    }

    // 默认返回 false
    return false;
  }

  /**
   * 评估模板
   */
  private evaluateTemplate(template: any, event: Event, context: RenderContext): string {
    if (!template || template.type !== 'Template' || !Array.isArray(template.parts)) {
      return '';
    }

    return template.parts.map((part: string | any) => {
      if (typeof part === 'string') {
        return part;
      }
      if (part && part.type === 'FieldAccess') {
        const value = this.getFieldValue(part, event, context);
        return value !== undefined && value !== null ? String(value) : '';
      }
      return '';
    }).join('');
  }

  /**
   * 获取字段值
   */
  private getFieldValue(fieldAccess: any, event: Event, context: any): any {
    if (!fieldAccess || fieldAccess.type !== 'FieldAccess' || !Array.isArray(fieldAccess.path)) {
      return undefined;
    }

    const path = fieldAccess.path;
    if (path.length === 0) {
      return undefined;
    }

    // 访问 context 中的字段（如 user.email, user.role）- 优先处理
    if (path[0] === 'user' && context?.user) {
      let current: any = context.user;
      for (let i = 1; i < path.length; i++) {
        if (current === undefined || current === null) {
          return undefined;
        }
        current = current[path[i]];
      }
      return current;
    }

    // 特殊字段：startTime, endTime, title, type, id
    if (path.length === 1) {
      const fieldName = path[0];
      if (fieldName === 'startTime') {
        return event.startTime;
      }
      if (fieldName === 'endTime') {
        return event.endTime;
      }
      if (fieldName === 'title') {
        return event.title;
      }
      if (fieldName === 'type') {
        return event.type;
      }
      if (fieldName === 'id') {
        return event.id;
      }
    }

    // 访问 event.data 中的字段
    if (path[0] === 'data') {
      let current: any = event.data;
      for (let i = 1; i < path.length; i++) {
        if (current === undefined || current === null) {
          return undefined;
        }
        current = current[path[i]];
      }
      return current;
    }

    // 访问 event.data 中的嵌套字段（如 priority, status 等）
    if (path.length > 1) {
      let current: any = event.data;
      for (let i = 0; i < path.length; i++) {
        if (current === undefined || current === null) {
          return undefined;
        }
        current = current[path[i]];
      }
      return current;
    }

    // 直接访问 event.data[fieldName]
    if (path.length === 1 && event.data) {
      return event.data[path[0]];
    }

    return undefined;
  }

  /**
   * 获取表达式值
   */
  private getExpressionValue(expr: any, event: Event, context: any): any {
    if (expr?.type === 'FieldAccess') {
      return this.getFieldValue(expr, event, context);
    }
    return expr;
  }

  /**
   * 获取字面量值
   */
  private getLiteralValue(literal: any): any {
    if (literal === null || literal === undefined) {
      return literal;
    }
    
    // Duration 类型：转换为分钟数
    if (literal?.type === 'Duration') {
      const value = literal.value || 0;
      const unit = literal.unit || 'minutes';
      const multipliers: Record<string, number> = {
        minutes: 1,
        hours: 60,
        days: 1440,
        weeks: 10080,
      };
      return value * (multipliers[unit] || 1);
    }

    return literal;
  }

  /**
   * 比较两个值
   */
  private compareValues(left: any, right: any, operator: string): boolean {
    // 处理 Date 对象
    const leftValue = left instanceof Date ? left.getTime() : left;
    const rightValue = right instanceof Date ? right.getTime() : right;

    switch (operator) {
      case 'is':
      case 'equals':
        return leftValue === rightValue;
      case 'is not':
      case 'not equals':
        return leftValue !== rightValue;
      case '>':
        return Number(leftValue) > Number(rightValue);
      case '>=':
        return Number(leftValue) >= Number(rightValue);
      case '<':
        return Number(leftValue) < Number(rightValue);
      case '<=':
        return Number(leftValue) <= Number(rightValue);
      default:
        return false;
    }
  }

  /**
   * 检查时间冲突
   */
  private checkTimeConflict(event: Event, otherEvents: Event[]): boolean {
    for (const otherEvent of otherEvents) {
      if (otherEvent.id === event.id) {
        continue; // 跳过自己
      }

      // 检查时间重叠
      const eventStart = event.startTime.getTime();
      const eventEnd = event.endTime.getTime();
      const otherStart = otherEvent.startTime.getTime();
      const otherEnd = otherEvent.endTime.getTime();

      // 重叠条件：eventStart < otherEnd && eventEnd > otherStart
      if (eventStart < otherEnd && eventEnd > otherStart) {
        return true;
      }
    }
    return false;
  }
}

{
  // 辅助函数
  function buildBinaryExpression(head, tail) {
    return tail.reduce((left, [op, right]) => ({
      type: 'BinaryExpression',
      operator: op,
      left: left,
      right: right
    }), head);
  }
}

// ============================================
// 顶层规则
// ============================================

EventTypeDefinition
  = _ sections:Section+ _ {
      const result = {};
      sections.forEach(section => {
        result[section.name] = section.value;
      });
      return result;
    }

Section
  = TypeSection
  / NameSection
  / DescriptionSection
  / FieldsSection
  / ValidateSection
  / DisplaySection
  / BehaviorSection
  / ConstraintsSection
  / RecurringSection

// ============================================
// 基本信息部分
// ============================================

TypeSection
  = "type:" _ value:Identifier _ {
      return { name: 'type', value: value };
    }

NameSection
  = "name:" _ value:String _ {
      return { name: 'name', value: value };
    }

DescriptionSection
  = "description:" _ value:String _ {
      return { name: 'description', value: value };
    }

// ============================================
// 字段定义部分
// ============================================

FieldsSection
  = "fields:" _ fields:FieldDefinition+ {
      return { name: 'fields', value: fields };
    }

FieldDefinition
  = _ "-" _ name:Identifier ":" _ type:FieldType modifiers:FieldModifier* _ {
      return {
        name: name,
        type: type,
        ...Object.assign({}, ...modifiers)
      };
    }

FieldType
  = "string"
  / "number"
  / "boolean"
  / "email"
  / "text"
  / "list of " type:FieldType { return { type: 'list', itemType: type }; }
  / "enum(" values:EnumValues ")" { return { type: 'enum', values: values }; }

EnumValues
  = head:Identifier tail:("," _ value:Identifier { return value; })* {
      return [head, ...tail];
    }

FieldModifier
  = "," _ "required" { return { required: true }; }
  / "," _ "default:" _ value:Literal { return { default: value }; }
  / "," _ "min:" _ value:Number { return { min: value }; }
  / "," _ "max:" _ value:Number { return { max: value }; }

// ============================================
// 验证规则部分
// ============================================

ValidateSection
  = "validate:" _ rules:ValidationRule+ {
      return { name: 'validate', value: rules };
    }

ValidationRule
  = _ WhenExpression
  / _ ComparisonExpression

WhenExpression
  = "when" _ condition:LogicalExpression ":" _ rules:ValidationRule+ {
      return {
        type: 'When',
        condition: condition,
        rules: rules
      };
    }

ComparisonExpression
  = InExpression
  / BetweenExpression
  / RangeExpression
  / ConflictExpression
  / LogicalExpression

InExpression
  = field:FieldAccess _ "in" _ "[" _ values:LiteralList _ "]" _ {
      return {
        type: 'In',
        field: field,
        values: values
      };
    }

LiteralList
  = head:Literal tail:(_ "," _ item:Literal { return item; })* {
      return [head, ...tail];
    }

BetweenExpression
  = field:FieldAccess _ "between" _ min:Literal _ "and" _ max:Literal _ {
      return {
        type: 'Between',
        field: field,
        min: min,
        max: max
      };
    }

RangeExpression
  = field:FieldAccess _ operator:ComparisonOperator _ value:Literal _ {
      return {
        type: 'Comparison',
        operator: operator,
        left: field,
        right: value
      };
    }

ConflictExpression
  = "no" _ "conflict" _ "with" _ "other" _ "events" _ {
      return { type: 'NoConflict' };
    }
  / "conflict" _ "with" _ "other" _ "events" _ {
      return { type: 'Conflict' };
    }

LogicalExpression
  = head:LogicalTerm tail:(_ operator:("and" / "or") _ right:LogicalTerm {
      return [operator, right];
    })* {
      return buildBinaryExpression(head, tail);
    }

LogicalTerm
  = "not" _ expr:ComparisonTerm {
      return { type: 'UnaryExpression', operator: 'not', argument: expr };
    }
  / ComparisonTerm

ComparisonTerm
  = ModExpression
  / left:FieldAccess _ operator:("is" / "equals" / "is not" / "not equals" / ">" / ">=" / "<" / "<=") _ right:Literal _ {
      return {
        type: 'Comparison',
        operator: operator,
        left: left,
        right: right
      };
    }
  / FieldAccess

ModExpression
  = left:FieldAccess _ "mod" _ modValue:Literal _ operator:("is" / "equals" / "is not" / "not equals" / ">" / ">=" / "<" / "<=") _ right:Literal _ {
      return {
        type: 'ModComparison',
        left: left,
        modValue: modValue,
        operator: operator,
        right: right
      };
    }

// ============================================
// 显示规则部分
// ============================================

DisplaySection
  = "display:" _ rules:DisplayRule+ {
      return { name: 'display', value: rules };
    }

DisplayRule
  = _ name:("color" / "icon" / "title" / "description") ":" _ value:DisplayValue _ {
      return { name: name, value: value };
    }

DisplayValue
  = WhenDisplayExpression
  / StringTemplate
  / String

WhenDisplayExpression
  = "when" _ condition:LogicalExpression ":" _ consequent:DisplayValue rest:(_ "else:" _ alternate:DisplayValue { return alternate; })? {
      return {
        type: 'Conditional',
        condition: condition,
        consequent: consequent,
        alternate: rest
      };
    }

// ============================================
// 行为规则部分
// ============================================

BehaviorSection
  = "behavior:" _ rules:BehaviorRule+ {
      return { name: 'behavior', value: rules };
    }

BehaviorRule
  = _ name:("draggable" / "resizable" / "editable" / "deletable") ":" _ value:BehaviorValue _ {
      return { name: name, value: value };
    }

BehaviorValue
  = LogicalExpression
  / Boolean

// ============================================
// 约束部分
// ============================================

ConstraintsSection
  = "constraints:" _ constraints:ConstraintRule+ {
      return { name: 'constraints', value: constraints };
    }

ConstraintRule
  = _ name:ConstraintName ":" _ value:ConstraintValue _ {
      return { name: name, value: value };
    }

ConstraintName
  = "timeZone" { return "timeZone"; }
  / "allowedTimeZones" { return "allowedTimeZones"; }
  / "timePrecision" { return "timePrecision"; }
  / "minAdvanceTime" { return "minAdvanceTime"; }
  / "maxAdvanceTime" { return "maxAdvanceTime"; }
  / "allowCrossDay" { return "allowCrossDay"; }
  / "maxCrossDayDuration" { return "maxCrossDayDuration"; }
  / "minDuration" { return "minDuration"; }
  / "maxDuration" { return "maxDuration"; }
  / "allowedHours" { return "allowedHours"; }
  / "allowedDays" { return "allowedDays"; }
  / Identifier

ConstraintValue
  = ArrayLiteral  // 支持数组（如 allowedTimeZones: ["Asia/Shanghai", "America/New_York"]）
  / RangeValue    // 支持范围（如 allowedHours: 9 to 18）
  / Duration      // 支持 Duration（如 timePrecision: 15 minutes）
  / String        // 支持字符串（如 timeZone: "Asia/Shanghai"）
  / Number        // 支持数字
  / Boolean       // 支持布尔值（如 allowCrossDay: true）
  / Identifier

RangeValue
  = min:Number _ "to" _ max:Number {
      return {
        type: 'Range',
        min: min,
        max: max
      };
    }

// ============================================
// 重复事件部分
// ============================================

RecurringSection
  = "recurring:" _ rules:RecurringRule+ {
      return { name: 'recurring', value: Object.assign({}, ...rules) };
    }

RecurringRule
  = _ "frequency:" _ value:RecurringFrequency _ {
      return { frequency: value };
    }
  / _ "interval:" _ value:Number _ {
      return { interval: value };
    }
  / _ "endDate:" _ value:DateString _ {
      return { endDate: value };
    }
  / _ "count:" _ value:Number _ {
      return { count: value };
    }
  / _ "daysOfWeek:" _ value:NumberList _ {
      return { daysOfWeek: value };
    }
  / _ "dayOfMonth:" _ value:Number _ {
      return { dayOfMonth: value };
    }
  / _ "excludeDates:" _ value:DateStringList _ {
      return { excludeDates: value };
    }
  / _ "timeZone:" _ value:String _ {
      return { timeZone: value };
    }

RecurringFrequency
  = "daily" { return "daily"; }
  / "weekly" { return "weekly"; }
  / "monthly" { return "monthly"; }
  / "yearly" { return "yearly"; }

NumberList
  = "[" _ head:Number tail:(_ "," _ item:Number { return item; })* _ "]" {
      return [head, ...tail];
    }

DateString
  = String  // 使用 String 规则解析日期字符串（格式：YYYY-MM-DD）

DateStringList
  = "[" _ head:DateString tail:(_ "," _ item:DateString { return item; })* _ "]" {
      return [head, ...tail];
    }

// ============================================
// 字段访问
// ============================================

FieldAccess
  = head:Identifier tail:("." property:Identifier { return property; })* {
      return {
        type: 'FieldAccess',
        path: [head, ...tail]
      };
    }

// ============================================
// 字面量
// ============================================

Literal
  = ArrayLiteral
  / Duration
  / Number
  / String
  / Boolean
  / Identifier

ArrayLiteral
  = "[" _ values:LiteralList _ "]" {
      return values;
    }

Duration
  = value:Number _ unit:("minutes" / "minute" / "hours" / "hour" / "days" / "day" / "weeks" / "week") {
      // 标准化单位名称（使用复数形式）
      const normalizedUnit = unit === "minute" ? "minutes" :
                             unit === "hour" ? "hours" :
                             unit === "day" ? "days" :
                             unit === "week" ? "weeks" : unit;
      return {
        type: 'Duration',
        value: value,
        unit: normalizedUnit
      };
    }

Number
  = digits:[0-9]+ {
      return parseInt(digits.join(''), 10);
    }

String
  = '"' chars:[^"]* '"' {
      return chars.join('');
    }

StringTemplate
  = '"' parts:TemplatePart+ '"' {
      return {
        type: 'Template',
        parts: parts
      };
    }

TemplatePart
  = "{" field:FieldAccess "}" { return field; }
  / chars:[^{}]+ { return chars.join(''); }

Boolean
  = "true" { return true; }
  / "false" { return false; }

Identifier
  = first:[a-zA-Z_] rest:[a-zA-Z0-9_]* {
      return first + rest.join('');
    }

ComparisonOperator
  = ">=" / "<=" / ">" / "<" / "is" / "equals" / "is not" / "not equals" / "mod"

// ============================================
// 空白和注释
// ============================================

_
  = (WhiteSpace / Comment)*

WhiteSpace
  = [ \t\n\r]

Comment
  = "#" [^\n]*

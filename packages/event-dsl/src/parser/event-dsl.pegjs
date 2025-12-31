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
  / _ ComparisonExpression _

WhenExpression
  = "when" _ condition:LogicalExpression ":" _ rules:ValidationRule+ {
      return {
        type: 'When',
        condition: condition,
        rules: rules
      };
    }

ComparisonExpression
  = BetweenExpression
  / RangeExpression
  / ConflictExpression
  / LogicalExpression

BetweenExpression
  = field:FieldAccess _ "between" _ min:Literal _ "and" _ max:Literal {
      return {
        type: 'Between',
        field: field,
        min: min,
        max: max
      };
    }

RangeExpression
  = field:FieldAccess _ operator:ComparisonOperator _ value:Literal {
      return {
        type: 'Comparison',
        operator: operator,
        left: field,
        right: value
      };
    }

ConflictExpression
  = "no" _ "conflict" _ "with" _ "other" _ "events" {
      return { type: 'NoConflict' };
    }
  / "conflict" _ "with" _ "other" _ "events" {
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
  = left:FieldAccess _ operator:("is" / "equals" / "is not" / "not equals" / ">" / ">=" / "<" / "<=") _ right:Literal {
      return {
        type: 'Comparison',
        operator: operator,
        left: left,
        right: right
      };
    }
  / FieldAccess

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
  = _ name:Identifier ":" _ value:Literal _ {
      return { name: name, value: value };
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
  = Duration
  / Number
  / String
  / Boolean
  / Identifier

Duration
  = value:Number _ unit:("minutes" / "hours" / "days" / "weeks") {
      return {
        type: 'Duration',
        value: value,
        unit: unit
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
  = chars:[a-zA-Z_][a-zA-Z0-9_]* {
      return chars.flat().join('');
    }

ComparisonOperator
  = ">=" / "<=" / ">" / "<" / "is" / "equals" / "is not" / "not equals"

// ============================================
// 空白和注释
// ============================================

_
  = (WhiteSpace / Comment)*

WhiteSpace
  = [ \t\n\r]

Comment
  = "#" [^\n]*

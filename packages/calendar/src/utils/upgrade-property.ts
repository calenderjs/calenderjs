/**
 * Web Components 属性升级（lazy properties）
 *
 * 若在 customElements 定义/升级之前给元素赋值（React 等框架常见），
 * 会在实例上留下自有数据属性，遮蔽原型上的 getter/setter，
 * 导致组件永远收不到该值。连接时需把值重新过一遍 setter。
 */

/** 升级单个属性：删除自有数据属性并通过原型 setter 重新赋值 */
export function upgradeProperty(target: object, prop: string): void {
  if (!Object.prototype.hasOwnProperty.call(target, prop)) {
    return;
  }

  const descriptor = Object.getOwnPropertyDescriptor(target, prop);
  // 访问器（如 @state 生成的）无需升级
  if (!descriptor || descriptor.get || descriptor.set) {
    return;
  }

  const record = target as Record<string, unknown>;
  const value = record[prop];
  delete record[prop];
  record[prop] = value;
}

/** 批量升级属性 */
export function upgradeProperties(
  target: object,
  props: readonly string[],
): void {
  for (const prop of props) {
    upgradeProperty(target, prop);
  }
}

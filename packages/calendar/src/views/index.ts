/**
 * 视图组件导出
 * 
 * 这些组件通过 @autoRegister 自动注册为 Web Components：
 * - <wsx-day-view>
 * - <wsx-month-view>
 * - <wsx-week-view>
 */

// 导入以触发自动注册
import "./DayView.wsx";
import "./MonthView.wsx";
import "./WeekView.wsx";

// 注意：WSX 文件在构建时会被处理，类型声明会自动生成
// 如果需要导出类，请确保构建配置正确生成了类型声明

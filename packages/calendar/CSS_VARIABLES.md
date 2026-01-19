# Calendar CSS Variables

所有日历组件都支持通过 CSS 变量进行自定义。所有变量都使用 `--calender-` 前缀。

## 基础变量

### 颜色

```css
:root {
  /* 背景色 */
  --calender-bg-color: #fff;
  
  /* 文本颜色 */
  --calender-text-color: #202124;
  --calender-text-secondary-color: #5f6368;
  --calender-primary-text-color: #fff;
  
  /* 边框颜色 */
  --calender-border-color: #dadce0;
  --calender-border-light-color: #e8eaed;
  --calender-border-hover-color: #c4c7c5;
  
  /* 主色调 */
  --calender-primary-color: #1a73e8;
  --calender-primary-hover-color: #1765cc;
  
  /* 状态颜色 */
  --calender-today-bg-color: #e8f0fe;
  --calender-selected-bg-color: #e8f0fe;
  --calender-hover-bg-color: #f1f3f4;
  --calender-hover-bg-color-light: #f8f9fa;
  --calender-active-bg-color: #e8eaed;
  
  /* 事件颜色 */
  --calender-event-text-color: #fff;
}
```

### 字体

```css
:root {
  --calender-font-family: 'Google Sans', Roboto, Arial, sans-serif;
  --calender-font-size: 14px;
  --calender-button-font-weight: 500;
  --calender-today-font-weight: 500;
  --calender-selected-font-weight: 500;
  --calender-event-title-font-weight: 500;
}
```

### 尺寸

```css
:root {
  /* 工具栏 */
  --calender-toolbar-padding: 8px 16px;
  --calender-toolbar-min-height: 48px;
  --calender-toolbar-gap: 8px;
  --calender-toolbar-date-font-size: 22px;
  --calender-toolbar-date-font-weight: 400;
  --calender-toolbar-date-min-width: 200px;
  
  /* 按钮 */
  --calender-nav-button-size: 40px;
  --calender-button-padding: 8px 16px;
  --calender-icon-size: 24px;
  
  /* 时间轴 */
  --calender-week-time-gutter-width: 60px;
  --calender-day-time-gutter-width: 60px;
  --calender-hour-cell-height: 48px;
  
  /* 月视图 */
  --calender-month-cell-min-height: 100px;
  --calender-month-cell-padding: 4px;
  --calender-month-header-padding: 12px 8px;
  --calender-month-header-font-size: 11px;
  --calender-month-header-font-weight: 500;
  --calender-month-cell-date-font-size: 13px;
  --calender-month-cell-date-padding: 4px 8px;
  --calender-month-cell-date-margin-bottom: 4px;
  
  /* 周视图 */
  --calender-week-header-padding: 12px 4px;
  --calender-week-header-gap: 2px;
  --calender-week-today-indicator-size: 40px;
  --calender-week-day-name-font-size: 11px;
  --calender-week-day-name-font-weight: 500;
  --calender-week-day-name-letter-spacing: 0.8px;
  --calender-week-day-date-font-size: 26px;
  --calender-week-day-date-font-weight: 400;
  --calender-week-events-count-font-size: 11px;
  --calender-week-events-count-margin-top: 4px;
  
  /* 日视图 */
  --calender-day-header-padding: 16px 24px;
  --calender-day-header-date-font-size: 22px;
  --calender-day-header-date-font-weight: 400;
  
  /* 事件 */
  --calender-event-padding: 2px 6px;
  --calender-day-event-padding: 6px 10px;
  --calender-week-event-padding: 2px 4px;
  --calender-event-font-size: 12px;
  --calender-day-event-font-size: 13px;
  --calender-event-min-height: 18px;
  --calender-event-gap: 2px;
  --calender-event-border-radius: 3px;
  --calender-event-box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  --calender-event-hover-box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  --calender-event-hover-opacity: 0.9;
  --calender-event-time-font-size: 11px;
  --calender-event-time-opacity: 0.95;
  --calender-event-time-margin-bottom: 2px;
  --calender-event-title-margin-bottom: 2px;
  --calender-event-description-font-size: 12px;
  --calender-event-description-opacity: 0.85;
  --calender-event-description-margin-top: 4px;
  --calender-event-delete-padding: 0 4px;
  --calender-event-delete-font-size: 16px;
  --calender-event-delete-opacity: 0.8;
  --calender-week-event-margin: 1px;
  --calender-day-event-margin: 2px;
  --calender-week-event-line-height: 1.3;
  --calender-day-event-line-height: 1.4;
  --calender-day-event-title-margin-bottom: 4px;
  
  /* 时间标签 */
  --calender-time-label-font-size: 12px;
  --calender-time-label-padding-top: 4px;
  --calender-time-label-padding-right: 8px;
  
  /* 其他 */
  --calender-month-more-font-size: 11px;
  --calender-month-more-padding: 2px 6px;
  --calender-month-more-margin-top: 2px;
}
```

### 过渡和动画

```css
:root {
  --calender-transition-duration: 0.2s;
  --calender-transition-duration-fast: 0.15s;
}
```

### 边框

```css
:root {
  --calender-border-radius: 4px;
}
```

## 暗色模式示例

```css
.dark-mode {
  --calender-bg-color: #1e1e1e;
  --calender-text-color: #e0e0e0;
  --calender-text-secondary-color: #a0a0a0;
  --calender-border-color: #3a3a3a;
  --calender-border-light-color: #2a2a2a;
  --calender-hover-bg-color: #2a2a2a;
  --calender-hover-bg-color-light: #252525;
  --calender-active-bg-color: #333;
  --calender-today-bg-color: #1a3a5a;
  --calender-selected-bg-color: #1a3a5a;
  --calender-primary-color: #4285f4;
  --calender-primary-hover-color: #5a95f6;
}
```

## 使用示例

### 基础自定义

```css
:root {
  --calender-primary-color: #4285f4;
  --calender-bg-color: #fafafa;
  --calender-border-color: #e0e0e0;
}
```

### 完整主题自定义

```css
:root {
  /* 颜色 */
  --calender-bg-color: #ffffff;
  --calender-text-color: #202124;
  --calender-primary-color: #1a73e8;
  --calender-today-bg-color: #e8f0fe;
  
  /* 尺寸 */
  --calender-font-size: 14px;
  --calender-month-cell-min-height: 120px;
  --calender-hour-cell-height: 60px;
  
  /* 过渡 */
  --calender-transition-duration: 0.3s;
}
```

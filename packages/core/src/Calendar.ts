/**
 * Calendar 组件
 * 
 * 基于 Web Components 的日历组件，支持 DSL 渲染
 */

import { Appointment, AppointmentDSLRuntime, RenderedAppointment } from '@calenderjs/dsl';
import { CalendarProps, ViewType, DateCell } from './types';
import {
  generateDateGrid,
  isToday,
  isSameDay,
  formatTime,
  formatDateKey,
} from './utils/date-utils';
import {
  isAppointmentOnDate,
  calculateAppointmentTop,
  calculateAppointmentHeight,
} from './utils/appointment-utils';

/**
 * Calendar Web Component
 */
export class Calendar extends HTMLElement {
  private props: CalendarProps;
  private shadowRoot: ShadowRoot;
  private currentView: ViewType = 'month';
  private currentDate: Date = new Date();

  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: 'open' });
    this.props = this.getDefaultProps();
    this.loadProps();
  }

  /**
   * 获取默认属性
   */
  private getDefaultProps(): CalendarProps {
    return {
      appointments: [],
      defaultView: 'month',
      firstDayOfWeek: 1,
      timeSlotDuration: 30,
      minTime: '00:00',
      maxTime: '23:59',
      showWeekends: true,
      editable: true,
      draggable: true,
      resizable: true,
      selectable: true,
      theme: 'light',
    };
  }

  /**
   * 从属性加载配置
   */
  private loadProps(): void {
    // 从 data 属性加载
    const dataAppointments = this.getAttribute('data-appointments');
    if (dataAppointments) {
      try {
        this.props.appointments = JSON.parse(dataAppointments);
      } catch (e) {
        console.error('Failed to parse appointments:', e);
      }
    }

    // 从属性加载其他配置
    const defaultView = this.getAttribute('default-view') as ViewType;
    if (defaultView) {
      this.currentView = defaultView;
      this.props.defaultView = defaultView;
    }
  }

  /**
   * 连接组件到 DOM
   */
  connectedCallback(): void {
    this.render();
    this.attachEventListeners();
  }

  /**
   * 属性变化时更新
   */
  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'data-appointments' && oldValue !== newValue) {
      try {
        this.props.appointments = JSON.parse(newValue || '[]');
        this.render();
      } catch (e) {
        console.error('Failed to parse appointments:', e);
      }
    }
  }

  /**
   * 设置 DSL 运行时
   */
  setDSLRuntime(runtime: AppointmentDSLRuntime): void {
    this.props.dslRuntime = runtime;
    this.render();
  }

  /**
   * 设置预约列表
   */
  setAppointments(appointments: Appointment[]): void {
    this.props.appointments = appointments;
    this.render();
  }

  /**
   * 渲染组件
   */
  private render(): void {
    this.shadowRoot.innerHTML = `
      ${this.getStyles()}
      <div class="calendar-container" data-theme="${this.props.theme}">
        ${this.renderToolbar()}
        ${this.renderView()}
      </div>
    `;
  }

  /**
   * 获取样式
   */
  private getStyles(): string {
    return `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .calendar-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        
        .calendar-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .calendar-toolbar button {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .calendar-toolbar button:hover {
          background: #f5f5f5;
        }
        
        .calendar-view {
          flex: 1;
          overflow: auto;
        }
        
        /* 月视图样式 */
        .month-view {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
          background: #e0e0e0;
        }
        
        .month-day-header {
          background: #f5f5f5;
          padding: 8px;
          text-align: center;
          font-weight: 500;
        }
        
        .month-day-cell {
          background: white;
          min-height: 100px;
          padding: 4px;
          position: relative;
        }
        
        .month-day-cell.today {
          background: #e3f2fd;
        }
        
        .month-day-cell.other-month {
          background: #fafafa;
          color: #999;
        }
        
        .month-day-number {
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .month-appointment {
          font-size: 12px;
          padding: 2px 4px;
          margin: 2px 0;
          border-radius: 2px;
          cursor: pointer;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .month-appointment:hover {
          opacity: 0.8;
        }
        
        /* 周视图和日视图样式 */
        .time-view {
          display: flex;
          flex-direction: column;
        }
        
        .time-header {
          display: grid;
          grid-template-columns: 60px repeat(7, 1fr);
          border-bottom: 1px solid #e0e0e0;
        }
        
        .time-header-cell {
          padding: 8px;
          text-align: center;
          font-weight: 500;
        }
        
        .time-body {
          display: grid;
          grid-template-columns: 60px repeat(7, 1fr);
          position: relative;
        }
        
        .time-column {
          border-right: 1px solid #e0e0e0;
        }
        
        .time-slot {
          height: 60px;
          border-bottom: 1px solid #f0f0f0;
          position: relative;
        }
        
        .time-slot-label {
          padding: 4px 8px;
          font-size: 12px;
          color: #666;
        }
        
        .appointment-block {
          position: absolute;
          left: 2px;
          right: 2px;
          border-radius: 4px;
          padding: 4px;
          font-size: 12px;
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .appointment-block:hover {
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        
        .appointment-title {
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .appointment-time {
          font-size: 11px;
          opacity: 0.8;
        }
      </style>
    `;
  }

  /**
   * 渲染工具栏
   */
  private renderToolbar(): string {
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const month = monthNames[this.currentDate.getMonth()];
    const year = this.currentDate.getFullYear();

    return `
      <div class="calendar-toolbar">
        <div>
          <button class="prev-month">←</button>
          <button class="today-btn">今天</button>
          <button class="next-month">→</button>
        </div>
        <div>
          <span class="current-date">${year}年 ${month}</span>
        </div>
        <div>
          <button class="view-month" data-view="month">月</button>
          <button class="view-week" data-view="week">周</button>
          <button class="view-day" data-view="day">日</button>
        </div>
      </div>
    `;
  }

  /**
   * 渲染视图
   */
  private renderView(): string {
    switch (this.currentView) {
      case 'month':
        return this.renderMonthView();
      case 'week':
        return this.renderWeekView();
      case 'day':
        return this.renderDayView();
      default:
        return this.renderMonthView();
    }
  }

  /**
   * 渲染月视图
   */
  private renderMonthView(): string {
    const dates = generateDateGrid(this.currentDate, this.props.firstDayOfWeek || 1);
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const currentMonth = this.currentDate.getMonth();

    let html = '<div class="calendar-view month-view">';
    
    // 星期标题
    weekDays.forEach(day => {
      html += `<div class="month-day-header">${day}</div>`;
    });

    // 日期单元格
    dates.forEach(date => {
      const isCurrentMonth = date.getMonth() === currentMonth;
      const isTodayDate = isToday(date);
      const dateKey = formatDateKey(date);
      const dayAppointments = this.props.appointments.filter(apt =>
        isAppointmentOnDate(apt, date)
      );

      html += `
        <div class="month-day-cell ${isTodayDate ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}">
          <div class="month-day-number">${date.getDate()}</div>
          ${dayAppointments.slice(0, 3).map(apt => this.renderAppointment(apt)).join('')}
          ${dayAppointments.length > 3 ? `<div class="more-appointments">+${dayAppointments.length - 3} 更多</div>` : ''}
        </div>
      `;
    });

    html += '</div>';
    return html;
  }

  /**
   * 渲染周视图
   */
  private renderWeekView(): string {
    // 简化实现，返回占位符
    return '<div class="calendar-view time-view"><div>周视图（待实现）</div></div>';
  }

  /**
   * 渲染日视图
   */
  private renderDayView(): string {
    // 简化实现，返回占位符
    return '<div class="calendar-view time-view"><div>日视图（待实现）</div></div>';
  }

  /**
   * 渲染预约（支持 DSL）
   */
  private renderAppointment(appointment: Appointment): string {
    // 如果配置了 DSL 运行时且预约有类型，使用 DSL 渲染
    if (this.props.dslRuntime && appointment.type) {
      try {
        const rendered = this.props.dslRuntime.render(appointment, appointment.type);
        return this.renderAppointmentWithDSL(appointment, rendered);
      } catch (e) {
        console.error('Failed to render appointment with DSL:', e);
      }
    }

    // 否则使用默认渲染
    return this.renderAppointmentDefault(appointment);
  }

  /**
   * 使用 DSL 渲染预约
   */
  private renderAppointmentWithDSL(
    appointment: Appointment,
    rendered: RenderedAppointment
  ): string {
    const startTime = formatTime(new Date(appointment.startTime));
    const icon = rendered.icon ? `<span class="appointment-icon">${rendered.icon}</span>` : '';
    
    return `
      <div 
        class="month-appointment appointment-block" 
        style="background-color: ${rendered.color}; color: white;"
        data-appointment-id="${appointment.id}"
      >
        ${icon}
        <div class="appointment-title">${rendered.title}</div>
        ${rendered.description ? `<div class="appointment-description">${rendered.description}</div>` : ''}
        <div class="appointment-time">${startTime}</div>
      </div>
    `;
  }

  /**
   * 默认渲染预约
   */
  private renderAppointmentDefault(appointment: Appointment): string {
    const startTime = formatTime(new Date(appointment.startTime));
    const color = appointment.color || '#4285f4';
    
    return `
      <div 
        class="month-appointment appointment-block" 
        style="background-color: ${color}; color: white;"
        data-appointment-id="${appointment.id}"
      >
        <div class="appointment-title">${appointment.title}</div>
        ${appointment.description ? `<div class="appointment-description">${appointment.description}</div>` : ''}
        <div class="appointment-time">${startTime}</div>
      </div>
    `;
  }

  /**
   * 附加事件监听器
   */
  private attachEventListeners(): void {
    // 工具栏按钮
    const prevBtn = this.shadowRoot.querySelector('.prev-month');
    const nextBtn = this.shadowRoot.querySelector('.next-month');
    const todayBtn = this.shadowRoot.querySelector('.today-btn');
    const viewBtns = this.shadowRoot.querySelectorAll('[data-view]');

    prevBtn?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.render();
    });

    nextBtn?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.render();
    });

    todayBtn?.addEventListener('click', () => {
      this.currentDate = new Date();
      this.render();
    });

    viewBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = (e.target as HTMLElement).getAttribute('data-view') as ViewType;
        this.currentView = view;
        this.render();
        this.attachEventListeners();
      });
    });

    // 预约点击事件
    const appointmentBlocks = this.shadowRoot.querySelectorAll('.appointment-block');
    appointmentBlocks.forEach(block => {
      block.addEventListener('click', (e) => {
        const id = (e.target as HTMLElement).closest('.appointment-block')?.getAttribute('data-appointment-id');
        if (id && this.props.onAppointmentUpdate) {
          const appointment = this.props.appointments.find(apt => apt.id === id);
          if (appointment) {
            this.props.onAppointmentUpdate(id, appointment);
          }
        }
      });
    });
  }
}

// 注册自定义元素
if (!customElements.get('wsx-calendar')) {
  customElements.define('wsx-calendar', Calendar);
}

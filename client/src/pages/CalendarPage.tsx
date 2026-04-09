import { useMemo } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import type { EventContentArg } from '@fullcalendar/core'
import type { CalendarItem } from '../types'

type Props = {
  selectedDate: string
  calendarItems: CalendarItem[]
  newCalendarTitle: string
  editingCalendarItemId: string | null
  editingCalendarItemTitle: string
  editingCalendarItemDate: string
  onSelectDate: (date: string) => void
  onChangeNewCalendarTitle: (value: string) => void
  onAddCalendarItem: () => void
  onStartEditCalendarItem: (item: CalendarItem) => void
  onChangeEditCalendarItemTitle: (value: string) => void
  onChangeEditCalendarItemDate: (value: string) => void
  onSaveEditCalendarItem: (itemId: string) => void
  onCancelEditCalendarItem: () => void
  onToggleCalendarItem: (item: CalendarItem) => void
  onDeleteCalendarItem: (item: CalendarItem) => void
}

function renderEventContent(arg: EventContentArg) {
  return (
    <div className="calendar-event-content">
      <span>{arg.event.title}</span>
    </div>
  )
}

export function CalendarPage({
  selectedDate,
  calendarItems,
  newCalendarTitle,
  editingCalendarItemId,
  editingCalendarItemTitle,
  editingCalendarItemDate,
  onSelectDate,
  onChangeNewCalendarTitle,
  onAddCalendarItem,
  onStartEditCalendarItem,
  onChangeEditCalendarItemTitle,
  onChangeEditCalendarItemDate,
  onSaveEditCalendarItem,
  onCancelEditCalendarItem,
  onToggleCalendarItem,
  onDeleteCalendarItem,
}: Props) {
  const itemsForSelectedDate = useMemo(() => {
    return calendarItems.filter((item) => item.date === selectedDate)
  }, [calendarItems, selectedDate])

  const events = useMemo(() => {
    return calendarItems.map((item) => ({
      id: item.id,
      date: item.date,
      title: `${item.completed ? '✅ ' : ''}${item.title}`,
    }))
  }, [calendarItems])

  return (
    <div className="calendar-layout">
      <div className="panel-card calendar-card">
        <div className="calendar-header-row">
          <div>
            <h2>日历</h2>
            <p>点击某一天，在右侧添加、编辑、删除和勾选该日期的事项。</p>
          </div>
          <div className="calendar-selected-date">当前日期：{selectedDate}</div>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          height="auto"
          fixedWeekCount={false}
          events={events}
          dateClick={(arg: DateClickArg) => onSelectDate(arg.dateStr)}
          eventClick={(arg) => onSelectDate(arg.event.startStr.slice(0, 10))}
          eventContent={renderEventContent}
        />
      </div>

      <div className="panel-card calendar-side-card">
        <h3>{selectedDate} 的事项</h3>
        <div className="input-row">
          <input
            className="text-input"
            placeholder="为当前日期新增一条事项..."
            value={newCalendarTitle}
            onChange={(e) => onChangeNewCalendarTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onAddCalendarItem()
              }
            }}
          />
          <button type="button" className="primary-button" onClick={onAddCalendarItem}>
            添加
          </button>
        </div>

        <div className="calendar-item-list">
          {itemsForSelectedDate.length === 0 ? (
            <p>这一天还没有事项。</p>
          ) : (
            itemsForSelectedDate.map((item) => {
              const isEditing = editingCalendarItemId === item.id

              return (
                <div key={item.id} className="calendar-item-row">
                  <div className="calendar-item-main">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => onToggleCalendarItem(item)}
                    />

                    {isEditing ? (
                      <div className="calendar-edit-block">
                        <input
                          className="inline-input"
                          value={editingCalendarItemTitle}
                          onChange={(e) => onChangeEditCalendarItemTitle(e.target.value)}
                        />
                        <input
                          className="inline-input date-input"
                          type="date"
                          value={editingCalendarItemDate}
                          onChange={(e) => onChangeEditCalendarItemDate(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="calendar-item-texts">
                        <span className={item.completed ? 'completed-text' : ''}>{item.title}</span>
                        <small>{item.date}</small>
                      </div>
                    )}
                  </div>

                  <div className="calendar-item-controls">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => onSaveEditCalendarItem(item.id)}
                        >
                          保存
                        </button>
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={onCancelEditCalendarItem}
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => onStartEditCalendarItem(item)}
                      >
                        编辑
                      </button>
                    )}

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => onDeleteCalendarItem(item)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

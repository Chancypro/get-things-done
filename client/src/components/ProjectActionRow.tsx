import type { ReactNode } from 'react'
import { getProjectColorStyle } from '../lib/projectColors'
import type { ProjectAction, SyncTarget } from '../types'

type Props = {
  action: ProjectAction
  dragHandle?: ReactNode
  isEditing: boolean
  editingTitle: string
  sourceProjectTitle?: string
  projectColor?: string
  projectColorIndex: number
  showSyncControls: boolean
  showDelete: boolean
  onStartEdit: () => void
  onChangeEdit: (value: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onToggle: () => void
  onToggleStar: () => void
  onDelete?: () => void
  onToggleSync?: (target: SyncTarget) => void
}

export function ProjectActionRow({
  action,
  dragHandle,
  isEditing,
  editingTitle,
  sourceProjectTitle,
  projectColor,
  projectColorIndex,
  showSyncControls,
  showDelete,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onToggle,
  onToggleStar,
  onDelete,
  onToggleSync,
}: Props) {
  return (
    <div
      className={`project-action-row project-color-${projectColorIndex % 8} ${
        action.starred ? 'starred-action' : ''
      }`}
      style={getProjectColorStyle({ color: projectColor, colorIndex: projectColorIndex })}
    >
      <div className="project-action-top">
        <div className="project-action-left">
          {dragHandle}
          <input type="checkbox" checked={action.completed} onChange={onToggle} />
          <button
            type="button"
            className={`star-button ${action.starred ? 'active' : ''}`}
            title={action.starred ? '取消重点标记' : '标记为重点动作'}
            aria-label={action.starred ? '取消重点标记' : '标记为重点动作'}
            onClick={onToggleStar}
          >
            {action.starred ? '★' : '☆'}
          </button>
          <div className="project-action-texts">
            {sourceProjectTitle && <div className="source-tag">来自项目：{sourceProjectTitle}</div>}

            {isEditing ? (
              <input
                className="inline-input"
                value={editingTitle}
                onChange={(e) => onChangeEdit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSaveEdit()
                  }
                }}
              />
            ) : (
              <span className={`action-title ${action.completed ? 'completed-text' : ''}`}>
                {action.title}
              </span>
            )}
          </div>
        </div>

        <div className="project-action-controls">
          {isEditing ? (
            <>
              <button type="button" className="secondary-button" onClick={onSaveEdit}>
                保存
              </button>
              <button type="button" className="secondary-button" onClick={onCancelEdit}>
                取消
              </button>
            </>
          ) : (
            <button type="button" className="secondary-button" onClick={onStartEdit}>
              编辑
            </button>
          )}

          {showDelete && onDelete && (
            <button type="button" className="danger-button" onClick={onDelete}>
              删除动作
            </button>
          )}
        </div>
      </div>

      {showSyncControls && onToggleSync && (
        <div className="sync-row">
          <label className="sync-chip">
            <input
              type="checkbox"
              checked={action.syncTargets.next}
              onChange={() => onToggleSync('next')}
            />
            Next
          </label>
          <label className="sync-chip">
            <input
              type="checkbox"
              checked={action.syncTargets.someday}
              onChange={() => onToggleSync('someday')}
            />
            Someday
          </label>
          <label className="sync-chip">
            <input
              type="checkbox"
              checked={action.syncTargets.waiting}
              onChange={() => onToggleSync('waiting')}
            />
            Waiting
          </label>
        </div>
      )}
    </div>
  )
}

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { StandaloneAction, StandaloneModule } from '../types'
import { MODULE_LABELS, STANDALONE_MODULES } from '../types'

type Props = {
  action: StandaloneAction
  isEditing: boolean
  editingTitle: string
  canConvertToProject: boolean
  onStartEdit: (action: StandaloneAction) => void
  onChangeEdit: (value: string) => void
  onSaveEdit: (actionId: string) => void
  onCancelEdit: () => void
  onToggle: (action: StandaloneAction) => void
  onToggleStar: (action: StandaloneAction) => void
  onMove: (actionId: string, targetModule: StandaloneModule) => void
  onDelete: (action: StandaloneAction) => void
  onConvertToProject: (action: StandaloneAction) => void
}

export function SortableStandaloneActionItem({
  action,
  isEditing,
  editingTitle,
  canConvertToProject,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onToggle,
  onToggleStar,
  onMove,
  onDelete,
  onConvertToProject,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: action.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`action-item ${action.starred ? 'starred-action' : ''} ${
        isDragging ? 'dragging' : ''
      }`}
    >
      <button
        type="button"
        className="drag-handle"
        title="拖拽排序"
        {...attributes}
        {...listeners}
      >
        ☰
      </button>

      <input
        type="checkbox"
        checked={action.completed}
        onChange={() => onToggle(action)}
      />

      <button
        type="button"
        className={`star-button ${action.starred ? 'active' : ''}`}
        title={action.starred ? '取消重点标记' : '标记为重点动作'}
        aria-label={action.starred ? '取消重点标记' : '标记为重点动作'}
        onClick={() => onToggleStar(action)}
      >
        {action.starred ? '★' : '☆'}
      </button>

      <div className="action-main">
        {isEditing ? (
          <input
            className="inline-input"
            value={editingTitle}
            onChange={(e) => onChangeEdit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSaveEdit(action.id)
              }
            }}
          />
        ) : (
          <span className={`action-title ${action.completed ? 'completed-text' : ''}`}>
            {action.title}
          </span>
        )}
      </div>

      <div className="action-controls">
        {isEditing ? (
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => onSaveEdit(action.id)}
            >
              保存
            </button>
            <button type="button" className="secondary-button" onClick={onCancelEdit}>
              取消
            </button>
          </>
        ) : (
          <button
            type="button"
            className="secondary-button"
            onClick={() => onStartEdit(action)}
          >
            编辑
          </button>
        )}

        {canConvertToProject && !isEditing && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => onConvertToProject(action)}
          >
            转为项目
          </button>
        )}

        <select
          className="small-select"
          defaultValue=""
          onChange={(e) => {
            const target = e.target.value as StandaloneModule | ''
            if (!target) return
            onMove(action.id, target)
            e.currentTarget.value = ''
          }}
        >
          <option value="">移动到...</option>
          {STANDALONE_MODULES.filter((moduleKey) => moduleKey !== action.module).map(
            (moduleKey) => (
              <option key={moduleKey} value={moduleKey}>
                {MODULE_LABELS[moduleKey]}
              </option>
            )
          )}
        </select>

        <button type="button" className="danger-button" onClick={() => onDelete(action)}>
          彻底删除
        </button>
      </div>
    </div>
  )
}

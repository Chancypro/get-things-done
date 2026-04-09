import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Project } from '../types'

type ProjectCardContentProps = {
  project: Project
  dragHandle?: ReactNode
  isEditing: boolean
  editingTitle: string
  showAddAction: boolean
  newActionTitle: string
  statusButtonLabel: string
  onStartEdit: () => void
  onChangeEdit: (value: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onToggleStatus: () => void
  onDelete: () => void
  onChangeNewActionTitle: (value: string) => void
  onAddAction: () => void
  children: ReactNode
}

export function ProjectCardContent({
  project,
  dragHandle,
  isEditing,
  editingTitle,
  showAddAction,
  newActionTitle,
  statusButtonLabel,
  onStartEdit,
  onChangeEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleStatus,
  onDelete,
  onChangeNewActionTitle,
  onAddAction,
  children,
}: ProjectCardContentProps) {
  return (
    <div className="project-card">
      <div className="project-header">
        <div className="project-title-row">
          {dragHandle}
          <div className="project-title-block">
            {isEditing ? (
              <input
                className="inline-input project-title-input"
                value={editingTitle}
                onChange={(e) => onChangeEdit(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSaveEdit()
                  }
                }}
              />
            ) : (
              <h3>{project.title}</h3>
            )}
            <p>
              {project.actions.length} 个动作 ·{' '}
              {project.status === 'active' ? 'Project-List' : 'Trash'}
            </p>
          </div>
        </div>

        <div className="project-header-controls">
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
              编辑项目名
            </button>
          )}

          <button type="button" className="secondary-button" onClick={onToggleStatus}>
            {statusButtonLabel}
          </button>

          <button type="button" className="danger-button" onClick={onDelete}>
            彻底删除项目
          </button>
        </div>
      </div>

      {showAddAction && (
        <div className="project-add-row">
          <input
            className="text-input"
            placeholder="为该项目新增一个动作..."
            value={newActionTitle}
            onChange={(e) => onChangeNewActionTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onAddAction()
              }
            }}
          />
          <button type="button" className="primary-button" onClick={onAddAction}>
            添加动作
          </button>
        </div>
      )}

      <div className="project-body">{children}</div>
    </div>
  )
}

type SortableProjectCardProps = Omit<ProjectCardContentProps, 'dragHandle'>

export function SortableProjectCard(props: SortableProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'dragging-wrapper' : ''}>
      <ProjectCardContent
        {...props}
        dragHandle={
          <button
            type="button"
            className="drag-handle project-drag-handle"
            title="拖拽排序"
            {...attributes}
            {...listeners}
          >
            ☰
          </button>
        }
      />
    </div>
  )
}

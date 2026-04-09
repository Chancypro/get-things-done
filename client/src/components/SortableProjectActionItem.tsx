import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ProjectAction, SyncTarget } from '../types'
import { ProjectActionRow } from './ProjectActionRow'

type Props = {
  action: ProjectAction
  isEditing: boolean
  editingTitle: string
  onStartEdit: () => void
  onChangeEdit: (value: string) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onToggle: () => void
  onDelete: () => void
  onToggleSync: (target: SyncTarget) => void
}

export function SortableProjectActionItem(props: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.action.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'dragging-wrapper' : ''}>
      <ProjectActionRow
        action={props.action}
        isEditing={props.isEditing}
        editingTitle={props.editingTitle}
        showSyncControls={true}
        showDelete={true}
        onStartEdit={props.onStartEdit}
        onChangeEdit={props.onChangeEdit}
        onSaveEdit={props.onSaveEdit}
        onCancelEdit={props.onCancelEdit}
        onToggle={props.onToggle}
        onDelete={props.onDelete}
        onToggleSync={props.onToggleSync}
        dragHandle={
          <button
            type="button"
            className="drag-handle"
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

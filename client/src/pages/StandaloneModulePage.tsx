import type { ReactNode } from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ProjectActionRow } from '../components/ProjectActionRow'
import { SortableStandaloneActionItem } from '../components/SortableStandaloneActionItem'
import type {
  ProjectAction,
  StandaloneAction,
  StandaloneModule,
} from '../types'

type SyncedProjectAction = {
  projectId: string
  projectTitle: string
  action: ProjectAction
}

type Props = {
  moduleKey: StandaloneModule
  title: string
  description: string
  actions: StandaloneAction[]
  syncedProjectActions: SyncedProjectAction[]
  sensors: any
  newInboxTitle: string
  submitting: boolean
  editingStandaloneId: string | null
  editingStandaloneTitle: string
  editingProjectActionKey: string | null
  editingProjectActionTitle: string
  showTrashProjectsSection?: ReactNode
  onChangeNewInboxTitle: (value: string) => void
  onAddInboxAction: () => void
  onStandaloneDragEnd: (moduleKey: StandaloneModule, event: DragEndEvent) => void
  onStartEditStandaloneAction: (action: StandaloneAction) => void
  onChangeEditStandaloneTitle: (value: string) => void
  onSaveEditStandaloneAction: (actionId: string) => void
  onCancelEditStandaloneAction: () => void
  onToggleStandaloneAction: (action: StandaloneAction) => void
  onMoveStandaloneAction: (actionId: string, targetModule: StandaloneModule) => void
  onDeleteStandaloneAction: (action: StandaloneAction) => void
  onConvertActionToProject: (action: StandaloneAction) => void
  onStartEditProjectAction: (projectId: string, action: ProjectAction) => void
  onChangeEditProjectActionTitle: (value: string) => void
  onSaveEditProjectAction: (projectId: string, actionId: string) => void
  onCancelEditProjectAction: () => void
  onToggleProjectAction: (projectId: string, action: ProjectAction) => void
  getProjectActionEditKey: (projectId: string, actionId: string) => string
}

export function StandaloneModulePage({
  moduleKey,
  title,
  description,
  actions,
  syncedProjectActions,
  sensors,
  newInboxTitle,
  submitting,
  editingStandaloneId,
  editingStandaloneTitle,
  editingProjectActionKey,
  editingProjectActionTitle,
  showTrashProjectsSection,
  onChangeNewInboxTitle,
  onAddInboxAction,
  onStandaloneDragEnd,
  onStartEditStandaloneAction,
  onChangeEditStandaloneTitle,
  onSaveEditStandaloneAction,
  onCancelEditStandaloneAction,
  onToggleStandaloneAction,
  onMoveStandaloneAction,
  onDeleteStandaloneAction,
  onConvertActionToProject,
  onStartEditProjectAction,
  onChangeEditProjectActionTitle,
  onSaveEditProjectAction,
  onCancelEditProjectAction,
  onToggleProjectAction,
  getProjectActionEditKey,
}: Props) {
  return (
    <>
      {moduleKey === 'inbox' && (
        <div className="panel-card">
          <h2>In-Box</h2>
          <p>{description}</p>

          <div className="input-row">
            <input
              className="text-input"
              type="text"
              placeholder="输入一条新事项..."
              value={newInboxTitle}
              onChange={(e) => onChangeNewInboxTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onAddInboxAction()
                }
              }}
            />
            <button className="primary-button" onClick={onAddInboxAction} disabled={submitting}>
              {submitting ? '添加中...' : '添加'}
            </button>
          </div>
        </div>
      )}

      <div className="panel-card">
        <h3>{title}</h3>
        <p className="module-summary">
          共 {actions.length} 条普通动作。支持拖拽排序、直接编辑、移动模块、彻底删除。
        </p>

        {actions.length === 0 ? (
          <p>当前还没有内容。</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event: DragEndEvent) => onStandaloneDragEnd(moduleKey, event)}
          >
            <SortableContext
              items={actions.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="action-list">
                {actions.map((action) => (
                  <SortableStandaloneActionItem
                    key={action.id}
                    action={action}
                    isEditing={editingStandaloneId === action.id}
                    editingTitle={editingStandaloneTitle}
                    canConvertToProject={moduleKey === 'inbox'}
                    onStartEdit={onStartEditStandaloneAction}
                    onChangeEdit={onChangeEditStandaloneTitle}
                    onSaveEdit={onSaveEditStandaloneAction}
                    onCancelEdit={onCancelEditStandaloneAction}
                    onToggle={onToggleStandaloneAction}
                    onMove={onMoveStandaloneAction}
                    onDelete={onDeleteStandaloneAction}
                    onConvertToProject={onConvertActionToProject}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {syncedProjectActions.length > 0 && (
        <div className="panel-card">
          <h3>同步显示的项目动作</h3>
          <p className="module-summary">下面这些动作来自 Project-List 中的项目，由同步勾选控制显示。</p>

          <div className="project-action-list">
            {syncedProjectActions.map(({ projectId, projectTitle, action }) => {
              const editKey = getProjectActionEditKey(projectId, action.id)

              return (
                <ProjectActionRow
                  key={editKey}
                  action={action}
                  sourceProjectTitle={projectTitle}
                  isEditing={editingProjectActionKey === editKey}
                  editingTitle={editingProjectActionTitle}
                  showSyncControls={false}
                  showDelete={false}
                  onStartEdit={() => onStartEditProjectAction(projectId, action)}
                  onChangeEdit={onChangeEditProjectActionTitle}
                  onSaveEdit={() => onSaveEditProjectAction(projectId, action.id)}
                  onCancelEdit={onCancelEditProjectAction}
                  onToggle={() => onToggleProjectAction(projectId, action)}
                />
              )
            })}
          </div>
        </div>
      )}

      {showTrashProjectsSection}
    </>
  )
}

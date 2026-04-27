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
  projectColor: string
  projectColorIndex: number
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
  completedActionsExpanded: boolean
  syncedCompletedActionsExpanded: boolean
  showTrashProjectsSection?: ReactNode
  onToggleCompletedActionsExpanded: () => void
  onToggleSyncedCompletedActionsExpanded: () => void
  onChangeNewInboxTitle: (value: string) => void
  onAddInboxAction: () => void
  onStandaloneDragEnd: (
    moduleKey: StandaloneModule,
    groupActions: StandaloneAction[],
    event: DragEndEvent
  ) => void
  onStartEditStandaloneAction: (action: StandaloneAction) => void
  onChangeEditStandaloneTitle: (value: string) => void
  onSaveEditStandaloneAction: (actionId: string) => void
  onCancelEditStandaloneAction: () => void
  onToggleStandaloneAction: (action: StandaloneAction) => void
  onToggleStandaloneActionStar: (action: StandaloneAction) => void
  onMoveStandaloneAction: (actionId: string, targetModule: StandaloneModule) => void
  onDeleteStandaloneAction: (action: StandaloneAction) => void
  onConvertActionToProject: (action: StandaloneAction) => void
  onStartEditProjectAction: (projectId: string, action: ProjectAction) => void
  onChangeEditProjectActionTitle: (value: string) => void
  onSaveEditProjectAction: (projectId: string, actionId: string) => void
  onCancelEditProjectAction: () => void
  onToggleProjectAction: (projectId: string, action: ProjectAction) => void
  onToggleProjectActionStar: (projectId: string, action: ProjectAction) => void
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
  completedActionsExpanded,
  syncedCompletedActionsExpanded,
  showTrashProjectsSection,
  onToggleCompletedActionsExpanded,
  onToggleSyncedCompletedActionsExpanded,
  onChangeNewInboxTitle,
  onAddInboxAction,
  onStandaloneDragEnd,
  onStartEditStandaloneAction,
  onChangeEditStandaloneTitle,
  onSaveEditStandaloneAction,
  onCancelEditStandaloneAction,
  onToggleStandaloneAction,
  onToggleStandaloneActionStar,
  onMoveStandaloneAction,
  onDeleteStandaloneAction,
  onConvertActionToProject,
  onStartEditProjectAction,
  onChangeEditProjectActionTitle,
  onSaveEditProjectAction,
  onCancelEditProjectAction,
  onToggleProjectAction,
  onToggleProjectActionStar,
  getProjectActionEditKey,
}: Props) {
  const incompleteActions = actions.filter((action) => !action.completed)
  const completedActions = actions.filter((action) => action.completed)
  const incompleteSyncedActions = syncedProjectActions.filter(({ action }) => !action.completed)
  const completedSyncedActions = syncedProjectActions.filter(({ action }) => action.completed)

  function renderStandaloneActionGroup(groupActions: StandaloneAction[]) {
    if (groupActions.length === 0) return null

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event: DragEndEvent) =>
          onStandaloneDragEnd(moduleKey, groupActions, event)
        }
      >
        <SortableContext
          items={groupActions.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="action-list">
            {groupActions.map((action) => (
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
                onToggleStar={onToggleStandaloneActionStar}
                onMove={onMoveStandaloneAction}
                onDelete={onDeleteStandaloneAction}
                onConvertToProject={onConvertActionToProject}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

  function renderSyncedActions(groupActions: SyncedProjectAction[]) {
    if (groupActions.length === 0) return null

    return (
      <div className="project-action-list">
        {groupActions.map(({ projectId, projectTitle, projectColor, projectColorIndex, action }) => {
          const editKey = getProjectActionEditKey(projectId, action.id)

          return (
            <ProjectActionRow
              key={editKey}
              action={action}
              sourceProjectTitle={projectTitle}
              projectColor={projectColor}
              projectColorIndex={projectColorIndex}
              isEditing={editingProjectActionKey === editKey}
              editingTitle={editingProjectActionTitle}
              showSyncControls={false}
              showDelete={false}
              onStartEdit={() => onStartEditProjectAction(projectId, action)}
              onChangeEdit={onChangeEditProjectActionTitle}
              onSaveEdit={() => onSaveEditProjectAction(projectId, action.id)}
              onCancelEdit={onCancelEditProjectAction}
              onToggle={() => onToggleProjectAction(projectId, action)}
              onToggleStar={() => onToggleProjectActionStar(projectId, action)}
            />
          )
        })}
      </div>
    )
  }

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
          共 {actions.length} 条普通动作，其中已完成 {completedActions.length} 条。支持拖拽排序、直接编辑、移动模块、彻底删除。
        </p>

        {actions.length === 0 ? (
          <p>当前还没有内容。</p>
        ) : (
          <>
            {incompleteActions.length > 0 ? (
              renderStandaloneActionGroup(incompleteActions)
            ) : (
              <p>当前没有未完成动作。</p>
            )}

            {completedActions.length > 0 && (
              <div className="completed-actions-block">
                <button
                  type="button"
                  className="secondary-button completed-toggle-button"
                  onClick={onToggleCompletedActionsExpanded}
                >
                  {completedActionsExpanded
                    ? '隐藏已完成动作'
                    : `展开隐藏动作（${completedActions.length}）`}
                </button>

                {completedActionsExpanded && renderStandaloneActionGroup(completedActions)}
              </div>
            )}
          </>
        )}
      </div>

      {syncedProjectActions.length > 0 && (
        <div className="panel-card">
          <h3>同步显示的项目动作</h3>
          <p className="module-summary">
            下面这些动作来自 Project-List 中的项目，由同步勾选控制显示。已完成 {completedSyncedActions.length} 条。
          </p>

          {incompleteSyncedActions.length > 0 ? (
            renderSyncedActions(incompleteSyncedActions)
          ) : (
            <p>当前没有未完成的同步项目动作。</p>
          )}

          {completedSyncedActions.length > 0 && (
            <div className="completed-actions-block">
              <button
                type="button"
                className="secondary-button completed-toggle-button"
                onClick={onToggleSyncedCompletedActionsExpanded}
              >
                {syncedCompletedActionsExpanded
                  ? '隐藏已完成动作'
                  : `展开隐藏动作（${completedSyncedActions.length}）`}
              </button>

              {syncedCompletedActionsExpanded && renderSyncedActions(completedSyncedActions)}
            </div>
          )}
        </div>
      )}

      {showTrashProjectsSection}
    </>
  )
}

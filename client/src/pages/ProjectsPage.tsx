import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ProjectCardContent, SortableProjectCard } from '../components/ProjectCard'
import { ProjectActionRow } from '../components/ProjectActionRow'
import { SortableProjectActionItem } from '../components/SortableProjectActionItem'
import type { Project, ProjectAction, ProjectStatus, SyncTarget } from '../types'

type Props = {
  activeProjects: Project[]
  sensors: any
  editingProjectId: string | null
  editingProjectTitle: string
  editingProjectActionKey: string | null
  editingProjectActionTitle: string
  newProjectActionTitles: Record<string, string>
  expandedCompletedProjectIds: Record<string, boolean>
  getProjectActionEditKey: (projectId: string, actionId: string) => string
  onProjectDragEnd: (status: ProjectStatus, event: DragEndEvent) => void
  onStartEditProject: (project: Project) => void
  onChangeEditProjectTitle: (value: string) => void
  onSaveEditProject: (projectId: string) => void
  onCancelEditProject: () => void
  onToggleProjectStatus: (project: Project, status: ProjectStatus) => void
  onChangeProjectColor: (project: Project, color: string) => void
  onDeleteProject: (project: Project) => void
  onChangeNewProjectActionTitle: (projectId: string, value: string) => void
  onAddProjectAction: (projectId: string) => void
  onProjectActionDragEnd: (
    projectId: string,
    groupActions: ProjectAction[],
    event: DragEndEvent
  ) => void
  onToggleCompletedProjectActions: (projectId: string) => void
  onStartEditProjectAction: (projectId: string, action: ProjectAction) => void
  onChangeEditProjectActionTitle: (value: string) => void
  onSaveEditProjectAction: (projectId: string, actionId: string) => void
  onCancelEditProjectAction: () => void
  onToggleProjectAction: (projectId: string, action: ProjectAction) => void
  onToggleProjectActionStar: (projectId: string, action: ProjectAction) => void
  onDeleteProjectAction: (projectId: string, action: ProjectAction) => void
  onToggleProjectActionSyncTarget: (
    projectId: string,
    action: ProjectAction,
    target: SyncTarget
  ) => void
}

export function ProjectsPage({
  activeProjects,
  sensors,
  editingProjectId,
  editingProjectTitle,
  editingProjectActionKey,
  editingProjectActionTitle,
  newProjectActionTitles,
  expandedCompletedProjectIds,
  getProjectActionEditKey,
  onProjectDragEnd,
  onStartEditProject,
  onChangeEditProjectTitle,
  onSaveEditProject,
  onCancelEditProject,
  onToggleProjectStatus,
  onChangeProjectColor,
  onDeleteProject,
  onChangeNewProjectActionTitle,
  onAddProjectAction,
  onProjectActionDragEnd,
  onToggleCompletedProjectActions,
  onStartEditProjectAction,
  onChangeEditProjectActionTitle,
  onSaveEditProjectAction,
  onCancelEditProjectAction,
  onToggleProjectAction,
  onToggleProjectActionStar,
  onDeleteProjectAction,
  onToggleProjectActionSyncTarget,
}: Props) {
  function renderProjectActionGroup(project: Project, groupActions: ProjectAction[]) {
    if (groupActions.length === 0) return null

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event: DragEndEvent) =>
          onProjectActionDragEnd(project.id, groupActions, event)
        }
      >
        <SortableContext
          items={groupActions.map((action) => action.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="project-action-list">
            {groupActions.map((action) => {
              const editKey = getProjectActionEditKey(project.id, action.id)

              return (
                <SortableProjectActionItem
                  key={action.id}
                  action={action}
                  projectColor={project.color}
                  projectColorIndex={project.colorIndex}
                  isEditing={editingProjectActionKey === editKey}
                  editingTitle={editingProjectActionTitle}
                  onStartEdit={() => onStartEditProjectAction(project.id, action)}
                  onChangeEdit={onChangeEditProjectActionTitle}
                  onSaveEdit={() => onSaveEditProjectAction(project.id, action.id)}
                  onCancelEdit={onCancelEditProjectAction}
                  onToggle={() => onToggleProjectAction(project.id, action)}
                  onToggleStar={() => onToggleProjectActionStar(project.id, action)}
                  onDelete={() => onDeleteProjectAction(project.id, action)}
                  onToggleSync={(target) =>
                    onToggleProjectActionSyncTarget(project.id, action, target)
                  }
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

  function renderProjectActions(project: Project) {
    const incompleteActions = project.actions.filter((action) => !action.completed)
    const completedActions = project.actions.filter((action) => action.completed)
    const completedExpanded = expandedCompletedProjectIds[project.id] ?? false

    if (project.actions.length === 0) {
      return <p>当前还没有动作，请先新增一个动作。</p>
    }

    return (
      <>
        {incompleteActions.length > 0 ? (
          renderProjectActionGroup(project, incompleteActions)
        ) : (
          <p>当前没有未完成动作。</p>
        )}

        {completedActions.length > 0 && (
          <div className="completed-actions-block">
            <button
              type="button"
              className="secondary-button completed-toggle-button"
              onClick={() => onToggleCompletedProjectActions(project.id)}
            >
              {completedExpanded
                ? '隐藏已完成动作'
                : `展开隐藏动作（${completedActions.length}）`}
            </button>

            {completedExpanded && renderProjectActionGroup(project, completedActions)}
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div className="panel-card">
        <h2>Project-List</h2>
        <p>这里存放需要多步完成的事项。可拖拽排序项目，也可在项目内部维护动作列表。</p>
        <p>把 In-Box 中的某条事项点击“转为项目”，它就会出现在这里。</p>
      </div>

      <div className="panel-card">
        <h3>项目列表</h3>
        <p className="module-summary">
          共 {activeProjects.length} 个项目。支持拖拽排序、编辑项目名、移到 Trash、彻底删除。
        </p>

        {activeProjects.length === 0 ? (
          <p>当前还没有项目。先去 In-Box 把一条事项转为项目。</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event: DragEndEvent) => onProjectDragEnd('active', event)}
          >
            <SortableContext
              items={activeProjects.map((project) => project.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="project-list">
                {activeProjects.map((project) => (
                  <SortableProjectCard
                    key={project.id}
                    project={project}
                    isEditing={editingProjectId === project.id}
                    editingTitle={editingProjectTitle}
                    showAddAction={true}
                    newActionTitle={newProjectActionTitles[project.id] ?? ''}
                    statusButtonLabel="移到 Trash"
                    onStartEdit={() => onStartEditProject(project)}
                    onChangeEdit={onChangeEditProjectTitle}
                    onSaveEdit={() => onSaveEditProject(project.id)}
                    onCancelEdit={onCancelEditProject}
                    onToggleStatus={() => onToggleProjectStatus(project, 'trash')}
                    onChangeColor={(color) => onChangeProjectColor(project, color)}
                    onDelete={() => onDeleteProject(project)}
                    onChangeNewActionTitle={(value) =>
                      onChangeNewProjectActionTitle(project.id, value)
                    }
                    onAddAction={() => onAddProjectAction(project.id)}
                  >
                    {renderProjectActions(project)}
                  </SortableProjectCard>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </>
  )
}

type TrashProjectsSectionProps = {
  trashProjects: Project[]
  editingProjectId: string | null
  editingProjectTitle: string
  editingProjectActionKey: string | null
  editingProjectActionTitle: string
  expandedCompletedProjectIds: Record<string, boolean>
  getProjectActionEditKey: (projectId: string, actionId: string) => string
  onStartEditProject: (project: Project) => void
  onChangeEditProjectTitle: (value: string) => void
  onSaveEditProject: (projectId: string) => void
  onCancelEditProject: () => void
  onToggleProjectStatus: (project: Project, status: ProjectStatus) => void
  onChangeProjectColor: (project: Project, color: string) => void
  onDeleteProject: (project: Project) => void
  onToggleCompletedProjectActions: (projectId: string) => void
  onStartEditProjectAction: (projectId: string, action: ProjectAction) => void
  onChangeEditProjectActionTitle: (value: string) => void
  onSaveEditProjectAction: (projectId: string, actionId: string) => void
  onCancelEditProjectAction: () => void
  onToggleProjectAction: (projectId: string, action: ProjectAction) => void
  onToggleProjectActionStar: (projectId: string, action: ProjectAction) => void
  onDeleteProjectAction: (projectId: string, action: ProjectAction) => void
  onToggleProjectActionSyncTarget: (
    projectId: string,
    action: ProjectAction,
    target: SyncTarget
  ) => void
}

export function TrashProjectsSection({
  trashProjects,
  editingProjectId,
  editingProjectTitle,
  editingProjectActionKey,
  editingProjectActionTitle,
  expandedCompletedProjectIds,
  getProjectActionEditKey,
  onStartEditProject,
  onChangeEditProjectTitle,
  onSaveEditProject,
  onCancelEditProject,
  onToggleProjectStatus,
  onChangeProjectColor,
  onDeleteProject,
  onToggleCompletedProjectActions,
  onStartEditProjectAction,
  onChangeEditProjectActionTitle,
  onSaveEditProjectAction,
  onCancelEditProjectAction,
  onToggleProjectAction,
  onToggleProjectActionStar,
  onDeleteProjectAction,
  onToggleProjectActionSyncTarget,
}: TrashProjectsSectionProps) {
  function renderTrashProjectActions(project: Project) {
    const incompleteActions = project.actions.filter((action) => !action.completed)
    const completedActions = project.actions.filter((action) => action.completed)
    const completedExpanded = expandedCompletedProjectIds[project.id] ?? false

    if (project.actions.length === 0) {
      return <p>当前还没有动作。</p>
    }

    return (
      <>
        {incompleteActions.length > 0 ? (
          <div className="project-action-list">
            {incompleteActions.map((action) =>
              renderTrashProjectAction(project, action)
            )}
          </div>
        ) : (
          <p>当前没有未完成动作。</p>
        )}

        {completedActions.length > 0 && (
          <div className="completed-actions-block">
            <button
              type="button"
              className="secondary-button completed-toggle-button"
              onClick={() => onToggleCompletedProjectActions(project.id)}
            >
              {completedExpanded
                ? '隐藏已完成动作'
                : `展开隐藏动作（${completedActions.length}）`}
            </button>

            {completedExpanded && (
              <div className="project-action-list">
                {completedActions.map((action) =>
                  renderTrashProjectAction(project, action)
                )}
              </div>
            )}
          </div>
        )}
      </>
    )
  }

  function renderTrashProjectAction(project: Project, action: ProjectAction) {
    const editKey = getProjectActionEditKey(project.id, action.id)

    return (
      <ProjectActionRow
        key={action.id}
        action={action}
        projectColor={project.color}
        projectColorIndex={project.colorIndex}
        isEditing={editingProjectActionKey === editKey}
        editingTitle={editingProjectActionTitle}
        showSyncControls={true}
        showDelete={true}
        onStartEdit={() => onStartEditProjectAction(project.id, action)}
        onChangeEdit={onChangeEditProjectActionTitle}
        onSaveEdit={() => onSaveEditProjectAction(project.id, action.id)}
        onCancelEdit={onCancelEditProjectAction}
        onToggle={() => onToggleProjectAction(project.id, action)}
        onToggleStar={() => onToggleProjectActionStar(project.id, action)}
        onDelete={() => onDeleteProjectAction(project.id, action)}
        onToggleSync={(target) =>
          onToggleProjectActionSyncTarget(project.id, action, target)
        }
      />
    )
  }

  return (
    <div className="panel-card">
      <h3>Trash 中的项目</h3>
      <p className="module-summary">
        共 {trashProjects.length} 个项目。可恢复到 Project-List，也可彻底删除。
      </p>

      {trashProjects.length === 0 ? (
        <p>Trash 中当前还没有项目。</p>
      ) : (
        <div className="project-list">
          {trashProjects.map((project) => (
            <ProjectCardContent
              key={project.id}
              project={project}
              isEditing={editingProjectId === project.id}
              editingTitle={editingProjectTitle}
              showAddAction={false}
              newActionTitle=""
              statusButtonLabel="恢复到 Project-List"
              onStartEdit={() => onStartEditProject(project)}
              onChangeEdit={onChangeEditProjectTitle}
              onSaveEdit={() => onSaveEditProject(project.id)}
              onCancelEdit={onCancelEditProject}
              onToggleStatus={() => onToggleProjectStatus(project, 'active')}
              onChangeColor={(color) => onChangeProjectColor(project, color)}
              onDelete={() => onDeleteProject(project)}
              onChangeNewActionTitle={() => {}}
              onAddAction={() => {}}
            >
              {renderTrashProjectActions(project)}
            </ProjectCardContent>
          ))}
        </div>
      )}
    </div>
  )
}

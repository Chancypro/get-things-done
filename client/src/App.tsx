import { useEffect, useMemo, useState } from 'react'
import { useSensor, useSensors, PointerSensor, type DragEndEvent } from '@dnd-kit/core'
import './App.css'
import { api } from './lib/api'
import { CalendarPage } from './pages/CalendarPage'
import { ProjectsPage, TrashProjectsSection } from './pages/ProjectsPage'
import { StandaloneModulePage } from './pages/StandaloneModulePage'
import {
  MODULES,
  type AppData,
  type CalendarItem,
  type ModuleKey,
  type Project,
  type ProjectAction,
  type ProjectStatus,
  type StandaloneAction,
  type StandaloneModule,
  type SyncTarget,
} from './types'

function getTodayString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function compareByOrder<T extends { order: number }>(a: T, b: T) {
  return a.order - b.order
}

function sortActionsForDisplay<T extends { completed: boolean; order: number }>(actions: T[]) {
  return [...actions].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }
    return a.order - b.order
  })
}

function reorderGroup<T extends { id: string }>(groupActions: T[], event: DragEndEvent) {
  const { active, over } = event
  if (!over || active.id === over.id) return null

  const activeId = String(active.id)
  const overId = String(over.id)
  const oldIndex = groupActions.findIndex((item) => item.id === activeId)
  const newIndex = groupActions.findIndex((item) => item.id === overId)
  if (oldIndex === -1 || newIndex === -1) return null

  const reordered = [...groupActions]
  const [moved] = reordered.splice(oldIndex, 1)
  reordered.splice(newIndex, 0, moved)

  return reordered
}

function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('inbox')
  const [data, setData] = useState<AppData | null>(null)
  const [loading, setLoading] = useState(true)

  const [newInboxTitle, setNewInboxTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [editingStandaloneId, setEditingStandaloneId] = useState<string | null>(null)
  const [editingStandaloneTitle, setEditingStandaloneTitle] = useState('')

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [editingProjectTitle, setEditingProjectTitle] = useState('')

  const [editingProjectActionKey, setEditingProjectActionKey] = useState<string | null>(null)
  const [editingProjectActionTitle, setEditingProjectActionTitle] = useState('')

  const [newProjectActionTitles, setNewProjectActionTitles] = useState<Record<string, string>>({})

  const [selectedDate, setSelectedDate] = useState(getTodayString())
  const [newCalendarTitle, setNewCalendarTitle] = useState('')
  const [editingCalendarItemId, setEditingCalendarItemId] = useState<string | null>(null)
  const [editingCalendarItemTitle, setEditingCalendarItemTitle] = useState('')
  const [editingCalendarItemDate, setEditingCalendarItemDate] = useState(getTodayString())
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [expandedStandaloneCompleted, setExpandedStandaloneCompleted] = useState<
    Partial<Record<StandaloneModule, boolean>>
  >({})
  const [expandedSyncedCompleted, setExpandedSyncedCompleted] = useState<
    Partial<Record<SyncTarget, boolean>>
  >({})
  const [expandedProjectCompleted, setExpandedProjectCompleted] = useState<
    Record<string, boolean>
  >({})

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  )

  useEffect(() => {
    void refreshData(true)
  }, [])

  async function refreshData(showLoading = false) {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const nextData = await api.getData()
      setData(nextData as AppData)
    } catch (err) {
      console.error('读取后端数据失败:', err)
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  function getStandaloneActionsByModule(moduleKey: StandaloneModule) {
    return sortActionsForDisplay(
      (data?.standaloneActions ?? []).filter((item) => item.module === moduleKey)
    )
  }

  function getProjectsByStatus(status: ProjectStatus) {
    return (data?.projects ?? [])
      .filter((project) => project.status === status)
      .sort((a, b) => a.order - b.order)
      .map((project) => ({
        ...project,
        actions: sortActionsForDisplay(project.actions),
      }))
  }

  function getProjectActionEditKey(projectId: string, actionId: string) {
    return `${projectId}:${actionId}`
  }

  function getSyncedProjectActions(target: SyncTarget) {
    return getProjectsByStatus('active').flatMap((project) =>
      sortActionsForDisplay(project.actions)
        .filter((action) => action.syncTargets[target])
        .map((action) => ({
          projectId: project.id,
          projectTitle: project.title,
          projectColorIndex: project.colorIndex,
          action,
        }))
    )
  }

  function toggleStandaloneCompleted(moduleKey: StandaloneModule) {
    setExpandedStandaloneCompleted((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }))
  }

  function toggleSyncedCompleted(target: SyncTarget) {
    setExpandedSyncedCompleted((prev) => ({
      ...prev,
      [target]: !prev[target],
    }))
  }

  function toggleProjectCompleted(projectId: string) {
    setExpandedProjectCompleted((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }))
  }

  async function handleAddInboxAction() {
    const title = newInboxTitle.trim()
    if (!title) return

    try {
      setSubmitting(true)
      await api.createStandaloneAction({ title, module: 'inbox' })
      setNewInboxTitle('')
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('新增动作失败，请查看控制台报错。')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleStandaloneAction(action: StandaloneAction) {
    try {
      await api.updateStandaloneAction(action.id, { completed: !action.completed })
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('更新动作失败，请查看控制台报错。')
    }
  }

  async function handleToggleStandaloneActionStar(action: StandaloneAction) {
    try {
      await api.updateStandaloneAction(action.id, { starred: !action.starred })
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('更新重点标记失败，请查看控制台报错。')
    }
  }

  async function handleMoveStandaloneAction(actionId: string, targetModule: StandaloneModule) {
    try {
      await api.updateStandaloneAction(actionId, { module: targetModule })
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('移动动作失败，请查看控制台报错。')
    }
  }

  function startEditStandaloneAction(action: StandaloneAction) {
    setEditingStandaloneId(action.id)
    setEditingStandaloneTitle(action.title)
  }

  function cancelEditStandaloneAction() {
    setEditingStandaloneId(null)
    setEditingStandaloneTitle('')
  }

  async function saveEditStandaloneAction(actionId: string) {
    const title = editingStandaloneTitle.trim()
    if (!title) {
      alert('动作标题不能为空')
      return
    }

    try {
      await api.updateStandaloneAction(actionId, { title })
      cancelEditStandaloneAction()
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('编辑动作失败，请查看控制台报错。')
    }
  }

  async function handleDeleteStandaloneAction(action: StandaloneAction) {
    const confirmed = window.confirm(`确定要彻底删除「${action.title}」吗？此操作无法恢复。`)
    if (!confirmed) return

    try {
      await api.deleteStandaloneAction(action.id)
      if (editingStandaloneId === action.id) {
        cancelEditStandaloneAction()
      }
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('删除动作失败，请查看控制台报错。')
    }
  }

  async function handleConvertActionToProject(action: StandaloneAction) {
    try {
      await api.convertActionToProject(action.id)
      await refreshData(false)
      setActiveModule('projects')
    } catch (err) {
      console.error(err)
      alert('转为项目失败，请查看控制台报错。')
    }
  }

  async function handleStandaloneDragEnd(
    moduleKey: StandaloneModule,
    groupActions: StandaloneAction[],
    event: DragEndEvent
  ) {
    const reorderedGroup = reorderGroup(groupActions, event)
    if (!reorderedGroup) return

    const allActions = getStandaloneActionsByModule(moduleKey)
    const incompleteActions = allActions.filter((action) => !action.completed).sort(compareByOrder)
    const completedActions = allActions.filter((action) => action.completed).sort(compareByOrder)
    const isCompletedGroup = groupActions[0]?.completed ?? false
    const orderedIds = isCompletedGroup
      ? [...incompleteActions, ...reorderedGroup].map((item) => item.id)
      : [...reorderedGroup, ...completedActions].map((item) => item.id)

    try {
      await api.reorderStandaloneActions({ module: moduleKey, orderedIds })
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('保存排序失败，请查看控制台报错。')
    }
  }

  function startEditProject(project: Project) {
    setEditingProjectId(project.id)
    setEditingProjectTitle(project.title)
  }

  function cancelEditProject() {
    setEditingProjectId(null)
    setEditingProjectTitle('')
  }

  async function saveEditProject(projectId: string) {
    const title = editingProjectTitle.trim()
    if (!title) {
      alert('项目名不能为空')
      return
    }

    try {
      await api.updateProject(projectId, { title })
      cancelEditProject()
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('编辑项目失败，请查看控制台报错。')
    }
  }

  async function handleProjectStatusChange(project: Project, status: ProjectStatus) {
    try {
      await api.updateProject(project.id, { status })
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('更新项目状态失败，请查看控制台报错。')
    }
  }

  async function handleDeleteProject(project: Project) {
    const confirmed = window.confirm(`确定要彻底删除项目「${project.title}」吗？此操作无法恢复。`)
    if (!confirmed) return

    try {
      await api.deleteProject(project.id)
      if (editingProjectId === project.id) {
        cancelEditProject()
      }
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('删除项目失败，请查看控制台报错。')
    }
  }

  async function handleProjectDragEnd(status: ProjectStatus, event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const items = getProjectsByStatus(status)
    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...items]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    const orderedIds = reordered.map((item) => item.id)

    try {
      await api.reorderProjects({ status, orderedIds })
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('保存项目排序失败，请查看控制台报错。')
    }
  }

  function updateNewProjectActionTitle(projectId: string, value: string) {
    setNewProjectActionTitles((prev) => ({
      ...prev,
      [projectId]: value,
    }))
  }

  async function handleAddProjectAction(projectId: string) {
    const title = (newProjectActionTitles[projectId] ?? '').trim()
    if (!title) return

    try {
      await api.createProjectAction(projectId, title)
      setNewProjectActionTitles((prev) => ({
        ...prev,
        [projectId]: '',
      }))
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('新增项目动作失败，请查看控制台报错。')
    }
  }

  function startEditProjectAction(projectId: string, action: ProjectAction) {
    setEditingProjectActionKey(getProjectActionEditKey(projectId, action.id))
    setEditingProjectActionTitle(action.title)
  }

  function cancelEditProjectAction() {
    setEditingProjectActionKey(null)
    setEditingProjectActionTitle('')
  }

  async function saveEditProjectAction(projectId: string, actionId: string) {
    const title = editingProjectActionTitle.trim()
    if (!title) {
      alert('动作标题不能为空')
      return
    }

    try {
      await api.updateProjectAction(projectId, actionId, { title })
      cancelEditProjectAction()
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('编辑项目动作失败，请查看控制台报错。')
    }
  }

  async function toggleProjectAction(projectId: string, action: ProjectAction) {
    try {
      await api.updateProjectAction(projectId, action.id, {
        completed: !action.completed,
      })
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('更新项目动作失败，请查看控制台报错。')
    }
  }

  async function toggleProjectActionStar(projectId: string, action: ProjectAction) {
    try {
      await api.updateProjectAction(projectId, action.id, {
        starred: !action.starred,
      })
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('更新重点标记失败，请查看控制台报错。')
    }
  }

  async function toggleProjectActionSyncTarget(
    projectId: string,
    action: ProjectAction,
    target: SyncTarget
  ) {
    try {
      await api.updateProjectAction(projectId, action.id, {
        syncTargets: {
          ...action.syncTargets,
          [target]: !action.syncTargets[target],
        },
      })
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('更新同步设置失败，请查看控制台报错。')
    }
  }

  async function handleDeleteProjectAction(projectId: string, action: ProjectAction) {
    const confirmed = window.confirm(
      `确定要彻底删除项目动作「${action.title}」吗？此操作无法恢复。`
    )
    if (!confirmed) return

    try {
      await api.deleteProjectAction(projectId, action.id)
      if (editingProjectActionKey === getProjectActionEditKey(projectId, action.id)) {
        cancelEditProjectAction()
      }
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('删除项目动作失败，请查看控制台报错。')
    }
  }

  async function handleProjectActionDragEnd(
    projectId: string,
    groupActions: ProjectAction[],
    event: DragEndEvent
  ) {
    const reorderedGroup = reorderGroup(groupActions, event)
    if (!reorderedGroup) return

    const project = (data?.projects ?? []).find((item) => item.id === projectId)
    if (!project) return

    const incompleteActions = project.actions
      .filter((action) => !action.completed)
      .sort(compareByOrder)
    const completedActions = project.actions
      .filter((action) => action.completed)
      .sort(compareByOrder)
    const isCompletedGroup = groupActions[0]?.completed ?? false
    const orderedIds = isCompletedGroup
      ? [...incompleteActions, ...reorderedGroup].map((item) => item.id)
      : [...reorderedGroup, ...completedActions].map((item) => item.id)

    try {
      await api.reorderProjectActions(projectId, orderedIds)
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('保存项目动作排序失败，请查看控制台报错。')
    }
  }

  function startEditCalendarItem(item: CalendarItem) {
    setEditingCalendarItemId(item.id)
    setEditingCalendarItemTitle(item.title)
    setEditingCalendarItemDate(item.date)
  }

  function cancelEditCalendarItem() {
    setEditingCalendarItemId(null)
    setEditingCalendarItemTitle('')
    setEditingCalendarItemDate(selectedDate)
  }

  async function handleAddCalendarItem() {
    const title = newCalendarTitle.trim()
    if (!title) return

    try {
      await api.createCalendarItem({ date: selectedDate, title })
      setNewCalendarTitle('')
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('新增日历事项失败，请查看控制台报错。')
    }
  }

  async function saveEditCalendarItem(itemId: string) {
    const title = editingCalendarItemTitle.trim()
    const date = editingCalendarItemDate.trim()
    if (!title || !date) {
      alert('日历事项标题和日期都不能为空')
      return
    }

    try {
      await api.updateCalendarItem(itemId, { title, date })
      setSelectedDate(date)
      cancelEditCalendarItem()
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('编辑日历事项失败，请查看控制台报错。')
    }
  }

  async function toggleCalendarItem(item: CalendarItem) {
    try {
      await api.updateCalendarItem(item.id, { completed: !item.completed })
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('更新日历事项失败，请查看控制台报错。')
    }
  }

  async function deleteCalendarItem(item: CalendarItem) {
    const confirmed = window.confirm(`确定要删除日历事项「${item.title}」吗？`)
    if (!confirmed) return

    try {
      await api.deleteCalendarItem(item.id)
      if (editingCalendarItemId === item.id) {
        cancelEditCalendarItem()
      }
      await refreshData(false)
    } catch (err) {
      console.error(err)
      alert('删除日历事项失败，请查看控制台报错。')
    }
  }

  const activeLabel = useMemo(() => {
    return MODULES.find((item) => item.key === activeModule)?.label ?? ''
  }, [activeModule])

  if (loading) {
    return <div className="app-loading">正在加载数据...</div>
  }

  if (!data) {
    return <div className="app-loading">读取后端数据失败。</div>
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Get Things Done</h1>
          <p>个人轻量 GTD 应用</p>
        </div>

        <nav className="module-nav">
          {MODULES.map((item) => (
            <button
              key={item.key}
              className={`nav-button ${activeModule === item.key ? 'active' : ''}`}
              onClick={() => setActiveModule(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="main-header">
          <h2>{activeLabel}</h2>
          <p>当前模块：{activeLabel}</p>
        </header>

        <section className="content-area">
          {(activeModule === 'inbox' ||
            activeModule === 'next' ||
            activeModule === 'someday' ||
            activeModule === 'waiting' ||
            activeModule === 'reference' ||
            activeModule === 'trash') && (
            <StandaloneModulePage
              moduleKey={activeModule as StandaloneModule}
              title={
                activeModule === 'inbox'
                  ? 'In-Box 事项'
                  : activeModule === 'next'
                    ? 'Next-Action-List'
                    : activeModule === 'someday'
                      ? 'Someday/Maybe-List'
                      : activeModule === 'waiting'
                        ? 'Waiting-For-List'
                        : activeModule === 'reference'
                          ? 'Reference'
                          : 'Trash'
              }
              description={
                activeModule === 'inbox'
                  ? '把你想到的任何事项先快速记在这里。'
                  : activeModule === 'next'
                    ? '这里放你下一步要执行的动作。'
                    : activeModule === 'someday'
                      ? '这里放将来可能会做的动作。'
                      : activeModule === 'waiting'
                        ? '这里放需要等待别人或等待条件满足的动作。'
                        : activeModule === 'reference'
                          ? '这里放参考资料类动作或记录。'
                          : '这里显示被移入回收区的普通动作和项目。'
              }
              actions={getStandaloneActionsByModule(activeModule as StandaloneModule)}
              syncedProjectActions={
                activeModule === 'next' || activeModule === 'someday' || activeModule === 'waiting'
                  ? getSyncedProjectActions(activeModule)
                  : []
              }
              sensors={sensors}
              newInboxTitle={newInboxTitle}
              submitting={submitting}
              editingStandaloneId={editingStandaloneId}
              editingStandaloneTitle={editingStandaloneTitle}
              editingProjectActionKey={editingProjectActionKey}
              editingProjectActionTitle={editingProjectActionTitle}
              completedActionsExpanded={
                expandedStandaloneCompleted[activeModule as StandaloneModule] ?? false
              }
              syncedCompletedActionsExpanded={
                activeModule === 'next' || activeModule === 'someday' || activeModule === 'waiting'
                  ? (expandedSyncedCompleted[activeModule] ?? false)
                  : false
              }
              showTrashProjectsSection={
                activeModule === 'trash' ? (
                  <TrashProjectsSection
                    trashProjects={getProjectsByStatus('trash')}
                    editingProjectId={editingProjectId}
                    editingProjectTitle={editingProjectTitle}
                    editingProjectActionKey={editingProjectActionKey}
                    editingProjectActionTitle={editingProjectActionTitle}
                    expandedCompletedProjectIds={expandedProjectCompleted}
                    getProjectActionEditKey={getProjectActionEditKey}
                    onStartEditProject={startEditProject}
                    onChangeEditProjectTitle={setEditingProjectTitle}
                    onSaveEditProject={saveEditProject}
                    onCancelEditProject={cancelEditProject}
                    onToggleProjectStatus={handleProjectStatusChange}
                    onDeleteProject={handleDeleteProject}
                    onToggleCompletedProjectActions={toggleProjectCompleted}
                    onStartEditProjectAction={startEditProjectAction}
                    onChangeEditProjectActionTitle={setEditingProjectActionTitle}
                    onSaveEditProjectAction={saveEditProjectAction}
                    onCancelEditProjectAction={cancelEditProjectAction}
                    onToggleProjectAction={toggleProjectAction}
                    onToggleProjectActionStar={toggleProjectActionStar}
                    onDeleteProjectAction={handleDeleteProjectAction}
                    onToggleProjectActionSyncTarget={toggleProjectActionSyncTarget}
                  />
                ) : undefined
              }
              onToggleCompletedActionsExpanded={() =>
                toggleStandaloneCompleted(activeModule as StandaloneModule)
              }
              onToggleSyncedCompletedActionsExpanded={() => {
                if (
                  activeModule === 'next' ||
                  activeModule === 'someday' ||
                  activeModule === 'waiting'
                ) {
                  toggleSyncedCompleted(activeModule)
                }
              }}
              onChangeNewInboxTitle={setNewInboxTitle}
              onAddInboxAction={handleAddInboxAction}
              onStandaloneDragEnd={handleStandaloneDragEnd}
              onStartEditStandaloneAction={startEditStandaloneAction}
              onChangeEditStandaloneTitle={setEditingStandaloneTitle}
              onSaveEditStandaloneAction={saveEditStandaloneAction}
              onCancelEditStandaloneAction={cancelEditStandaloneAction}
              onToggleStandaloneAction={handleToggleStandaloneAction}
              onToggleStandaloneActionStar={handleToggleStandaloneActionStar}
              onMoveStandaloneAction={handleMoveStandaloneAction}
              onDeleteStandaloneAction={handleDeleteStandaloneAction}
              onConvertActionToProject={handleConvertActionToProject}
              onStartEditProjectAction={startEditProjectAction}
              onChangeEditProjectActionTitle={setEditingProjectActionTitle}
              onSaveEditProjectAction={saveEditProjectAction}
              onCancelEditProjectAction={cancelEditProjectAction}
              onToggleProjectAction={toggleProjectAction}
              onToggleProjectActionStar={toggleProjectActionStar}
              getProjectActionEditKey={getProjectActionEditKey}
            />
          )}

          {activeModule === 'projects' && (
            <ProjectsPage
              activeProjects={getProjectsByStatus('active')}
              sensors={sensors}
              editingProjectId={editingProjectId}
              editingProjectTitle={editingProjectTitle}
              editingProjectActionKey={editingProjectActionKey}
              editingProjectActionTitle={editingProjectActionTitle}
              newProjectActionTitles={newProjectActionTitles}
              expandedCompletedProjectIds={expandedProjectCompleted}
              getProjectActionEditKey={getProjectActionEditKey}
              onProjectDragEnd={handleProjectDragEnd}
              onStartEditProject={startEditProject}
              onChangeEditProjectTitle={setEditingProjectTitle}
              onSaveEditProject={saveEditProject}
              onCancelEditProject={cancelEditProject}
              onToggleProjectStatus={handleProjectStatusChange}
              onDeleteProject={handleDeleteProject}
              onChangeNewProjectActionTitle={updateNewProjectActionTitle}
              onAddProjectAction={handleAddProjectAction}
              onProjectActionDragEnd={handleProjectActionDragEnd}
              onToggleCompletedProjectActions={toggleProjectCompleted}
              onStartEditProjectAction={startEditProjectAction}
              onChangeEditProjectActionTitle={setEditingProjectActionTitle}
              onSaveEditProjectAction={saveEditProjectAction}
              onCancelEditProjectAction={cancelEditProjectAction}
              onToggleProjectAction={toggleProjectAction}
              onToggleProjectActionStar={toggleProjectActionStar}
              onDeleteProjectAction={handleDeleteProjectAction}
              onToggleProjectActionSyncTarget={toggleProjectActionSyncTarget}
            />
          )}

          {activeModule === 'calendar' && (
            <CalendarPage
              selectedDate={selectedDate}
              calendarItems={data.calendarItems}
              newCalendarTitle={newCalendarTitle}
              editingCalendarItemId={editingCalendarItemId}
              editingCalendarItemTitle={editingCalendarItemTitle}
              editingCalendarItemDate={editingCalendarItemDate}
              onSelectDate={setSelectedDate}
              onChangeNewCalendarTitle={setNewCalendarTitle}
              onAddCalendarItem={handleAddCalendarItem}
              onStartEditCalendarItem={startEditCalendarItem}
              onChangeEditCalendarItemTitle={setEditingCalendarItemTitle}
              onChangeEditCalendarItemDate={setEditingCalendarItemDate}
              onSaveEditCalendarItem={saveEditCalendarItem}
              onCancelEditCalendarItem={cancelEditCalendarItem}
              onToggleCalendarItem={toggleCalendarItem}
              onDeleteCalendarItem={deleteCalendarItem}
            />
          )}

          <div className="panel-card debug-toggle-card">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showDebugPanel}
                onChange={(event) => setShowDebugPanel(event.target.checked)}
              />
              <span>{'\u663e\u793a\u8c03\u8bd5\u6570\u636e\u533a'}</span>
            </label>
          </div>

          {showDebugPanel && <div className="panel-card debug-card">
            <h3>调试数据区</h3>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>}
        </section>
      </main>
    </div>
  )
}

export default App

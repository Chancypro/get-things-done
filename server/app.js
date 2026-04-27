import express from 'express'
import cors from 'cors'
import { JSONFilePreset } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const port = 3000

const ACTION_MODULES = ['inbox', 'next', 'someday', 'waiting', 'reference', 'trash']
const PROJECT_STATUSES = ['active', 'trash']
const PROJECT_COLOR_COUNT = 8

const defaultData = {
  standaloneActions: [],
  projects: [],
  calendarItems: [],
}

const db = await JSONFilePreset('db.json', defaultData)

app.use(cors())
app.use(express.json())

function normalizeDb() {
  if (!Array.isArray(db.data.standaloneActions)) db.data.standaloneActions = []
  if (!Array.isArray(db.data.projects)) db.data.projects = []
  if (!Array.isArray(db.data.calendarItems)) db.data.calendarItems = []

  for (const moduleKey of ACTION_MODULES) {
    const actions = db.data.standaloneActions
      .filter((item) => item.module === moduleKey)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    actions.forEach((action, index) => {
      if (typeof action.order !== 'number') action.order = index
      normalizeActionFields(action)
    })
  }

  db.data.projects.forEach((project, projectIndex) => {
    if (!PROJECT_STATUSES.includes(project.status)) project.status = 'active'
    if (typeof project.order !== 'number') project.order = projectIndex
    if (typeof project.colorIndex !== 'number') {
      project.colorIndex = projectIndex % PROJECT_COLOR_COUNT
    }
    if (!Array.isArray(project.actions)) project.actions = []

    project.actions
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .forEach((action, index) => {
        if (typeof action.order !== 'number') action.order = index
        normalizeActionFields(action)
        if (!action.syncTargets) {
          action.syncTargets = {
            next: false,
            someday: false,
            waiting: false,
          }
        }
      })
  })

  db.data.calendarItems.forEach((item) => {
    if (typeof item.completed !== 'boolean') item.completed = false
    if (!item.createdAt) item.createdAt = new Date().toISOString()
    if (!item.updatedAt) item.updatedAt = new Date().toISOString()
  })
}

function normalizeActionFields(action) {
  if (typeof action.completed !== 'boolean') action.completed = false
  if (typeof action.starred !== 'boolean') action.starred = false
  if (!action.createdAt) action.createdAt = new Date().toISOString()
  if (!action.updatedAt) action.updatedAt = new Date().toISOString()

  if (typeof action.title === 'string' && /^\s*⭐/.test(action.title)) {
    const cleanedTitle = action.title.replace(/^\s*(?:⭐\s*)+/, '').trim()
    if (cleanedTitle) {
      action.title = cleanedTitle
    }
    action.starred = true
  }
}

function getModuleActions(moduleKey) {
  return db.data.standaloneActions
    .filter((item) => item.module === moduleKey)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function reindexModule(moduleKey) {
  const actions = getModuleActions(moduleKey)
  actions.forEach((action, index) => {
    action.order = index
  })
}

function makeRoomAtTopOfModule(moduleKey) {
  getModuleActions(moduleKey).forEach((action) => {
    action.order = (action.order ?? 0) + 1
  })
}

function getProjectsByStatus(status) {
  return db.data.projects
    .filter((project) => project.status === status)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function reindexProjectsByStatus(status) {
  const projects = getProjectsByStatus(status)
  projects.forEach((project, index) => {
    project.order = index
  })
}

function getProjectById(projectId) {
  return db.data.projects.find((project) => project.id === projectId)
}

function getProjectActionById(project, actionId) {
  return project.actions.find((action) => action.id === actionId)
}

function sortProjectActions(project) {
  return [...project.actions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

function reindexProjectActions(project) {
  const actions = sortProjectActions(project)
  actions.forEach((action, index) => {
    action.order = index
  })
}

function makeRoomAtTopOfProject(project) {
  sortProjectActions(project).forEach((action) => {
    action.order = (action.order ?? 0) + 1
  })
}

function getNextProjectColorIndex() {
  return db.data.projects.length % PROJECT_COLOR_COUNT
}

function sortCalendarItems(items) {
  return [...items].sort((a, b) => {
    if (a.date === b.date) {
      return a.createdAt.localeCompare(b.createdAt)
    }
    return a.date.localeCompare(b.date)
  })
}

function buildResponseData() {
  const standaloneActions = [...db.data.standaloneActions].sort((a, b) => {
    if (a.module === b.module) {
      return (a.order ?? 0) - (b.order ?? 0)
    }
    return ACTION_MODULES.indexOf(a.module) - ACTION_MODULES.indexOf(b.module)
  })

  const projects = [...db.data.projects]
    .sort((a, b) => {
      if (a.status === b.status) {
        return (a.order ?? 0) - (b.order ?? 0)
      }
      return PROJECT_STATUSES.indexOf(a.status) - PROJECT_STATUSES.indexOf(b.status)
    })
    .map((project) => ({
      ...project,
      actions: sortProjectActions(project),
    }))

  return {
    ...db.data,
    standaloneActions,
    projects,
    calendarItems: sortCalendarItems(db.data.calendarItems),
  }
}

normalizeDb()
await db.write()

app.get('/', (req, res) => {
  res.send('Get Things Done server is running')
})

app.get('/api/data', (req, res) => {
  res.json(buildResponseData())
})

app.post('/api/actions', async (req, res) => {
  const { title, module } = req.body

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title 不能为空' })
  }

  const targetModule = ACTION_MODULES.includes(module) ? module : 'inbox'
  makeRoomAtTopOfModule(targetModule)

  const newAction = {
    id: uuidv4(),
    title: title.trim(),
    completed: false,
    starred: false,
    module: targetModule,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  db.data.standaloneActions.push(newAction)
  await db.write()

  res.status(201).json(newAction)
})

app.patch('/api/actions/:id', async (req, res) => {
  const { id } = req.params
  const { title, completed, module, starred } = req.body

  const action = db.data.standaloneActions.find((item) => item.id === id)

  if (!action) {
    return res.status(404).json({ error: '未找到该动作' })
  }

  if (typeof title === 'string') {
    const nextTitle = title.trim()
    if (!nextTitle) {
      return res.status(400).json({ error: 'title 不能为空' })
    }
    action.title = nextTitle
  }

  if (typeof completed === 'boolean') {
    action.completed = completed
  }

  if (typeof starred === 'boolean') {
    action.starred = starred
  }

  if (typeof module === 'string' && ACTION_MODULES.includes(module) && module !== action.module) {
    const previousModule = action.module

    makeRoomAtTopOfModule(module)
    action.module = module
    action.order = 0
    reindexModule(previousModule)
    reindexModule(module)
  }

  action.updatedAt = new Date().toISOString()
  await db.write()

  res.json(action)
})

app.post('/api/actions/reorder', async (req, res) => {
  const { module, orderedIds } = req.body

  if (!ACTION_MODULES.includes(module)) {
    return res.status(400).json({ error: '无效的模块' })
  }

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds 必须是数组' })
  }

  const actions = getModuleActions(module)
  const actionIds = actions.map((item) => item.id)

  const sameLength = actionIds.length === orderedIds.length
  const sameMembers = actionIds.every((id) => orderedIds.includes(id))

  if (!sameLength || !sameMembers) {
    return res.status(400).json({ error: 'orderedIds 与模块内动作不匹配' })
  }

  orderedIds.forEach((id, index) => {
    const action = db.data.standaloneActions.find((item) => item.id === id)
    if (action) {
      action.order = index
      action.updatedAt = new Date().toISOString()
    }
  })

  await db.write()

  res.json({
    success: true,
    standaloneActions: buildResponseData().standaloneActions,
  })
})

app.delete('/api/actions/:id', async (req, res) => {
  const { id } = req.params
  const index = db.data.standaloneActions.findIndex((item) => item.id === id)

  if (index === -1) {
    return res.status(404).json({ error: '未找到该动作' })
  }

  const removed = db.data.standaloneActions[index]
  db.data.standaloneActions.splice(index, 1)
  reindexModule(removed.module)

  await db.write()
  res.json({ success: true })
})

app.post('/api/projects/from-action', async (req, res) => {
  const { actionId } = req.body

  const actionIndex = db.data.standaloneActions.findIndex((item) => item.id === actionId)

  if (actionIndex === -1) {
    return res.status(404).json({ error: '未找到该动作' })
  }

  const sourceAction = db.data.standaloneActions[actionIndex]

  if (sourceAction.module !== 'inbox') {
    return res.status(400).json({ error: '只有 In-Box 中的动作可以转为项目' })
  }

  db.data.standaloneActions.splice(actionIndex, 1)
  reindexModule('inbox')

  const newProject = {
    id: uuidv4(),
    title: sourceAction.title,
    status: 'active',
    order: getProjectsByStatus('active').length,
    colorIndex: getNextProjectColorIndex(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    actions: [],
  }

  db.data.projects.push(newProject)

  await db.write()
  res.status(201).json(newProject)
})

app.post('/api/projects/reorder', async (req, res) => {
  const { status, orderedIds } = req.body

  if (!PROJECT_STATUSES.includes(status)) {
    return res.status(400).json({ error: '无效的项目状态' })
  }

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds 必须是数组' })
  }

  const projects = getProjectsByStatus(status)
  const projectIds = projects.map((project) => project.id)

  const sameLength = projectIds.length === orderedIds.length
  const sameMembers = projectIds.every((id) => orderedIds.includes(id))

  if (!sameLength || !sameMembers) {
    return res.status(400).json({ error: 'orderedIds 与项目列表不匹配' })
  }

  orderedIds.forEach((id, index) => {
    const project = getProjectById(id)
    if (project) {
      project.order = index
      project.updatedAt = new Date().toISOString()
    }
  })

  await db.write()

  res.json({
    success: true,
    projects: buildResponseData().projects,
  })
})

app.patch('/api/projects/:id', async (req, res) => {
  const { id } = req.params
  const { title, status } = req.body

  const project = getProjectById(id)

  if (!project) {
    return res.status(404).json({ error: '未找到该项目' })
  }

  if (typeof title === 'string') {
    const nextTitle = title.trim()
    if (!nextTitle) {
      return res.status(400).json({ error: '项目名不能为空' })
    }
    project.title = nextTitle
  }

  if (typeof status === 'string' && PROJECT_STATUSES.includes(status) && status !== project.status) {
    const previousStatus = project.status
    const targetOrder = db.data.projects.filter(
      (item) => item.status === status && item.id !== project.id
    ).length

    project.status = status
    project.order = targetOrder

    reindexProjectsByStatus(previousStatus)
    reindexProjectsByStatus(status)
  }

  project.updatedAt = new Date().toISOString()
  await db.write()

  res.json(project)
})

app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params
  const index = db.data.projects.findIndex((project) => project.id === id)

  if (index === -1) {
    return res.status(404).json({ error: '未找到该项目' })
  }

  const removed = db.data.projects[index]
  db.data.projects.splice(index, 1)
  reindexProjectsByStatus(removed.status)

  await db.write()
  res.json({ success: true })
})

app.post('/api/projects/:projectId/actions', async (req, res) => {
  const { projectId } = req.params
  const { title } = req.body

  const project = getProjectById(projectId)

  if (!project) {
    return res.status(404).json({ error: '未找到该项目' })
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ error: '动作标题不能为空' })
  }

  makeRoomAtTopOfProject(project)

  const newAction = {
    id: uuidv4(),
    title: title.trim(),
    completed: false,
    starred: false,
    order: 0,
    syncTargets: {
      next: false,
      someday: false,
      waiting: false,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  project.actions.push(newAction)
  project.updatedAt = new Date().toISOString()

  await db.write()
  res.status(201).json(newAction)
})

app.post('/api/projects/:projectId/actions/reorder', async (req, res) => {
  const { projectId } = req.params
  const { orderedIds } = req.body

  const project = getProjectById(projectId)

  if (!project) {
    return res.status(404).json({ error: '未找到该项目' })
  }

  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds 必须是数组' })
  }

  const actions = sortProjectActions(project)
  const actionIds = actions.map((action) => action.id)

  const sameLength = actionIds.length === orderedIds.length
  const sameMembers = actionIds.every((id) => orderedIds.includes(id))

  if (!sameLength || !sameMembers) {
    return res.status(400).json({ error: 'orderedIds 与项目动作不匹配' })
  }

  orderedIds.forEach((id, index) => {
    const action = getProjectActionById(project, id)
    if (action) {
      action.order = index
      action.updatedAt = new Date().toISOString()
    }
  })

  project.updatedAt = new Date().toISOString()

  await db.write()
  res.json({ success: true, project })
})

app.patch('/api/projects/:projectId/actions/:actionId', async (req, res) => {
  const { projectId, actionId } = req.params
  const { title, completed, syncTargets, starred } = req.body

  const project = getProjectById(projectId)
  if (!project) {
    return res.status(404).json({ error: '未找到该项目' })
  }

  const action = getProjectActionById(project, actionId)
  if (!action) {
    return res.status(404).json({ error: '未找到该项目动作' })
  }

  if (typeof title === 'string') {
    const nextTitle = title.trim()
    if (!nextTitle) {
      return res.status(400).json({ error: '动作标题不能为空' })
    }
    action.title = nextTitle
  }

  if (typeof completed === 'boolean') {
    action.completed = completed
  }

  if (typeof starred === 'boolean') {
    action.starred = starred
  }

  if (syncTargets && typeof syncTargets === 'object') {
    action.syncTargets = {
      next:
        typeof syncTargets.next === 'boolean'
          ? syncTargets.next
          : action.syncTargets.next,
      someday:
        typeof syncTargets.someday === 'boolean'
          ? syncTargets.someday
          : action.syncTargets.someday,
      waiting:
        typeof syncTargets.waiting === 'boolean'
          ? syncTargets.waiting
          : action.syncTargets.waiting,
    }
  }

  action.updatedAt = new Date().toISOString()
  project.updatedAt = new Date().toISOString()

  await db.write()
  res.json(action)
})

app.delete('/api/projects/:projectId/actions/:actionId', async (req, res) => {
  const { projectId, actionId } = req.params

  const project = getProjectById(projectId)
  if (!project) {
    return res.status(404).json({ error: '未找到该项目' })
  }

  const index = project.actions.findIndex((action) => action.id === actionId)
  if (index === -1) {
    return res.status(404).json({ error: '未找到该项目动作' })
  }

  project.actions.splice(index, 1)
  reindexProjectActions(project)
  project.updatedAt = new Date().toISOString()

  await db.write()
  res.json({ success: true })
})

app.post('/api/calendar-items', async (req, res) => {
  const { date, title } = req.body

  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'date 不能为空' })
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title 不能为空' })
  }

  const newItem = {
    id: uuidv4(),
    date,
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  db.data.calendarItems.push(newItem)
  await db.write()

  res.status(201).json(newItem)
})

app.patch('/api/calendar-items/:id', async (req, res) => {
  const { id } = req.params
  const { date, title, completed } = req.body

  const item = db.data.calendarItems.find((calendarItem) => calendarItem.id === id)
  if (!item) {
    return res.status(404).json({ error: '未找到该日历事项' })
  }

  if (typeof date === 'string') {
    if (!date.trim()) {
      return res.status(400).json({ error: 'date 不能为空' })
    }
    item.date = date.trim()
  }

  if (typeof title === 'string') {
    const nextTitle = title.trim()
    if (!nextTitle) {
      return res.status(400).json({ error: 'title 不能为空' })
    }
    item.title = nextTitle
  }

  if (typeof completed === 'boolean') {
    item.completed = completed
  }

  item.updatedAt = new Date().toISOString()
  await db.write()

  res.json(item)
})

app.delete('/api/calendar-items/:id', async (req, res) => {
  const { id } = req.params
  const index = db.data.calendarItems.findIndex((item) => item.id === id)

  if (index === -1) {
    return res.status(404).json({ error: '未找到该日历事项' })
  }

  db.data.calendarItems.splice(index, 1)
  await db.write()

  res.json({ success: true })
})

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})

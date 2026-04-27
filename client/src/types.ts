export type ModuleKey =
  | 'inbox'
  | 'calendar'
  | 'next'
  | 'projects'
  | 'someday'
  | 'waiting'
  | 'reference'
  | 'trash'

export type StandaloneModule =
  | 'inbox'
  | 'next'
  | 'someday'
  | 'waiting'
  | 'reference'
  | 'trash'

export type SyncTarget = 'next' | 'someday' | 'waiting'
export type ProjectStatus = 'active' | 'trash'

export type StandaloneAction = {
  id: string
  title: string
  completed: boolean
  starred: boolean
  module: StandaloneModule
  order: number
  createdAt: string
  updatedAt: string
}

export type ProjectAction = {
  id: string
  title: string
  completed: boolean
  starred: boolean
  order: number
  syncTargets: {
    next: boolean
    someday: boolean
    waiting: boolean
  }
  createdAt: string
  updatedAt: string
}

export type Project = {
  id: string
  title: string
  status: ProjectStatus
  order: number
  colorIndex: number
  color: string
  createdAt: string
  updatedAt: string
  actions: ProjectAction[]
}

export type CalendarItem = {
  id: string
  date: string
  title: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export type AppData = {
  standaloneActions: StandaloneAction[]
  projects: Project[]
  calendarItems: CalendarItem[]
}

export const MODULES: { key: ModuleKey; label: string }[] = [
  { key: 'inbox', label: 'In-Box' },
  { key: 'calendar', label: '日历' },
  { key: 'next', label: 'Next-Action-List' },
  { key: 'projects', label: 'Project-List' },
  { key: 'someday', label: 'Someday/Maybe-List' },
  { key: 'waiting', label: 'Waiting-For-List' },
  { key: 'reference', label: 'Reference' },
  { key: 'trash', label: 'Trash' },
]

export const STANDALONE_MODULES: StandaloneModule[] = [
  'inbox',
  'next',
  'someday',
  'waiting',
  'reference',
  'trash',
]

export const MODULE_LABELS: Record<StandaloneModule, string> = {
  inbox: 'In-Box',
  next: 'Next-Action-List',
  someday: 'Someday/Maybe-List',
  waiting: 'Waiting-For-List',
  reference: 'Reference',
  trash: 'Trash',
}

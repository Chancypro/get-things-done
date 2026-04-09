const API_BASE = 'http://localhost:3000'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!res.ok) {
    let message = '请求失败'
    try {
      const data = await res.json()
      if (data?.error) {
        message = data.error
      }
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}

export const api = {
  getData: () => request('/api/data'),

  createStandaloneAction: (payload: { title: string; module: string }) =>
    request('/api/actions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateStandaloneAction: (id: string, payload: Record<string, unknown>) =>
    request(`/api/actions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  reorderStandaloneActions: (payload: { module: string; orderedIds: string[] }) =>
    request('/api/actions/reorder', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  deleteStandaloneAction: (id: string) =>
    request(`/api/actions/${id}`, {
      method: 'DELETE',
    }),

  convertActionToProject: (actionId: string) =>
    request('/api/projects/from-action', {
      method: 'POST',
      body: JSON.stringify({ actionId }),
    }),

  reorderProjects: (payload: { status: string; orderedIds: string[] }) =>
    request('/api/projects/reorder', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProject: (id: string, payload: Record<string, unknown>) =>
    request(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteProject: (id: string) =>
    request(`/api/projects/${id}`, {
      method: 'DELETE',
    }),

  createProjectAction: (projectId: string, title: string) =>
    request(`/api/projects/${projectId}/actions`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),

  reorderProjectActions: (projectId: string, orderedIds: string[]) =>
    request(`/api/projects/${projectId}/actions/reorder`, {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    }),

  updateProjectAction: (
    projectId: string,
    actionId: string,
    payload: Record<string, unknown>
  ) =>
    request(`/api/projects/${projectId}/actions/${actionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteProjectAction: (projectId: string, actionId: string) =>
    request(`/api/projects/${projectId}/actions/${actionId}`, {
      method: 'DELETE',
    }),

  createCalendarItem: (payload: { date: string; title: string }) =>
    request('/api/calendar-items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCalendarItem: (id: string, payload: Record<string, unknown>) =>
    request(`/api/calendar-items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteCalendarItem: (id: string) =>
    request(`/api/calendar-items/${id}`, {
      method: 'DELETE',
    }),
}

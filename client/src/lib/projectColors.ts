import type { CSSProperties } from 'react'

export const DEFAULT_PROJECT_COLORS = [
  '#3B82F6',
  '#22C55E',
  '#F97316',
  '#8B5CF6',
  '#14B8A6',
  '#F43F5E',
  '#EAB308',
  '#64748B',
]

type ProjectColorSource = {
  color?: string
  colorIndex?: number
}

function isValidProjectColor(color: unknown): color is string {
  return typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)
}

export function getProjectColor(project: ProjectColorSource) {
  if (isValidProjectColor(project.color)) {
    return project.color.toUpperCase()
  }

  const index = project.colorIndex ?? 0
  const normalizedIndex =
    ((index % DEFAULT_PROJECT_COLORS.length) + DEFAULT_PROJECT_COLORS.length) %
    DEFAULT_PROJECT_COLORS.length

  return DEFAULT_PROJECT_COLORS[normalizedIndex]
}

export function getProjectColorStyle(project: ProjectColorSource): CSSProperties {
  return {
    '--project-color': getProjectColor(project),
  } as CSSProperties
}

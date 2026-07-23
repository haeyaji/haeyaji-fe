// be 사용자 라벨 CRUD (/labels). ApiResponse<T> envelope → data.data 언랩.
// 라벨 = 분류 정의(id UUID, name, color). todo↔label 연결은 todo.labelId(todoApi).
import { be } from './client'

interface Env<T> { data: T }

export interface LabelDto {
  id: string
  name: string
  color: string
}

export async function fetchLabels(): Promise<LabelDto[]> {
  const res = await be.get<Env<LabelDto[]>>('/labels')
  return res.data.data ?? []
}

export async function createLabel(name: string, color: string): Promise<LabelDto> {
  const res = await be.post<Env<LabelDto>>('/labels', { name, color })
  return res.data.data
}

export async function updateLabel(id: string, patch: { name?: string; color?: string }): Promise<LabelDto> {
  const res = await be.patch<Env<LabelDto>>(`/labels/${id}`, patch)
  return res.data.data
}

export async function deleteLabel(id: string): Promise<void> {
  await be.delete(`/labels/${id}`)
}

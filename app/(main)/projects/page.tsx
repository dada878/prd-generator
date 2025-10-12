'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Project } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Plus, FileText, Trash2, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ProjectsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/projects')

      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      console.log('Fetched projects:', data.projects)
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast({
        variant: 'destructive',
        title: '載入失敗',
        description: '無法載入專案列表，請稍後再試',
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這個專案嗎？')) return

    try {
      setDeletingId(id)
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      setProjects(projects.filter(p => p.id !== id))
      toast({
        title: '專案已刪除',
        description: '專案已成功刪除',
      })
    } catch (error) {
      console.error('Error deleting project:', error)
      toast({
        variant: 'destructive',
        title: '刪除失敗',
        description: '無法刪除專案，請稍後再試',
      })
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">我的專案</h1>
          <p className="text-muted-foreground">管理你的所有 PRD 專案</p>
        </div>
        <Button onClick={() => router.push('/create')} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          新建專案
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">還沒有任何專案</h2>
          <p className="text-muted-foreground mb-4">
            建立你的第一個 PRD 專案開始吧！
          </p>
          <Button onClick={() => router.push('/create')}>
            <Plus className="h-4 w-4 mr-2" />
            新建專案
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/create?projectId=${project.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{project.pages.length} 個頁面</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/create?projectId=${project.id}`)
                  }}
                >
                  開啟
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(project.id)
                  }}
                  disabled={deletingId === project.id}
                >
                  {deletingId === project.id ? (
                    <Spinner size="sm" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

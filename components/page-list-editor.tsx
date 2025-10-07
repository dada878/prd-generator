import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Plus, Edit, Save, X, RotateCcw } from 'lucide-react'

interface PageBasicInfo {
  id: string
  name: string
  urlPath: string
  description: string
  notes?: string
  deleted?: boolean
  deleteReason?: string
}

interface PageListEditorProps {
  pages: PageBasicInfo[]
  onUpdate: (pages: PageBasicInfo[]) => void
  onConfirm: () => void
}

export function PageListEditor({ pages, onUpdate, onConfirm }: PageListEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<PageBasicInfo | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState('')

  const handleEdit = (page: PageBasicInfo) => {
    setEditingId(page.id)
    setEditForm({ ...page })
  }

  const handleSave = () => {
    if (!editForm) return
    onUpdate(pages.map(p => p.id === editForm.id ? editForm : p))
    setEditingId(null)
    setEditForm(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const handleDeleteClick = (id: string) => {
    setDeletingId(id)
    setDeleteReason('')
  }

  const handleDeleteConfirm = () => {
    if (!deletingId) return
    onUpdate(pages.map(p =>
      p.id === deletingId
        ? { ...p, deleted: true, deleteReason: deleteReason.trim() || undefined }
        : p
    ))
    setDeletingId(null)
    setDeleteReason('')
  }

  const handleDeleteCancel = () => {
    setDeletingId(null)
    setDeleteReason('')
  }

  const handleRestore = (id: string) => {
    onUpdate(pages.map(p => p.id === id ? { ...p, deleted: false, deleteReason: undefined } : p))
  }

  const handleAdd = () => {
    const newPage: PageBasicInfo = {
      id: `page-${Date.now()}`,
      name: '新頁面',
      urlPath: '/new-page',
      description: '頁面描述',
      notes: ''
    }
    onUpdate([...pages, newPage])
    handleEdit(newPage)
  }

  const activePages = pages.filter(p => !p.deleted)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          頁面列表 ({activePages.length} 個頁面
          {pages.length !== activePages.length && ` / ${pages.length - activePages.length} 個已移除`})
        </h2>
        <Button onClick={handleAdd} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          新增頁面
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pages.map((page) => (
          <Card
            key={page.id}
            className={`p-4 transition-all ${
              page.deleted
                ? 'opacity-50 bg-gray-50 dark:bg-gray-900'
                : ''
            }`}
          >
            {deletingId === page.id ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-red-600">確認移除頁面</h3>
                <p className="text-sm text-gray-600">
                  你確定要移除「{page.name}」嗎？
                </p>
                <div>
                  <label className="text-xs font-medium text-gray-600">移除理由（選填）</label>
                  <Textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="例如：太複雜了、不需要此功能、與其他頁面重複等"
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteConfirm}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    確認移除
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeleteCancel}
                  >
                    <X className="h-3 w-3 mr-1" />
                    取消
                  </Button>
                </div>
              </div>
            ) : editingId === page.id && editForm ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">頁面名稱</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">URL 路徑</label>
                  <Input
                    value={editForm.urlPath}
                    onChange={(e) => setEditForm({ ...editForm, urlPath: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">頁面描述</label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">備註（選填）</label>
                  <Textarea
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="例如：需要特別注重安全性、使用特定設計風格等"
                    rows={2}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-3 w-3 mr-1" />
                    儲存
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-3 w-3 mr-1" />
                    取消
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      <span className={page.deleted ? 'line-through' : ''}>
                        {page.name}
                      </span>
                      {page.deleted && <span className="ml-2 text-xs text-red-500 font-normal no-underline">（已移除）</span>}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{page.urlPath}</p>
                  </div>
                  <div className="flex gap-1">
                    {page.deleted ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRestore(page.id)}
                        className="text-green-600 hover:text-green-700"
                        title="恢復頁面"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(page)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(page.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{page.description}</p>
                {page.notes && !page.deleted && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-900">
                    <span className="font-medium">備註：</span>{page.notes}
                  </div>
                )}
                {page.deleted && page.deleteReason && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-900">
                    <span className="font-medium">移除理由：</span>{page.deleteReason}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={onConfirm} size="lg" className="flex-1">
          確認並生成詳細資訊
        </Button>
      </div>
    </div>
  )
}

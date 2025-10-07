import Link from 'next/link'
import { auth, signIn, signOut } from '@/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { FolderOpen } from 'lucide-react'

export async function UserHeader() {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className="flex items-center justify-end gap-3 mb-4">
        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/' })
          }}
        >
          <Button type="submit" variant="outline" size="sm">
            登入
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-3 mb-4">
      <Link href="/projects">
        <Button variant="ghost" size="sm">
          <FolderOpen className="h-4 w-4 mr-2" />
          我的專案
        </Button>
      </Link>
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
          <AvatarFallback>
            {session.user.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{session.user.name}</span>
      </div>
      <form
        action={async () => {
          'use server'
          await signOut({ redirectTo: '/' })
        }}
      >
        <Button type="submit" variant="outline" size="sm">
          登出
        </Button>
      </form>
    </div>
  )
}

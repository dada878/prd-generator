import Link from 'next/link'
import { auth, signIn, signOut } from '@/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FolderOpen, LogOut } from 'lucide-react'

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 active:bg-gray-200 data-[state=open]:bg-gray-100 dark:hover:bg-gray-800 dark:active:bg-gray-700 dark:data-[state=open]:bg-gray-800 transition-colors cursor-pointer outline-none border-none focus:outline-none focus:ring-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
              <AvatarFallback>
                {session.user.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{session.user.name}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link href="/projects" className="flex items-center cursor-pointer">
              <FolderOpen className="h-4 w-4 mr-2" />
              我的專案
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/' })
              }}
              className="w-full"
            >
              <button type="submit" className="flex items-center w-full cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                登出
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

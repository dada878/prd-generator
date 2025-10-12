import { UserHeader } from '@/components/user-header'
import { Toaster } from '@/components/ui/toaster'

export const dynamic = 'force-dynamic'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen w-full p-6">
      <UserHeader />
      {children}
      <Toaster />
    </div>
  )
}

import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (session?.user) {
    redirect('/projects')
  }

  return (
    <div className="w-full">
      {children}
    </div>
  )
}

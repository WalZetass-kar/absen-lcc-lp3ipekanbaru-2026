'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import { studentLogout } from '@/lib/student-actions'

export default function StudentLogoutButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  function handleLogout() {
    startTransition(async () => {
      await studentLogout()
      router.push('/auth/mahasiswa/login')
      router.refresh()
    })
  }
  
  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={isPending}>
      {isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <LogOut className="w-4 h-4 mr-2" />
          Keluar
        </>
      )}
    </Button>
  )
}

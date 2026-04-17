import { redirect } from 'next/navigation'
import { getStudentSession } from '@/lib/student-actions'
import { MahasiswaLoginClient } from './login-client'

export default async function MahasiswaLoginPage() {
  const session = await getStudentSession()

  if (session) {
    redirect('/student/dashboard')
  }

  return <MahasiswaLoginClient />
}

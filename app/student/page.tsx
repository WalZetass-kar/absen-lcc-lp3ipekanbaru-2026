import { redirect } from 'next/navigation'
import { getStudentSession } from '@/lib/student-actions'

export default async function StudentPage() {
  const session = await getStudentSession()
  redirect(session ? '/student/dashboard' : '/auth/mahasiswa/login')
}

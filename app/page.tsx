import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStudentSession } from '@/lib/student-actions'
import PublicLCCPage from './lcc/page'

export { metadata } from './lcc/page'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    // Check if this is a student or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    // If profile exists, user is admin
    if (profile) {
      redirect('/dashboard')
    } else {
      // Otherwise, user might be a student
      redirect('/student/dashboard')
    }
  }

  const studentSession = await getStudentSession()
  if (studentSession) {
    redirect('/student/dashboard')
  }

  // Domain utama menampilkan landing page publik LCC.
  return <PublicLCCPage />
}

import { createClient } from '@/lib/supabase/server'
import RekapClient from '@/components/dashboard/rekap-client'

export default async function RekapPage() {
  const supabase = await createClient()
  const [{ data: mahasiswa }, { data: absensi }] = await Promise.all([
    supabase.from('mahasiswa').select('*').order('nama'),
    supabase.from('absensi').select('*'),
  ])
  return <RekapClient mahasiswa={mahasiswa ?? []} absensi={absensi ?? []} />
}

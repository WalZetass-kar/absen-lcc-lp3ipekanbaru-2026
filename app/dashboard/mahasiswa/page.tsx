import { getMahasiswa } from '@/lib/actions'
import MahasiswaClient from '@/components/dashboard/mahasiswa-client'

export default async function MahasiswaPage() {
  const mahasiswa = await getMahasiswa()
  return <MahasiswaClient initialData={mahasiswa ?? []} />
}

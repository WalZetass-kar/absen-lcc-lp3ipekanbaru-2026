import { getMahasiswa } from '@/lib/actions'
import AbsensiClient from '@/components/dashboard/absensi-client'

export default async function AbsensiPage() {
  const mahasiswa = await getMahasiswa()
  return <AbsensiClient mahasiswaList={mahasiswa ?? []} />
}

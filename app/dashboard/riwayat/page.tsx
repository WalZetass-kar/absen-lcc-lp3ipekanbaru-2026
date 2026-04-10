import { getAbsensi } from '@/lib/actions'
import RiwayatClient from '@/components/dashboard/riwayat-client'

export default async function RiwayatPage() {
  const absensi = await getAbsensi()
  return <RiwayatClient initialData={absensi ?? []} />
}

import { getMeetingNotes } from '@/lib/actions'
import CatatanClient from '@/components/dashboard/catatan-client'

interface CatatanPageProps {
  searchParams: Promise<{ pertemuan?: string }>
}

export default async function CatatanPage({ searchParams }: CatatanPageProps) {
  const params = await searchParams
  const pertemuan = parseInt(params.pertemuan || '1')
  const notes = await getMeetingNotes(pertemuan)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Catatan Pembelajaran</h1>
        <p className="text-muted-foreground mt-2">Kelola catatan dan evaluasi setiap pertemuan</p>
      </div>

      <CatatanClient initialData={notes} initialPertemuan={pertemuan} />
    </div>
  )
}

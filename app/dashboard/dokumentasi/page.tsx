import { getDocumentation } from '@/lib/actions'
import DokumentasiClient from '@/components/dashboard/dokumentasi-client'

export default async function DokumentasiPage() {
  const docs = await getDocumentation()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dokumentasi Kegiatan</h1>
        <p className="text-muted-foreground mt-2">Kelola foto dan dokumentasi kegiatan pembelajaran</p>
      </div>

      <DokumentasiClient initialData={docs} />
    </div>
  )
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import QRManagementClient from '@/components/dashboard/qr-management-client'
import { getPertemuanWithQR, getPendingPermissionsWithDetails } from '@/lib/admin-actions'
import { QrCode, FileCheck } from 'lucide-react'

export const metadata = {
  title: 'Manajemen QR & Izin | Absensi LCC',
  description: 'Kelola QR code dan permintaan izin mahasiswa',
}

export default async function QRManagementPage() {
  const [pertemuanWithQR, pendingPermissions] = await Promise.all([
    getPertemuanWithQR(),
    getPendingPermissionsWithDetails(),
  ])

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Manajemen QR & Izin</h1>
        <p className="text-muted-foreground">Kelola QR code untuk absensi dan permintaan izin mahasiswa</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">QR Code Aktif</CardTitle>
              <CardDescription>Jumlah QR code yang aktif</CardDescription>
            </div>
            <QrCode className="w-8 h-8 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {pertemuanWithQR.reduce((sum, item) => sum + item.qr_codes.filter((qr) => qr.is_active).length, 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base">Permintaan Menunggu</CardTitle>
              <CardDescription>Permintaan izin yang belum diproses</CardDescription>
            </div>
            <FileCheck className="w-8 h-8 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingPermissions.length}</p>
          </CardContent>
        </Card>
      </div>

      <QRManagementClient
        initialPertemuan={pertemuanWithQR}
        initialPermissions={pendingPermissions}
      />
    </div>
  )
}

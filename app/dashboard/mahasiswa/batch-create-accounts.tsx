'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Loader2, CheckCircle2, XCircle } from 'lucide-react'

export function BatchCreateAccountsButton() {
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleBatchCreate() {
    if (!confirm('Buat akun untuk semua mahasiswa yang belum punya akun?')) {
      return
    }

    setIsCreating(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/batch-create-student-accounts', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal batch create')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={handleBatchCreate}
        disabled={isCreating}
        variant="outline"
        className="gap-2"
      >
        {isCreating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Membuat Akun...
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Batch Create Akun
          </>
        )}
      </Button>

      {error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Batch Create Selesai
            </CardTitle>
            <CardDescription>
              {result.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{result.successCount}</p>
                <p className="text-xs text-muted-foreground">Berhasil</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{result.errorCount}</p>
                <p className="text-xs text-muted-foreground">Gagal</p>
              </div>
            </div>

            {result.results && result.results.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <p className="text-sm font-medium">Detail:</p>
                {result.results.map((item: any, index: number) => (
                  <div
                    key={index}
                    className={`text-xs p-2 rounded ${
                      item.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {item.success ? '✅' : '❌'} {item.nama} ({item.nim})
                    {item.success && ` - ${item.email}`}
                    {!item.success && ` - ${item.error}`}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

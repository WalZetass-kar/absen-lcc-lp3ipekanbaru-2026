import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ensureMemberAuthUser, normalizeNim } from '@/lib/member-auth'

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient()

    // Get all mahasiswa without user_id
    const { data: mahasiswaList, error: fetchError } = await admin
      .from('mahasiswa')
      .select('id, nama, nim, prodi')
      .is('user_id', null)
      .not('nim', 'is', null)
      .neq('nim', '')

    if (fetchError) {
      console.error('Error fetching mahasiswa:', fetchError)
      return NextResponse.json({ error: 'Gagal mengambil data mahasiswa' }, { status: 500 })
    }

    if (!mahasiswaList || mahasiswaList.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Semua mahasiswa sudah memiliki akun',
        created: 0,
        total: 0,
      })
    }

    console.log(`[batch-create] Found ${mahasiswaList.length} mahasiswa without accounts`)

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const mahasiswa of mahasiswaList) {
      try {
        console.log(`[batch-create] Creating account for ${mahasiswa.nama} (${mahasiswa.nim})`)

        const normalizedNim = normalizeNim(mahasiswa.nim)

        // Create auth user
        const authUser = await ensureMemberAuthUser({
          memberId: mahasiswa.id,
          mustChangePassword: true,
          nama: mahasiswa.nama,
          nim: normalizedNim,
          prodi: mahasiswa.prodi,
        })

        // Update mahasiswa with user_id
        const { error: updateError } = await admin
          .from('mahasiswa')
          .update({ 
            user_id: authUser.userId,
            nim: normalizedNim,
          })
          .eq('id', mahasiswa.id)

        if (updateError) {
          throw updateError
        }

        results.push({
          id: mahasiswa.id,
          nama: mahasiswa.nama,
          nim: normalizedNim,
          success: true,
          created: authUser.created,
          email: authUser.email,
        })

        successCount++
        console.log(`[batch-create] ✅ Success: ${mahasiswa.nama}`)
      } catch (error) {
        console.error(`[batch-create] ❌ Failed for ${mahasiswa.nama}:`, error)
        
        results.push({
          id: mahasiswa.id,
          nama: mahasiswa.nama,
          nim: mahasiswa.nim,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Batch create completed: ${successCount} success, ${errorCount} failed`,
      total: mahasiswaList.length,
      successCount,
      errorCount,
      results,
    })
  } catch (error) {
    console.error('Batch create error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Terjadi kesalahan' 
    }, { status: 500 })
  }
}

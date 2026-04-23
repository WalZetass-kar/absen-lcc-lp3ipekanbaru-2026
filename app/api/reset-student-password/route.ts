import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeNim } from '@/lib/member-auth'

export async function POST(request: NextRequest) {
  try {
    const { nim } = await request.json()

    if (!nim) {
      return NextResponse.json({ error: 'NIM wajib diisi' }, { status: 400 })
    }

    const normalizedNim = normalizeNim(nim)
    const email = `${normalizedNim}@mcc.local`
    const admin = createAdminClient()

    console.log('[reset-student-password] Resetting password for:', { nim, normalizedNim, email })

    // Find user by email
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json({ error: 'Gagal mencari user' }, { status: 500 })
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      console.error('[reset-student-password] User not found:', email)
      return NextResponse.json({ error: `User tidak ditemukan di Supabase Auth dengan email ${email}` }, { status: 404 })
    }

    console.log('[reset-student-password] User found:', { userId: user.id, email: user.email })

    // Reset password to normalized NIM (lowercase)
    const password = normalizedNim

    console.log('[reset-student-password] Setting password to:', password)

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password,
      app_metadata: {
        ...user.app_metadata,
        must_change_password: true,
      },
    })

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ error: 'Gagal reset password: ' + updateError.message }, { status: 500 })
    }

    console.log('[reset-student-password] Password reset successful')

    return NextResponse.json({ 
      success: true, 
      message: `Password berhasil direset ke NIM (${normalizedNim}). Gunakan password ini untuk login.`,
      email,
      userId: user.id,
      password: normalizedNim, // Show password for debugging
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Terjadi kesalahan' 
    }, { status: 500 })
  }
}

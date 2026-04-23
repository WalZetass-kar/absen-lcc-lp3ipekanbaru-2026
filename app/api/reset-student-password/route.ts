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

    // Find user by email
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return NextResponse.json({ error: 'Gagal mencari user' }, { status: 500 })
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan di Supabase Auth' }, { status: 404 })
    }

    // Reset password to NIM
    let password = normalizedNim
    if (password.length < 6) {
      password = password.padEnd(6, '0')
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password,
      app_metadata: {
        ...user.app_metadata,
        must_change_password: true,
      },
    })

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ error: 'Gagal reset password' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Password berhasil direset ke NIM (${normalizedNim})`,
      email,
      userId: user.id,
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Terjadi kesalahan' 
    }, { status: 500 })
  }
}

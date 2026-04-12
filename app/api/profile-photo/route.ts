import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStudentSessionUserId } from '@/lib/student-session'

const BUCKET = 'profile-photos'
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png']

function getStoragePath(userId: string) {
  return `${userId}/avatar`
}

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data } = await admin.storage.getBucket(BUCKET)
  if (!data) {
    await admin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ACCEPTED_TYPES,
    })
  }
}

// GET — fetch current profile photo URL
export async function GET() {
  try {
    const userId = await getStudentSessionUserId()
    if (!userId) {
      return NextResponse.json({ url: null })
    }

    const admin = createAdminClient()
    const path = getStoragePath(userId)

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path)

    // Check if the file actually exists by listing
    const { data: files } = await admin.storage
      .from(BUCKET)
      .list(userId, { limit: 1, search: 'avatar' })

    if (!files || files.length === 0) {
      return NextResponse.json({ url: null })
    }

    // Append cache buster to avoid stale images
    const url = `${data.publicUrl}?t=${Date.now()}`
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ url: null })
  }
}

// POST — upload a new profile photo
export async function POST(request: NextRequest) {
  try {
    const userId = await getStudentSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Hanya file JPG dan PNG yang diperbolehkan' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Ukuran file maksimal 2MB' }, { status: 400 })
    }

    const admin = createAdminClient()
    await ensureBucket(admin)

    const path = getStoragePath(userId)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload (upsert to replace existing)
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Profile photo upload error:', uploadError)
      return NextResponse.json({ error: 'Gagal mengunggah foto' }, { status: 500 })
    }

    const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
    const url = `${data.publicUrl}?t=${Date.now()}`

    return NextResponse.json({ url })
  } catch (err) {
    console.error('Profile photo upload error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// DELETE — remove profile photo
export async function DELETE() {
  try {
    const userId = await getStudentSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 401 })
    }

    const admin = createAdminClient()
    const path = getStoragePath(userId)

    await admin.storage.from(BUCKET).remove([path])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Profile photo delete error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

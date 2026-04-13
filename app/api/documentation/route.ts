import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'

import { addDocumentation } from '@/lib/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'documentation-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function sanitizePathSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildStoragePath(tanggal: string, fileName: string) {
  const safeDate = sanitizePathSegment(tanggal) || 'tanpa-tanggal'
  const dotIndex = fileName.lastIndexOf('.')
  const baseName = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName
  const extension = dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : ''
  const safeName = sanitizePathSegment(baseName) || 'dokumentasi'

  return `${safeDate}/${Date.now()}-${randomUUID()}-${safeName}${extension}`
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Akses ditolak. Silakan login ulang sebagai admin.' }, { status: 401 })
    }

    const formData = await request.formData()
    const tanggal = String(formData.get('tanggal') ?? '').trim()
    const judul = String(formData.get('judul') ?? '').trim()
    const deskripsi = String(formData.get('deskripsi') ?? '').trim()
    const file = formData.get('file')

    if (!tanggal) {
      return NextResponse.json({ error: 'Tanggal wajib diisi.' }, { status: 400 })
    }

    if (!judul) {
      return NextResponse.json({ error: 'Judul wajib diisi.' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File gambar tidak ditemukan.' }, { status: 400 })
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Format gambar harus JPG, PNG, WEBP, atau GIF.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Ukuran file maksimal 5MB.' }, { status: 400 })
    }

    const admin = createAdminClient()
    await ensureBucket(admin)

    const filePath = buildStoragePath(tanggal, file.name)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Documentation upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message || 'Gagal mengunggah gambar dokumentasi.' }, { status: 500 })
    }

    const { data: publicUrlData } = admin.storage.from(BUCKET).getPublicUrl(filePath)

    try {
      const createdDoc = await addDocumentation(
        tanggal,
        judul,
        deskripsi,
        publicUrlData.publicUrl,
        filePath,
      )

      return NextResponse.json({ data: createdDoc })
    } catch (dbError) {
      await admin.storage.from(BUCKET).remove([filePath])
      console.error('Documentation metadata insert error:', dbError)
      return NextResponse.json({ error: dbError instanceof Error ? dbError.message : 'Gagal menyimpan metadata dokumentasi.' }, { status: 500 })
    }
  } catch (error) {
    console.error('Documentation route error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server saat upload dokumentasi.' }, { status: 500 })
  }
}

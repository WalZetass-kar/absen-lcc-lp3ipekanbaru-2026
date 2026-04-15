import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStudentSessionUserId } from '@/lib/student-session'
import { NextRequest, NextResponse } from 'next/server'

type PhotoTarget = {
  currentPhotoUrl: string | null
  id: string
  storagePrefix: string
  table: 'mahasiswa' | 'profiles'
}

function getStoredFileName(url: string | null) {
  return url?.split('/').pop() ?? null
}

async function resolvePhotoTarget() {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile, error } = await admin
      .from('profiles')
      .select('profile_photo_url')
      .eq('id', user.id)
      .maybeSingle()

    if (error) {
      throw error
    }

    return {
      admin,
      target: {
        currentPhotoUrl: profile?.profile_photo_url ?? null,
        id: user.id,
        storagePrefix: user.id,
        table: 'profiles',
      } satisfies PhotoTarget,
    }
  }

  const studentUserId = await getStudentSessionUserId()

  if (!studentUserId) {
    return { admin, target: null }
  }

  const { data: student, error } = await admin
    .from('mahasiswa')
    .select('id, profile_photo_url')
    .eq('user_id', studentUserId)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!student) {
    return { admin, target: null }
  }

  return {
    admin,
    target: {
      currentPhotoUrl: student.profile_photo_url ?? null,
      id: student.id,
      storagePrefix: `students/${student.id}`,
      table: 'mahasiswa',
    } satisfies PhotoTarget,
  }
}

async function updatePhotoReference(target: PhotoTarget, publicUrl: string | null) {
  const admin = createAdminClient()
  const { error } = await admin
    .from(target.table)
    .update({ profile_photo_url: publicUrl })
    .eq('id', target.id)

  return error
}

export async function GET() {
  try {
    const { target } = await resolvePhotoTarget()

    if (!target) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({ url: target.currentPhotoUrl })
  } catch (error) {
    console.error('Profile photo fetch error:', error)
    return NextResponse.json({
      error: 'Internal server error',
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { admin, target } = await resolvePhotoTarget()

    if (!target) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (2MB)
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 2MB.' 
      }, { status: 400 })
    }

    // Delete old photo if exists
    if (target.currentPhotoUrl) {
      const oldPath = getStoredFileName(target.currentPhotoUrl)
      if (oldPath) {
        await admin.storage
          .from('profile-photos')
          .remove([`${target.storagePrefix}/${oldPath}`])
      }
    }

    // Upload new photo
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${target.storagePrefix}/${fileName}`

    const { error: uploadError } = await admin.storage
      .from('profile-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ 
        error: 'Failed to upload file' 
      }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = admin.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    const updateError = await updatePhotoReference(target, publicUrl)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update profile' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl 
    })

  } catch (error) {
    console.error('Profile photo upload error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { admin, target } = await resolvePhotoTarget()

    if (!target) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete photo from storage
    if (target.currentPhotoUrl) {
      const oldPath = getStoredFileName(target.currentPhotoUrl)
      if (oldPath) {
        await admin.storage
          .from('profile-photos')
          .remove([`${target.storagePrefix}/${oldPath}`])
      }
    }

    const updateError = await updatePhotoReference(target, null)

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update profile' 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Profile photo delete error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

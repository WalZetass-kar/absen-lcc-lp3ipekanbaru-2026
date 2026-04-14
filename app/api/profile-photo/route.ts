import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
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

    // Get current profile to check for old photo
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_photo_url')
      .eq('id', user.id)
      .single()

    // Delete old photo if exists
    if (profile?.profile_photo_url) {
      const oldPath = profile.profile_photo_url.split('/').pop()
      if (oldPath) {
        await supabase.storage
          .from('profile-photos')
          .remove([`${user.id}/${oldPath}`])
      }
    }

    // Upload new photo
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
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
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    // Update profile with new photo URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_photo_url: publicUrl })
      .eq('id', user.id)

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
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_photo_url')
      .eq('id', user.id)
      .single()

    // Delete photo from storage
    if (profile?.profile_photo_url) {
      const oldPath = profile.profile_photo_url.split('/').pop()
      if (oldPath) {
        await supabase.storage
          .from('profile-photos')
          .remove([`${user.id}/${oldPath}`])
      }
    }

    // Update profile to remove photo URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_photo_url: null })
      .eq('id', user.id)

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

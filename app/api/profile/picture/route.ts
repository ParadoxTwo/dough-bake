import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's role
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = (currentProfile as { role: 'customer' | 'admin' } | null)?.role === 'admin'

    // Get target user ID from form data (for admin) or use current user
    const formData = await request.formData()
    const targetUserId = formData.get('userId') as string | null
    const file = formData.get('file') as File

    // Determine which user's profile to update
    const userId = (isAdmin && targetUserId) ? targetUserId : user.id

    // Get target user's profile to get username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, role')
      .eq('id', userId)
      .single()

    const typedProfile = profile as { username: string | null; role: 'customer' | 'admin' } | null
    if (profileError || !typedProfile || !typedProfile.username) {
      return NextResponse.json({ error: 'Profile not found or username missing' }, { status: 404 })
    }

    // Check permission: admin can update any profile, users can only update their own
    if (!isAdmin && userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    const username = typedProfile.username
    const fileExt = file.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const fileName = `profile-${timestamp}.${fileExt}`
    const storagePath = `${username}/${fileName}`

    // Delete old profile picture if exists
    const { data: oldProfile } = await supabase
      .from('profiles')
      .select('profile_picture_url')
      .eq('id', userId)
      .single()

    const typedOldProfile = oldProfile as { profile_picture_url: string | null } | null
    if (typedOldProfile?.profile_picture_url) {
      // Extract path from URL
      const oldUrl = typedOldProfile.profile_picture_url
      const oldPathMatch = oldUrl.match(/profiles\/(.+)$/)
      if (oldPathMatch) {
        const oldPath = oldPathMatch[1]
        // List all files in the user's folder and delete them
        const { data: files } = await supabase.storage
          .from('profiles')
          .list(username)
        
        if (files) {
          const filesToDelete = files.map(f => `${username}/${f.name}`)
          await supabase.storage
            .from('profiles')
            .remove(filesToDelete)
        }
      }
    }

    // Upload new profile picture
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profiles')
      .getPublicUrl(storagePath)

    // Update profile with new picture URL
    // Type assertion needed because Supabase's type inference doesn't always work correctly
    const profilesUpdateQuery = supabase.from('profiles') as unknown as {
      update: (values: { profile_picture_url: string }) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
      }
    }
    const { error: updateError } = await profilesUpdateQuery
      .update({ profile_picture_url: publicUrl })
      .eq('id', userId)

    if (updateError) {
      // Try to delete uploaded file if update fails
      await supabase.storage.from('profiles').remove([storagePath])
      return NextResponse.json(
        { error: `Failed to update profile: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    console.error('Profile picture upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload profile picture' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's role
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = (currentProfile as { role: 'customer' | 'admin' } | null)?.role === 'admin'

    // Get target user ID from request body (for admin) or use current user
    const body = await request.json().catch(() => ({}))
    const targetUserId = body.userId || user.id

    // Check permission: admin can delete any profile picture, users can only delete their own
    if (!isAdmin && targetUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get target user's profile to get username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, profile_picture_url')
      .eq('id', targetUserId)
      .single()

    const typedProfile = profile as { username: string | null; profile_picture_url: string | null } | null
    if (profileError || !typedProfile || !typedProfile.username) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Delete all files in user's profile folder
    const { data: files } = await supabase.storage
      .from('profiles')
      .list(typedProfile.username)

    if (files && files.length > 0) {
      const filesToDelete = files.map(f => `${typedProfile.username}/${f.name}`)
      await supabase.storage
        .from('profiles')
        .remove(filesToDelete)
    }

    // Update profile to remove picture URL
    // Type assertion needed because Supabase's type inference doesn't always work correctly
    const profilesUpdateQuery = supabase.from('profiles') as unknown as {
      update: (values: { profile_picture_url: null }) => {
        eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
      }
    }
    await profilesUpdateQuery
      .update({ profile_picture_url: null })
      .eq('id', targetUserId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile picture delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete profile picture' },
      { status: 500 }
    )
  }
}


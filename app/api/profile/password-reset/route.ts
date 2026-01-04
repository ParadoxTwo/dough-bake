import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const typedProfile = profile as { role: 'customer' | 'admin' } | null
    if (profileError || !typedProfile || typedProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Get the target user's email
    const { data: targetUser, error: userError } = await supabase.auth.admin.getUserById(userId)

    if (userError || !targetUser || !targetUser.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Send password reset email using the standard method
    // Note: This requires the service role key for admin operations
    // For now, we'll use resetPasswordForEmail which works with anon key
    const { error: emailError } = await supabase.auth.resetPasswordForEmail(targetUser.user.email!, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
    })

    if (emailError) {
      return NextResponse.json(
        { error: `Failed to send email: ${emailError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Password reset email sent' })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send password reset email' },
      { status: 500 }
    )
  }
}


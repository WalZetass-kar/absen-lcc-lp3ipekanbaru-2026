-- Migration: Auto Create Student Account
-- Description: Function untuk otomatis membuat akun mahasiswa di Supabase Auth

-- Function untuk membuat akun mahasiswa
-- Dipanggil dari aplikasi setelah insert mahasiswa
CREATE OR REPLACE FUNCTION public.ensure_student_auth_account(
  p_mahasiswa_id uuid,
  p_nim text,
  p_nama text,
  p_prodi text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_email text;
  v_password text;
  v_user_id uuid;
  v_normalized_nim text;
BEGIN
  -- Normalize NIM (lowercase, trim)
  v_normalized_nim := lower(trim(p_nim));
  
  -- Build email
  v_email := v_normalized_nim || '@mcc.local';
  
  -- Set password = NIM (padded if < 6 chars)
  v_password := v_normalized_nim;
  IF length(v_password) < 6 THEN
    v_password := rpad(v_password, 6, '0');
  END IF;
  
  -- Check if user already exists
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NOT NULL THEN
    -- User already exists, just update mahasiswa.user_id
    UPDATE public.mahasiswa
    SET user_id = v_user_id, nim = v_normalized_nim
    WHERE id = p_mahasiswa_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'created', false,
      'user_id', v_user_id,
      'email', v_email,
      'message', 'User already exists, linked to mahasiswa'
    );
  END IF;
  
  -- Create new user in auth.users
  -- Note: This requires service_role access
  -- We'll return info for the app to create the user
  RETURN jsonb_build_object(
    'success', false,
    'created', false,
    'email', v_email,
    'password', v_password,
    'nim', v_normalized_nim,
    'message', 'User needs to be created via Supabase Auth API'
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.ensure_student_auth_account(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_student_auth_account(uuid, text, text, text) TO service_role;

-- Comment
COMMENT ON FUNCTION public.ensure_student_auth_account IS 'Ensure student has auth account. Returns info for app to create user if needed.';

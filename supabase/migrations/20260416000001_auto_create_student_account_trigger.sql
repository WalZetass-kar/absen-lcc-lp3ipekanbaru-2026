-- Migration: Auto Create Student Account Trigger
-- Description: Automatically create Supabase Auth account when a new mahasiswa is inserted
-- Date: 2026-04-16

-- This migration creates a trigger that automatically creates a Supabase Auth account
-- whenever a new mahasiswa record is inserted with a NIM but without a user_id.

-- Note: This trigger uses the auth.users table which requires service_role permissions.
-- The trigger function will only work if executed with proper permissions.

-- Create or replace the function that creates auth accounts
CREATE OR REPLACE FUNCTION public.auto_create_student_auth_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_normalized_nim TEXT;
  v_email TEXT;
  v_password TEXT;
  v_user_id UUID;
  v_existing_user_id UUID;
BEGIN
  -- Only proceed if NIM is provided and user_id is NULL
  IF NEW.nim IS NULL OR NEW.nim = '' OR NEW.user_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Normalize NIM (lowercase, trim)
  v_normalized_nim := LOWER(TRIM(NEW.nim));
  
  -- Build email
  v_email := v_normalized_nim || '@mcc.local';
  
  -- Set password (NIM, padded to 6 chars if needed)
  v_password := v_normalized_nim;
  IF LENGTH(v_password) < 6 THEN
    v_password := RPAD(v_password, 6, '0');
  END IF;

  -- Check if user already exists
  SELECT id INTO v_existing_user_id
  FROM auth.users
  WHERE email = v_email
  LIMIT 1;

  IF v_existing_user_id IS NOT NULL THEN
    -- User already exists, just link it
    NEW.user_id := v_existing_user_id;
    NEW.nim := v_normalized_nim;
    
    -- Update user metadata
    UPDATE auth.users
    SET 
      user_metadata = jsonb_build_object(
        'nim', v_normalized_nim,
        'nama', NEW.nama,
        'prodi', NEW.prodi
      ),
      app_metadata = jsonb_build_object(
        'account_type', 'member',
        'member_id', NEW.id,
        'must_change_password', true
      ),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = v_existing_user_id;
    
    RETURN NEW;
  END IF;

  -- Create new auth user
  BEGIN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      NOW(),
      jsonb_build_object(
        'account_type', 'member',
        'member_id', NEW.id,
        'must_change_password', true
      ),
      jsonb_build_object(
        'nim', v_normalized_nim,
        'nama', NEW.nama,
        'prodi', NEW.prodi
      ),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO v_user_id;

    -- Update the mahasiswa record with the new user_id
    NEW.user_id := v_user_id;
    NEW.nim := v_normalized_nim;

    RAISE NOTICE 'Auto-created auth account for mahasiswa: % (NIM: %, user_id: %)', NEW.nama, v_normalized_nim, v_user_id;

  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to auto-create auth account for mahasiswa % (NIM: %): %', NEW.nama, NEW.nim, SQLERRM;
    -- Still normalize the NIM even if auth creation failed
    NEW.nim := v_normalized_nim;
  END;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_create_student_auth_account ON public.mahasiswa;

-- Create the trigger
CREATE TRIGGER trigger_auto_create_student_auth_account
  BEFORE INSERT ON public.mahasiswa
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_student_auth_account();

-- Add comment
COMMENT ON FUNCTION public.auto_create_student_auth_account() IS 
  'Automatically creates a Supabase Auth account when a new mahasiswa is inserted with a NIM. Password is set to NIM (padded to 6 chars if needed).';

COMMENT ON TRIGGER trigger_auto_create_student_auth_account ON public.mahasiswa IS
  'Trigger that automatically creates auth accounts for new mahasiswa records';

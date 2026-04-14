-- Migration: Add delete_admin_user function
-- Description: Menambahkan fungsi untuk menghapus akun admin dari sistem
-- Date: 2026-04-14

-- ============================================================================
-- Function: delete_admin_user
-- Description: Menghapus admin user dari auth.users dan auth.identities
-- Security: Hanya super_admin yang bisa menghapus admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.delete_admin_user(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_requester_id uuid := auth.uid();
  v_is_super_admin boolean := false;
BEGIN
  -- Cek apakah requester adalah super_admin
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = v_requester_id
      AND role = 'super_admin'
  )
  INTO v_is_super_admin;

  -- Hanya super_admin yang bisa menghapus admin
  IF NOT v_is_super_admin THEN
    RAISE EXCEPTION 'Unauthorized: Hanya super admin yang dapat menghapus akun admin';
  END IF;

  -- Tidak bisa menghapus akun sendiri
  IF p_user_id = v_requester_id THEN
    RAISE EXCEPTION 'Tidak bisa menghapus akun sendiri';
  END IF;

  -- Hapus dari auth.identities terlebih dahulu
  DELETE FROM auth.identities WHERE user_id = p_user_id;
  
  -- Hapus dari auth.users (profile akan terhapus otomatis karena cascade)
  DELETE FROM auth.users WHERE id = p_user_id;
  
END;
$$;

-- Grant permission untuk authenticated users
GRANT EXECUTE ON FUNCTION public.delete_admin_user(uuid) TO authenticated;

-- Tambahkan comment untuk dokumentasi
COMMENT ON FUNCTION public.delete_admin_user(uuid) IS 
'Menghapus akun admin dari sistem. Hanya dapat dipanggil oleh super_admin dan tidak bisa menghapus akun sendiri.';

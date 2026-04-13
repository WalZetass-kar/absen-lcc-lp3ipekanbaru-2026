/*
  # Public read policies for LCC landing content

  The public `/lcc` page reads from `documentation`, `activity_documentation`,
  and `announcements` using the anonymous Supabase key when visitors are not
  logged in. Existing policies only allowed `authenticated`, so public visitors
  saw empty content even though rows existed.

  This migration opens read-only access for anon/authenticated users while
  keeping write operations restricted to authenticated admins.
*/

ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Documentation viewable by authenticated users" ON public.documentation;
DROP POLICY IF EXISTS "Documentation viewable by everyone" ON public.documentation;
CREATE POLICY "Documentation viewable by everyone"
  ON public.documentation FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER TABLE public.activity_documentation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Activity documentation viewable by authenticated users" ON public.activity_documentation;
DROP POLICY IF EXISTS "Activity documentation viewable by everyone" ON public.activity_documentation;
CREATE POLICY "Activity documentation viewable by everyone"
  ON public.activity_documentation FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Announcements viewable by authenticated users" ON public.announcements;
DROP POLICY IF EXISTS "Announcements viewable by everyone" ON public.announcements;
CREATE POLICY "Announcements viewable by everyone"
  ON public.announcements FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

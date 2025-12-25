/*
  # Fix RLS Policies to Use Profile Role
  
  ## Problem
  Current policies check `auth.jwt()->>'user_role'` which doesn't exist.
  The role is stored in the `profiles` table, not in JWT metadata.
  
  ## Solution
  1. Create a helper function `get_current_user_role()` that efficiently retrieves the user's role
  2. Update all RLS policies to use this function instead of JWT metadata
  3. Maintains performance by caching the role lookup within the query
  
  ## Changes
  - Create `get_current_user_role()` function
  - Update all policies on: profiles, categories, devices, settings, projects, project_comments, project_inquiries
  
  ## Security
  - Maintains same access control logic
  - Properly validates user roles from the profiles table
  - Efficiently cached per query execution
*/

-- ============================================================================
-- PART 1: CREATE HELPER FUNCTION
-- ============================================================================

-- Function to get the current user's role efficiently
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- PART 2: UPDATE RLS POLICIES - PROFILES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
    AND id != auth.uid()
  );

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
  )
  WITH CHECK (
    get_current_user_role() = 'admin'
  );

-- ============================================================================
-- PART 3: UPDATE RLS POLICIES - CATEGORIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
  )
  WITH CHECK (
    get_current_user_role() = 'admin'
  );

-- ============================================================================
-- PART 4: UPDATE RLS POLICIES - DEVICES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can delete devices" ON public.devices;
CREATE POLICY "Admins can delete devices"
  ON public.devices
  FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Admins can insert devices" ON public.devices;
CREATE POLICY "Admins can insert devices"
  ON public.devices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Admins can update devices" ON public.devices;
CREATE POLICY "Admins can update devices"
  ON public.devices
  FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
  )
  WITH CHECK (
    get_current_user_role() = 'admin'
  );

-- ============================================================================
-- PART 5: UPDATE RLS POLICIES - SETTINGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
CREATE POLICY "Admins can update settings"
  ON public.settings
  FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
  )
  WITH CHECK (
    get_current_user_role() = 'admin'
  );

-- ============================================================================
-- PART 6: UPDATE RLS POLICIES - PROJECTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins and sales managers can update all projects" ON public.projects;
CREATE POLICY "Admins and sales managers can update all projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'sales_manager')
  )
  WITH CHECK (
    get_current_user_role() IN ('admin', 'sales_manager')
  );

DROP POLICY IF EXISTS "Admins and sales managers can view all projects" ON public.projects;
CREATE POLICY "Admins and sales managers can view all projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'sales_manager')
  );

DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
CREATE POLICY "Admins can delete projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
  );

-- ============================================================================
-- PART 7: UPDATE RLS POLICIES - PROJECT_COMMENTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can insert comments on accessible projects" ON public.project_comments;
CREATE POLICY "Authenticated users can insert comments on accessible projects"
  ON public.project_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_comments.project_id
      AND (
        projects.created_by_user_id = (SELECT auth.uid())
        OR get_current_user_role() IN ('admin', 'sales_manager')
      )
    )
  );

DROP POLICY IF EXISTS "Users can view comments on projects they can access" ON public.project_comments;
CREATE POLICY "Users can view comments on projects they can access"
  ON public.project_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_comments.project_id
      AND (
        projects.created_by_user_id = (SELECT auth.uid())
        OR get_current_user_role() IN ('admin', 'sales_manager')
      )
    )
  );

-- ============================================================================
-- PART 8: UPDATE RLS POLICIES - PROJECT_INQUIRIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update inquiries" ON public.project_inquiries;
CREATE POLICY "Admins can update inquiries"
  ON public.project_inquiries
  FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
  )
  WITH CHECK (
    get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.project_inquiries;
CREATE POLICY "Admins can view all inquiries"
  ON public.project_inquiries
  FOR SELECT
  TO authenticated
  USING (
    get_current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Users can view inquiries on their projects" ON public.project_inquiries;
CREATE POLICY "Users can view inquiries on their projects"
  ON public.project_inquiries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_inquiries.project_id
      AND projects.created_by_user_id = (SELECT auth.uid())
    )
  );
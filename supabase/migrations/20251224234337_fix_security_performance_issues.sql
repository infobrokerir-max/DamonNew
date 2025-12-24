/*
  # Fix Security and Performance Issues

  ## Changes Made

  ### 1. Add Missing Foreign Key Indexes
  - `project_comments.author_user_id` - improves comment queries by author
  - `project_comments.parent_comment_id` - improves threaded comment queries
  - `project_inquiries.category_id` - improves inquiry filtering by category
  - `project_inquiries.device_id` - improves inquiry filtering by device
  - `project_inquiries.requested_by_user_id` - improves user inquiry queries
  - `projects.approval_decision_by` - improves approval tracking queries
  - `projects.assigned_sales_manager_id` - improves sales manager assignment queries

  ### 2. Optimize RLS Policies
  - Wrap all `auth.uid()` calls with `(select auth.uid())` to prevent re-evaluation per row
  - Wrap all `auth.jwt()` calls with `(select auth.jwt())` to prevent re-evaluation per row
  - This dramatically improves query performance at scale

  ### 3. Impact
  - Foreign key indexes: Faster JOIN operations and foreign key constraint checks
  - RLS optimization: Reduces function calls from O(n) to O(1) per query
  - Both changes are backwards compatible and non-breaking
*/

-- ============================================================================
-- PART 1: ADD MISSING INDEXES FOR FOREIGN KEYS
-- ============================================================================

-- Indexes for project_comments table
CREATE INDEX IF NOT EXISTS idx_project_comments_author_user_id 
  ON public.project_comments(author_user_id);

CREATE INDEX IF NOT EXISTS idx_project_comments_parent_comment_id 
  ON public.project_comments(parent_comment_id);

-- Indexes for project_inquiries table
CREATE INDEX IF NOT EXISTS idx_project_inquiries_category_id 
  ON public.project_inquiries(category_id);

CREATE INDEX IF NOT EXISTS idx_project_inquiries_device_id 
  ON public.project_inquiries(device_id);

CREATE INDEX IF NOT EXISTS idx_project_inquiries_requested_by_user_id 
  ON public.project_inquiries(requested_by_user_id);

-- Indexes for projects table
CREATE INDEX IF NOT EXISTS idx_projects_approval_decision_by 
  ON public.projects(approval_decision_by);

CREATE INDEX IF NOT EXISTS idx_projects_assigned_sales_manager_id 
  ON public.projects(assigned_sales_manager_id);

-- ============================================================================
-- PART 2: OPTIMIZE RLS POLICIES - PROFILES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  );

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  );

DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can update profiles"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  );

-- ============================================================================
-- PART 3: OPTIMIZE RLS POLICIES - CATEGORIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can delete categories" ON public.categories;
CREATE POLICY "Admins can delete categories"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  );

DROP POLICY IF EXISTS "Admins can insert categories" ON public.categories;
CREATE POLICY "Admins can insert categories"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  );

DROP POLICY IF EXISTS "Admins can update categories" ON public.categories;
CREATE POLICY "Admins can update categories"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  );

-- ============================================================================
-- PART 4: OPTIMIZE RLS POLICIES - DEVICES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can delete devices" ON public.devices;
CREATE POLICY "Admins can delete devices"
  ON public.devices
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  );

DROP POLICY IF EXISTS "Admins can insert devices" ON public.devices;
CREATE POLICY "Admins can insert devices"
  ON public.devices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  );

DROP POLICY IF EXISTS "Admins can update devices" ON public.devices;
CREATE POLICY "Admins can update devices"
  ON public.devices
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  );

-- ============================================================================
-- PART 5: OPTIMIZE RLS POLICIES - SETTINGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
CREATE POLICY "Admins can update settings"
  ON public.settings
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  );

-- ============================================================================
-- PART 6: OPTIMIZE RLS POLICIES - PROJECTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins and sales managers can update all projects" ON public.projects;
CREATE POLICY "Admins and sales managers can update all projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'user_role') IN ('admin', 'sales_manager')
  )
  WITH CHECK (
    (SELECT auth.jwt()->>'user_role') IN ('admin', 'sales_manager')
  );

DROP POLICY IF EXISTS "Admins and sales managers can view all projects" ON public.projects;
CREATE POLICY "Admins and sales managers can view all projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'user_role') IN ('admin', 'sales_manager')
  );

DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
CREATE POLICY "Admins can delete projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  );

DROP POLICY IF EXISTS "All authenticated users can insert projects" ON public.projects;
CREATE POLICY "All authenticated users can insert projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Employees can view their own projects" ON public.projects;
CREATE POLICY "Employees can view their own projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    created_by_user_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "Project creators can update their own projects" ON public.projects;
CREATE POLICY "Project creators can update their own projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    created_by_user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    created_by_user_id = (SELECT auth.uid())
  );

-- ============================================================================
-- PART 7: OPTIMIZE RLS POLICIES - PROJECT_COMMENTS TABLE
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
        OR (SELECT auth.jwt()->>'user_role') IN ('admin', 'sales_manager')
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
        OR (SELECT auth.jwt()->>'user_role') IN ('admin', 'sales_manager')
      )
    )
  );

-- ============================================================================
-- PART 8: OPTIMIZE RLS POLICIES - PROJECT_INQUIRIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update inquiries" ON public.project_inquiries;
CREATE POLICY "Admins can update inquiries"
  ON public.project_inquiries
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  );

DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.project_inquiries;
CREATE POLICY "Admins can view all inquiries"
  ON public.project_inquiries
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'user_role') = 'admin'
  );

DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON public.project_inquiries;
CREATE POLICY "Authenticated users can create inquiries"
  ON public.project_inquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requested_by_user_id = (SELECT auth.uid())
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
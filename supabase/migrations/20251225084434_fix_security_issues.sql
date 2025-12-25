/*
  # Fix Security and Performance Issues

  1. Missing Indexes
    - Add indexes on foreign keys in project_comments, project_inquiries, and projects
    - Improves query performance for joins and lookups
  
  2. RLS Policy Optimization
    - Replace auth.uid() with (select auth.uid()) in policies
    - Prevents repeated function evaluation per row
    - Significantly improves performance at scale
  
  3. Function Security
    - Update function search_path to be immutable
    - Prevents search_path injection attacks
*/

-- Add missing indexes on foreign keys
CREATE INDEX IF NOT EXISTS idx_project_comments_author_user_id 
  ON project_comments(author_user_id);

CREATE INDEX IF NOT EXISTS idx_project_comments_parent_comment_id 
  ON project_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_project_inquiries_category_id 
  ON project_inquiries(category_id);

CREATE INDEX IF NOT EXISTS idx_project_inquiries_device_id 
  ON project_inquiries(device_id);

CREATE INDEX IF NOT EXISTS idx_project_inquiries_requested_by_user_id 
  ON project_inquiries(requested_by_user_id);

CREATE INDEX IF NOT EXISTS idx_projects_approval_decision_by 
  ON projects(approval_decision_by);

CREATE INDEX IF NOT EXISTS idx_projects_assigned_sales_manager_id 
  ON projects(assigned_sales_manager_id);

-- Drop old policies to recreate with optimized auth calls
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Employees can view their own projects" ON projects;
DROP POLICY IF EXISTS "All authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Project creators can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view comments on projects they can access" ON project_comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments on accessible projects" ON project_comments;
DROP POLICY IF EXISTS "Users can view inquiries on their projects" ON project_inquiries;
DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON project_inquiries;

-- Recreate policies with optimized auth calls
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (get_current_user_role() = 'admin' AND id != (select auth.uid()));

CREATE POLICY "Employees can view their own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (created_by_user_id = (select auth.uid()));

CREATE POLICY "All authenticated users can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by_user_id = (select auth.uid()));

CREATE POLICY "Project creators can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (created_by_user_id = (select auth.uid()))
  WITH CHECK (created_by_user_id = (select auth.uid()));

CREATE POLICY "Users can view comments on projects they can access"
  ON project_comments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_comments.project_id 
    AND (projects.created_by_user_id = (select auth.uid()) 
      OR get_current_user_role() IN ('admin', 'sales_manager'))
  ));

CREATE POLICY "Authenticated users can insert comments on accessible projects"
  ON project_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    author_user_id = (select auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_comments.project_id 
      AND (projects.created_by_user_id = (select auth.uid()) 
        OR get_current_user_role() IN ('admin', 'sales_manager'))
    )
  );

CREATE POLICY "Users can view inquiries on their projects"
  ON project_inquiries FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = project_inquiries.project_id 
    AND projects.created_by_user_id = (select auth.uid())
  ));

CREATE POLICY "Authenticated users can create inquiries"
  ON project_inquiries FOR INSERT
  TO authenticated
  WITH CHECK (requested_by_user_id = (select auth.uid()));

-- Update functions with proper security settings
CREATE OR REPLACE FUNCTION get_current_user_role()
  RETURNS text
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
    SELECT role FROM profiles WHERE id = auth.uid();
  $$;

CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
  $$;

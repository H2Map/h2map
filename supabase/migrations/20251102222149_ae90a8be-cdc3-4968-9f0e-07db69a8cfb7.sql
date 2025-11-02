-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('master_admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user email
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = _user_id
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Only master admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'master_admin'));

-- Update favorite_locations policies to allow master admin access
DROP POLICY IF EXISTS "Users can view their own favorite locations" ON public.favorite_locations;
DROP POLICY IF EXISTS "Users can insert their own favorite locations" ON public.favorite_locations;
DROP POLICY IF EXISTS "Users can delete their own favorite locations" ON public.favorite_locations;

CREATE POLICY "Users and master admins can view favorite locations"
ON public.favorite_locations
FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'master_admin')
);

CREATE POLICY "Users can insert their own favorite locations"
ON public.favorite_locations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and master admins can delete favorite locations"
ON public.favorite_locations
FOR DELETE
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'master_admin')
);

-- Insert master admin roles for the specified emails
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'master_admin'::app_role
FROM auth.users
WHERE email IN ('feelipebrx@gmail.com', 'mandinhat.amanda@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;
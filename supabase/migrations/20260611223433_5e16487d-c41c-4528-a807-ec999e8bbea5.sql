
-- Enum for roles
CREATE TYPE public.user_role AS ENUM ('driver', 'mechanic');
CREATE TYPE public.sos_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL,
  full_name text NOT NULL DEFAULT '',
  phone text,
  vehicle_info text,
  specialization text,
  is_online boolean NOT NULL DEFAULT false,
  last_lat double precision,
  last_lng double precision,
  total_earnings numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles readable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- SOS REQUESTS
CREATE TABLE public.sos_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mechanic_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.sos_status NOT NULL DEFAULT 'pending',
  issue_type text NOT NULL,
  notes text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sos_requests TO authenticated;
GRANT ALL ON public.sos_requests TO service_role;
ALTER TABLE public.sos_requests ENABLE ROW LEVEL SECURITY;
-- Drivers see their own, mechanics see all pending or ones assigned to them
CREATE POLICY "Driver sees own requests" ON public.sos_requests FOR SELECT TO authenticated USING (auth.uid() = driver_id);
CREATE POLICY "Mechanic sees pending or assigned" ON public.sos_requests FOR SELECT TO authenticated USING (
  status = 'pending' OR auth.uid() = mechanic_id
);
CREATE POLICY "Driver creates SOS" ON public.sos_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Driver updates own SOS" ON public.sos_requests FOR UPDATE TO authenticated USING (auth.uid() = driver_id) WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Mechanic claims or updates assigned SOS" ON public.sos_requests FOR UPDATE TO authenticated
  USING (auth.uid() = mechanic_id OR (status = 'pending' AND mechanic_id IS NULL))
  WITH CHECK (auth.uid() = mechanic_id);

-- MESSAGES
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_id uuid NOT NULL REFERENCES public.sos_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read messages" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.sos_requests s WHERE s.id = sos_id AND (s.driver_id = auth.uid() OR s.mechanic_id = auth.uid()))
);
CREATE POLICY "Participants send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.sos_requests s WHERE s.id = sos_id AND (s.driver_id = auth.uid() OR s.mechanic_id = auth.uid())
  )
);

-- RATINGS
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_id uuid NOT NULL REFERENCES public.sos_requests(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ratee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stars integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sos_id, rater_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated reads ratings" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create ratings as themselves" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = rater_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER sos_touch BEFORE UPDATE ON public.sos_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'driver'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_requests;

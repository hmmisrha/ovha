
-- 1) Profiles: restrict full row to self; expose safe public view for partner lookups
DROP POLICY IF EXISTS "Profiles readable by authenticated users" ON public.profiles;
CREATE POLICY "Users read own full profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT id, full_name, role, specialization, is_online
FROM public.profiles;
GRANT SELECT ON public.profiles_public TO authenticated;

-- 2) Ratings: only rater or ratee can read
DROP POLICY IF EXISTS "Anyone authenticated reads ratings" ON public.ratings;
CREATE POLICY "Rater or ratee read ratings" ON public.ratings
  FOR SELECT TO authenticated
  USING (auth.uid() = rater_id OR auth.uid() = ratee_id);

-- 3) SOS state-manipulation: validation trigger restricting what drivers can change
CREATE OR REPLACE FUNCTION public.sos_validate_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN NEW; END IF;

  -- Driver acting (not the assigned mechanic): restrict allowed changes
  IF uid = OLD.driver_id AND uid IS DISTINCT FROM OLD.mechanic_id THEN
    IF NEW.driver_id IS DISTINCT FROM OLD.driver_id THEN
      RAISE EXCEPTION 'Drivers cannot reassign driver_id';
    END IF;
    IF NEW.mechanic_id IS DISTINCT FROM OLD.mechanic_id THEN
      RAISE EXCEPTION 'Drivers cannot set mechanic_id';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
      RAISE EXCEPTION 'Drivers can only cancel their SOS';
    END IF;
  END IF;

  -- Mechanic acting: cannot reassign driver, can only set themselves as mechanic
  IF uid = COALESCE(NEW.mechanic_id, OLD.mechanic_id) AND uid <> OLD.driver_id THEN
    IF NEW.driver_id IS DISTINCT FROM OLD.driver_id THEN
      RAISE EXCEPTION 'Mechanics cannot change driver_id';
    END IF;
    IF NEW.mechanic_id IS DISTINCT FROM OLD.mechanic_id
       AND NEW.mechanic_id IS DISTINCT FROM uid THEN
      RAISE EXCEPTION 'Mechanics can only assign themselves';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sos_validate_update_trigger ON public.sos_requests;
CREATE TRIGGER sos_validate_update_trigger
BEFORE UPDATE ON public.sos_requests
FOR EACH ROW EXECUTE FUNCTION public.sos_validate_update();

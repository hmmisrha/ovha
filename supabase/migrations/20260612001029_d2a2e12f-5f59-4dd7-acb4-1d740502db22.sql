
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT
  id,
  full_name,
  role,
  specialization,
  is_online,
  CASE WHEN role = 'mechanic' AND is_online THEN last_lat ELSE NULL END AS last_lat,
  CASE WHEN role = 'mechanic' AND is_online THEN last_lng ELSE NULL END AS last_lng
FROM public.profiles;
GRANT SELECT ON public.profiles_public TO authenticated;

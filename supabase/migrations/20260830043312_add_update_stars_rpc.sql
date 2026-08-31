/*
# Add update_user_stars RPC function

Creates a SECURITY DEFINER function that recalculates a user's total stars
from the user_rewards table. This prevents the frontend from directly
modifying star totals — rewards are inserted, then this function sums them.

1. New Functions
- update_user_stars(p_user_id uuid): Recalculates total_stars on profiles
  by summing stars_earned from user_rewards for that user. Also recalculates
  rank based on overall_progress.
*/

CREATE OR REPLACE FUNCTION update_user_stars(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_stars integer;
  v_progress numeric(5,2);
  v_new_rank text;
BEGIN
  SELECT COALESCE(SUM(stars_earned), 0) INTO v_total_stars
  FROM user_rewards
  WHERE user_id = p_user_id;

  SELECT COALESCE(overall_progress, 0) INTO v_progress
  FROM profiles
  WHERE id = p_user_id;

  IF v_progress >= 90 THEN
    v_new_rank := 'S+';
  ELSIF v_progress >= 80 THEN
    v_new_rank := 'A';
  ELSIF v_progress >= 70 THEN
    v_new_rank := 'B';
  ELSIF v_progress >= 60 THEN
    v_new_rank := 'C';
  ELSE
    v_new_rank := 'Practice';
  END IF;

  UPDATE profiles
  SET total_stars = v_total_stars,
      rank = v_new_rank
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_stars(uuid) TO authenticated;

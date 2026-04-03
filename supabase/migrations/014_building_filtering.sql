-- ============================================================
-- Building-level filtering support
-- Run this in Supabase SQL Editor
-- ============================================================

-- Returns all entity IDs for a given building (for filtering)
CREATE OR REPLACE FUNCTION public.get_building_entity_ids(p_building_id UUID)
RETURNS JSON AS $$
DECLARE
  v_floor_ids UUID[];
  v_room_ids UUID[];
  v_bed_ids UUID[];
BEGIN
  SELECT array_agg(id) INTO v_floor_ids
  FROM floors WHERE building_id = p_building_id;

  SELECT array_agg(id) INTO v_room_ids
  FROM rooms WHERE floor_id = ANY(COALESCE(v_floor_ids, '{}'::UUID[]));

  SELECT array_agg(id) INTO v_bed_ids
  FROM beds WHERE room_id = ANY(COALESCE(v_room_ids, '{}'::UUID[]));

  RETURN json_build_object(
    'floor_ids', COALESCE(v_floor_ids, '{}'::UUID[]),
    'room_ids', COALESCE(v_room_ids, '{}'::UUID[]),
    'bed_ids', COALESCE(v_bed_ids, '{}'::UUID[])
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

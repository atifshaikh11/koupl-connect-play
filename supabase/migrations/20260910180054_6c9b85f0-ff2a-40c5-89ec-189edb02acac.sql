CREATE TABLE public.room_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id),
  sender_name text NOT NULL DEFAULT 'Player',
  sender_avatar text NOT NULL DEFAULT '🙂',
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX room_messages_room_created_idx ON public.room_messages (room_id, created_at);

GRANT SELECT, INSERT ON public.room_messages TO authenticated;
GRANT ALL ON public.room_messages TO service_role;

ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can read messages"
ON public.room_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = room_id
      AND (r.host_id = auth.uid() OR r.guest_id = auth.uid())
  )
);

CREATE POLICY "Room members can send messages"
ON public.room_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.rooms r
    WHERE r.id = room_id
      AND (r.host_id = auth.uid() OR r.guest_id = auth.uid())
  )
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
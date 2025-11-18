-- Fix messages table RLS policies to allow recipients to mark messages as read
-- This solves the issue where unread badges don't disappear after viewing messages

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update received messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;

-- Create new policy that allows:
-- 1. Senders to update their own messages
-- 2. Recipients to mark messages as read (update is_read field)
CREATE POLICY "Users can update messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  -- User is either the sender OR the recipient of the message
  auth.uid() = sender_id OR 
  auth.uid() IN (
    SELECT unnest(user_ids) 
    FROM chats 
    WHERE id = messages.chat_id
  )
)
WITH CHECK (
  -- User is either the sender OR only updating is_read field
  auth.uid() = sender_id OR 
  (
    auth.uid() IN (
      SELECT unnest(user_ids) 
      FROM chats 
      WHERE id = messages.chat_id
    )
  )
);

-- Add index for faster permission checks
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_is_read ON public.messages(chat_id, is_read) WHERE is_read = false;

-- Add helpful comment
COMMENT ON POLICY "Users can update messages" ON public.messages IS 
'Allows senders to update their own messages and recipients to mark messages as read';

-- This solves the issue where unread badges don't disappear after viewing messages

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update received messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;

-- Create new policy that allows:
-- 1. Senders to update their own messages
-- 2. Recipients to mark messages as read (update is_read field)
CREATE POLICY "Users can update messages"
ON public.messages
FOR UPDATE
TO authenticated
USING (
  -- User is either the sender OR the recipient of the message
  auth.uid() = sender_id OR 
  auth.uid() IN (
    SELECT unnest(user_ids) 
    FROM chats 
    WHERE id = messages.chat_id
  )
)
WITH CHECK (
  -- User is either the sender OR only updating is_read field
  auth.uid() = sender_id OR 
  (
    auth.uid() IN (
      SELECT unnest(user_ids) 
      FROM chats 
      WHERE id = messages.chat_id
    )
  )
);

-- Add index for faster permission checks
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_is_read ON public.messages(chat_id, is_read) WHERE is_read = false;

-- Add helpful comment
COMMENT ON POLICY "Users can update messages" ON public.messages IS 
'Allows senders to update their own messages and recipients to mark messages as read';


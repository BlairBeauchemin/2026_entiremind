-- ============================================
-- Testimonial collection loop (founder-triggered)
--
-- The founder asks a high-engagement user for a one-line testimonial by SMS.
-- The user's next reply is captured here for founder review; approval requires
-- explicit consent confirmation before anything can be published.
--
-- NOTE: unmerged branches (messaging simulator, monetization/growth) also
-- claim migration number 018 — whichever merges later must renumber.
-- ============================================

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  body TEXT,
  status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'received', 'approved', 'dismissed')),
  consent BOOLEAN DEFAULT false NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  received_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_testimonials_status
  ON testimonials(status, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_testimonials_user
  ON testimonials(user_id, requested_at DESC);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view testimonials" ON testimonials
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Admins can update testimonials" ON testimonials
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

GRANT ALL ON testimonials TO service_role;

-- ============================================
-- Allow 'testimonial_request' as an outbound content type.
-- It is deliberately absent from the reply-rate allowlist in
-- src/lib/signals/compute.ts so asks never skew engagement math.
-- ============================================
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_content_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_content_type_check
  CHECK (content_type IN (
    'reflection', 'quote', 'check-in', 'action', 'gratitude', 'welcome', 'manual', 'ack', 'testimonial_request'
  ));

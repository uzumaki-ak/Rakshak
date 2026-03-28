-- 002_ai_assistant.sql
-- Extension for AI Features: Custom Agents and Chat History

-- 1. Create User Agents table (Custom AI Personas)
CREATE TABLE IF NOT EXISTS public.user_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT '🤖',
    category TEXT DEFAULT 'custom', -- 'medicine', 'analysis', 'assistance', 'custom'
    system_prompt TEXT NOT NULL,
    input_type TEXT DEFAULT 'text', -- 'text', 'image', 'barcode', 'mixed'
    output_type TEXT DEFAULT 'text',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create AI Chat Sessions table
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.user_agents(id) ON DELETE SET NULL,
    title TEXT DEFAULT 'New Analysis',
    session_type TEXT, -- e.g., 'medicine-teller', 'report-analyzer'
    context_data JSONB DEFAULT '{}'::jsonb, -- Store medicine_id or other context
    is_active BOOLEAN DEFAULT TRUE,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create AI Chat Messages table
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb, -- Store { "image_url": "..." }
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Note: RLS is disabled by default to match existing project schema.
-- To enable, uncomment the following and add appropriate policies:
-- ALTER TABLE public.user_agents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_user_agents_updated_at ON public.user_agents;
CREATE TRIGGER update_user_agents_updated_at BEFORE UPDATE ON public.user_agents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_chat_sessions_updated_at ON public.ai_chat_sessions;
CREATE TRIGGER update_ai_chat_sessions_updated_at BEFORE UPDATE ON public.ai_chat_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

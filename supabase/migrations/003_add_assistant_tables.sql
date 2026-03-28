-- Migration 003: Add Assistant Tables
-- Purpose: Supports custom AI agents and session-based chats.

-- 1. Create User Agents Table (Custom AI Agents)
CREATE TABLE IF NOT EXISTS public.user_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'build',
    category TEXT DEFAULT 'custom',
    system_prompt TEXT NOT NULL,
    input_type TEXT DEFAULT 'text',
    output_type TEXT DEFAULT 'text',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create AI Chat Sessions Table
CREATE TABLE IF NOT EXISTS public.ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.user_agents(id) ON DELETE SET NULL, -- Nullable for predefined agents
    session_type TEXT NOT NULL, 
    title TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create AI Chat Messages Table
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.ai_chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    image_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Triggers for auto-updating updated_at
DROP TRIGGER IF EXISTS update_user_agents_updated_at ON public.user_agents;
CREATE TRIGGER update_user_agents_updated_at BEFORE UPDATE ON public.user_agents FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_chat_sessions_updated_at ON public.ai_chat_sessions;
CREATE TRIGGER update_ai_chat_sessions_updated_at BEFORE UPDATE ON public.ai_chat_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

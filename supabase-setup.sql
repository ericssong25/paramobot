-- 🚀 WhatsApp Bot Platform - Supabase Setup Script
-- Ejecutar este script en el SQL Editor de Supabase Dashboard

-- =====================================================
-- 1. CREAR FUNCIÓN PARA ACTUALIZAR TIMESTAMPS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 2. CREAR TABLAS PRINCIPALES
-- =====================================================

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de planes de suscripción
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_quarterly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  stripe_price_id_monthly TEXT,
  stripe_price_id_quarterly TEXT,
  stripe_price_id_yearly TEXT,
  max_bots INTEGER DEFAULT 1,
  max_flows_per_bot INTEGER DEFAULT 5,
  max_messages_per_month INTEGER DEFAULT 1000,
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de suscripciones de usuarios
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de bots por usuario
CREATE TABLE IF NOT EXISTS user_bots (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  whatsapp_number TEXT,
  whatsapp_session_path TEXT,
  is_active BOOLEAN DEFAULT true,
  is_connected BOOLEAN DEFAULT false,
  last_connection TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de flujos de conversación
CREATE TABLE IF NOT EXISTS conversation_flows (
  id SERIAL PRIMARY KEY,
  bot_id INTEGER REFERENCES user_bots(id) ON DELETE CASCADE,
  flow_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de pasos de flujo
CREATE TABLE IF NOT EXISTS flow_steps (
  id SERIAL PRIMARY KEY,
  flow_id INTEGER REFERENCES conversation_flows(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  parent_step_id INTEGER REFERENCES flow_steps(id),
  question_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de opciones de paso
CREATE TABLE IF NOT EXISTS flow_options (
  id SERIAL PRIMARY KEY,
  step_id INTEGER REFERENCES flow_steps(id) ON DELETE CASCADE,
  option_number INTEGER NOT NULL,
  option_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  next_step_id INTEGER REFERENCES flow_steps(id),
  is_back_option BOOLEAN DEFAULT false,
  is_final_response BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de sesiones de bot
CREATE TABLE IF NOT EXISTS bot_sessions (
  id SERIAL PRIMARY KEY,
  bot_id INTEGER REFERENCES user_bots(id) ON DELETE CASCADE,
  user_phone TEXT NOT NULL,
  current_step_id INTEGER REFERENCES flow_steps(id),
  flow_id INTEGER REFERENCES conversation_flows(id),
  navigation_history JSONB DEFAULT '[]',
  session_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de logs de mensajes
CREATE TABLE IF NOT EXISTS message_logs (
  id SERIAL PRIMARY KEY,
  bot_id INTEGER REFERENCES user_bots(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES bot_sessions(id) ON DELETE CASCADE,
  from_phone TEXT NOT NULL,
  to_phone TEXT NOT NULL,
  message_type TEXT CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location')),
  message_content TEXT,
  message_data JSONB,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREAR TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON user_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_bots_updated_at 
  BEFORE UPDATE ON user_bots 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_flows_updated_at 
  BEFORE UPDATE ON conversation_flows 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_steps_updated_at 
  BEFORE UPDATE ON flow_steps 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flow_options_updated_at 
  BEFORE UPDATE ON flow_options 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bot_sessions_updated_at 
  BEFORE UPDATE ON bot_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. INSERTAR DATOS POR DEFECTO
-- =====================================================

-- Insertar planes de suscripción por defecto
INSERT INTO subscription_plans (name, description, price_monthly, price_quarterly, price_yearly, max_bots, max_flows_per_bot, max_messages_per_month, features) VALUES
('Basic', 'Plan básico para emprendedores', 9.99, 24.99, 89.99, 1, 5, 1000, '{"support": "email", "analytics": false}'),
('Pro', 'Plan profesional para negocios', 19.99, 49.99, 179.99, 3, -1, 10000, '{"support": "priority", "analytics": true}'),
('Business', 'Plan empresarial avanzado', 39.99, 99.99, 359.99, 10, -1, 50000, '{"support": "priority", "analytics": true, "api": true}'),
('Enterprise', 'Plan enterprise ilimitado', 99.99, 249.99, 899.99, -1, -1, -1, '{"support": "24/7", "analytics": true, "api": true, "white_label": true}')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 5. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREAR POLÍTICAS DE SEGURIDAD
-- =====================================================

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para user_subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para user_bots
CREATE POLICY "Users can view own bots" ON user_bots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bots" ON user_bots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bots" ON user_bots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bots" ON user_bots
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para conversation_flows
CREATE POLICY "Users can view flows from their bots" ON conversation_flows
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_bots 
      WHERE user_bots.id = conversation_flows.bot_id 
      AND user_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert flows to their bots" ON conversation_flows
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_bots 
      WHERE user_bots.id = conversation_flows.bot_id 
      AND user_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update flows from their bots" ON conversation_flows
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_bots 
      WHERE user_bots.id = conversation_flows.bot_id 
      AND user_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete flows from their bots" ON conversation_flows
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_bots 
      WHERE user_bots.id = conversation_flows.bot_id 
      AND user_bots.user_id = auth.uid()
    )
  );

-- Políticas para flow_steps
CREATE POLICY "Users can view steps from their flows" ON flow_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_flows cf
      JOIN user_bots ub ON cf.bot_id = ub.id
      WHERE cf.id = flow_steps.flow_id 
      AND ub.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert steps to their flows" ON flow_steps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_flows cf
      JOIN user_bots ub ON cf.bot_id = ub.id
      WHERE cf.id = flow_steps.flow_id 
      AND ub.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update steps from their flows" ON flow_steps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_flows cf
      JOIN user_bots ub ON cf.bot_id = ub.id
      WHERE cf.id = flow_steps.flow_id 
      AND ub.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete steps from their flows" ON flow_steps
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM conversation_flows cf
      JOIN user_bots ub ON cf.bot_id = ub.id
      WHERE cf.id = flow_steps.flow_id 
      AND ub.user_id = auth.uid()
    )
  );

-- Políticas para flow_options
CREATE POLICY "Users can view options from their steps" ON flow_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM flow_steps fs
      JOIN conversation_flows cf ON fs.flow_id = cf.id
      JOIN user_bots ub ON cf.bot_id = ub.id
      WHERE fs.id = flow_options.step_id 
      AND ub.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert options to their steps" ON flow_options
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM flow_steps fs
      JOIN conversation_flows cf ON fs.flow_id = cf.id
      JOIN user_bots ub ON cf.bot_id = ub.id
      WHERE fs.id = flow_options.step_id 
      AND ub.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update options from their steps" ON flow_options
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM flow_steps fs
      JOIN conversation_flows cf ON fs.flow_id = cf.id
      JOIN user_bots ub ON cf.bot_id = ub.id
      WHERE fs.id = flow_options.step_id 
      AND ub.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete options from their steps" ON flow_options
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM flow_steps fs
      JOIN conversation_flows cf ON fs.flow_id = cf.id
      JOIN user_bots ub ON cf.bot_id = ub.id
      WHERE fs.id = flow_options.step_id 
      AND ub.user_id = auth.uid()
    )
  );

-- Políticas para bot_sessions
CREATE POLICY "Users can view sessions from their bots" ON bot_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_bots 
      WHERE user_bots.id = bot_sessions.bot_id 
      AND user_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sessions to their bots" ON bot_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_bots 
      WHERE user_bots.id = bot_sessions.bot_id 
      AND user_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sessions from their bots" ON bot_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_bots 
      WHERE user_bots.id = bot_sessions.bot_id 
      AND user_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sessions from their bots" ON bot_sessions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_bots 
      WHERE user_bots.id = bot_sessions.bot_id 
      AND user_bots.user_id = auth.uid()
    )
  );

-- Políticas para message_logs
CREATE POLICY "Users can view logs from their bots" ON message_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_bots 
      WHERE user_bots.id = message_logs.bot_id 
      AND user_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert logs to their bots" ON message_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_bots 
      WHERE user_bots.id = message_logs.bot_id 
      AND user_bots.user_id = auth.uid()
    )
  );

-- =====================================================
-- 7. CREAR FUNCIÓN PARA MIGRAR DATOS EXISTENTES
-- =====================================================

CREATE OR REPLACE FUNCTION migrate_existing_data()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  bot_record RECORD;
  flow_record RECORD;
  step_record RECORD;
  option_record RECORD;
BEGIN
  -- Crear usuario por defecto si no existe
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    'admin@default.com',
    'Default Admin'
  ) ON CONFLICT (id) DO NOTHING;

  -- Crear bot por defecto
  INSERT INTO user_bots (user_id, name, description, is_active)
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Default Bot',
    'Bot por defecto migrado',
    true
  ) RETURNING id INTO bot_record;

  -- Nota: La migración de datos existentes se ejecutará manualmente
  -- cuando tengas acceso a las tablas actuales
  
  RAISE NOTICE 'Migración completada. Bot por defecto creado con ID: %', bot_record.id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. CREAR ÍNDICES PARA OPTIMIZAR RENDIMIENTO
-- =====================================================

-- Índices para user_bots
CREATE INDEX IF NOT EXISTS idx_user_bots_user_id ON user_bots(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bots_is_active ON user_bots(is_active);

-- Índices para conversation_flows
CREATE INDEX IF NOT EXISTS idx_conversation_flows_bot_id ON conversation_flows(bot_id);
CREATE INDEX IF NOT EXISTS idx_conversation_flows_is_active ON conversation_flows(is_active);

-- Índices para flow_steps
CREATE INDEX IF NOT EXISTS idx_flow_steps_flow_id ON flow_steps(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_steps_parent_step_id ON flow_steps(parent_step_id);

-- Índices para flow_options
CREATE INDEX IF NOT EXISTS idx_flow_options_step_id ON flow_options(step_id);
CREATE INDEX IF NOT EXISTS idx_flow_options_next_step_id ON flow_options(next_step_id);

-- Índices para bot_sessions
CREATE INDEX IF NOT EXISTS idx_bot_sessions_bot_id ON bot_sessions(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_user_phone ON bot_sessions(user_phone);
CREATE INDEX IF NOT EXISTS idx_bot_sessions_is_active ON bot_sessions(is_active);

-- Índices para message_logs
CREATE INDEX IF NOT EXISTS idx_message_logs_bot_id ON message_logs(bot_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_session_id ON message_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_created_at ON message_logs(created_at);

-- =====================================================
-- 9. VERIFICACIÓN FINAL
-- =====================================================

-- Verificar que todas las tablas se crearon correctamente
SELECT 
  table_name,
  CASE WHEN row_level_security = 'YES' THEN 'RLS Enabled' ELSE 'RLS Disabled' END as rls_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles', 'subscription_plans', 'user_subscriptions', 'user_bots',
  'conversation_flows', 'flow_steps', 'flow_options', 'bot_sessions', 'message_logs'
)
ORDER BY table_name;

-- Verificar políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- ✅ CONFIGURACIÓN COMPLETADA
-- =====================================================

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '🎉 Configuración de Supabase completada exitosamente!';
  RAISE NOTICE '📋 Próximos pasos:';
  RAISE NOTICE '   1. Configurar autenticación en Supabase Dashboard';
  RAISE NOTICE '   2. Configurar variables de entorno en tu aplicación';
  RAISE NOTICE '   3. Instalar @supabase/supabase-js en frontend y backend';
  RAISE NOTICE '   4. Migrar datos existentes si es necesario';
END $$;

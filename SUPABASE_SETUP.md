# 🚀 Configuración de Supabase para WhatsApp Bot Multi-Tenant

## 📋 Índice
1. [Instalación de Dependencias](#instalación-de-dependencias)
2. [Configuración de Supabase](#configuración-de-supabase)
3. [Estructura de Base de Datos](#estructura-de-base-de-datos)
4. [Migración de Datos](#migración-de-datos)
5. [Configuración de Autenticación](#configuración-de-autenticación)
6. [Row Level Security (RLS)](#row-level-security-rls)
7. [Variables de Entorno](#variables-de-entorno)

---

## 📦 Instalación de Dependencias

### Frontend (React)
```bash
npm install @supabase/supabase-js
```

### Backend (Node.js)
```bash
npm install @supabase/supabase-js
```

---

## 🔧 Configuración de Supabase

### 1. Crear Proyecto en Supabase
1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en "New Project"
3. Elige tu organización
4. Configura:
   - **Name**: `whatsapp-bot-platform`
   - **Database Password**: Genera una contraseña segura
   - **Region**: Elige la más cercana a tus usuarios
5. Haz clic en "Create new project"

### 2. Obtener Credenciales
Una vez creado el proyecto, ve a **Settings > API** y copia:
- **Project URL**: `https://your-project-id.supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (mantén esto secreto)

---

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### 1. `profiles` (Perfiles de Usuario)
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 2. `subscription_plans` (Planes de Suscripción)
```sql
CREATE TABLE subscription_plans (
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

-- Insertar planes por defecto
INSERT INTO subscription_plans (name, description, price_monthly, price_quarterly, price_yearly, max_bots, max_flows_per_bot, max_messages_per_month, features) VALUES
('Basic', 'Plan básico para emprendedores', 9.99, 24.99, 89.99, 1, 5, 1000, '{"support": "email", "analytics": false}'),
('Pro', 'Plan profesional para negocios', 19.99, 49.99, 179.99, 3, -1, 10000, '{"support": "priority", "analytics": true}'),
('Business', 'Plan empresarial avanzado', 39.99, 99.99, 359.99, 10, -1, 50000, '{"support": "priority", "analytics": true, "api": true}'),
('Enterprise', 'Plan enterprise ilimitado', 99.99, 249.99, 899.99, -1, -1, -1, '{"support": "24/7", "analytics": true, "api": true, "white_label": true}');
```

#### 3. `user_subscriptions` (Suscripciones de Usuarios)
```sql
CREATE TABLE user_subscriptions (
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

CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON user_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 4. `user_bots` (Bots por Usuario)
```sql
CREATE TABLE user_bots (
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

CREATE TRIGGER update_user_bots_updated_at 
  BEFORE UPDATE ON user_bots 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 5. `conversation_flows` (Flujos de Conversación)
```sql
CREATE TABLE conversation_flows (
  id SERIAL PRIMARY KEY,
  bot_id INTEGER REFERENCES user_bots(id) ON DELETE CASCADE,
  flow_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_conversation_flows_updated_at 
  BEFORE UPDATE ON conversation_flows 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 6. `flow_steps` (Pasos de Flujo)
```sql
CREATE TABLE flow_steps (
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

CREATE TRIGGER update_flow_steps_updated_at 
  BEFORE UPDATE ON flow_steps 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 7. `flow_options` (Opciones de Paso)
```sql
CREATE TABLE flow_options (
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

CREATE TRIGGER update_flow_options_updated_at 
  BEFORE UPDATE ON flow_options 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 8. `bot_sessions` (Sesiones de Bot)
```sql
CREATE TABLE bot_sessions (
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

CREATE TRIGGER update_bot_sessions_updated_at 
  BEFORE UPDATE ON bot_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 9. `message_logs` (Logs de Mensajes)
```sql
CREATE TABLE message_logs (
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
```

---

## 🔐 Row Level Security (RLS)

### Habilitar RLS en todas las tablas
```sql
-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
```

### Políticas de Seguridad
```sql
-- Política para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para user_subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para user_bots
CREATE POLICY "Users can view own bots" ON user_bots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bots" ON user_bots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bots" ON user_bots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bots" ON user_bots
  FOR DELETE USING (auth.uid() = user_id);

-- Política para conversation_flows
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

-- Políticas similares para flow_steps, flow_options, bot_sessions, message_logs
-- (se aplican las mismas lógicas de verificación de propiedad)
```

---

## 🔄 Migración de Datos

### Script de Migración
```sql
-- Crear función para migrar datos existentes
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

  -- Migrar flujos existentes
  FOR flow_record IN SELECT * FROM conversation_flows_old LOOP
    INSERT INTO conversation_flows (bot_id, flow_name, is_active, created_at)
    VALUES (bot_record.id, flow_record.flow_name, flow_record.is_active, flow_record.created_at)
    RETURNING id INTO flow_record;
    
    -- Migrar pasos
    FOR step_record IN SELECT * FROM flow_steps_old WHERE flow_id = flow_record.id LOOP
      INSERT INTO flow_steps (flow_id, step_number, parent_step_id, question_text, is_active, created_at)
      VALUES (flow_record.id, step_record.step_number, step_record.parent_step_id, step_record.question_text, step_record.is_active, step_record.created_at)
      RETURNING id INTO step_record;
      
      -- Migrar opciones
      FOR option_record IN SELECT * FROM flow_options_old WHERE step_id = step_record.id LOOP
        INSERT INTO flow_options (step_id, option_number, option_text, response_text, next_step_id, is_back_option, is_final_response, is_active, created_at)
        VALUES (step_record.id, option_record.option_number, option_record.option_text, option_record.response_text, option_record.next_step_id, option_record.is_back_option, option_record.is_final_response, option_record.is_active, option_record.created_at);
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔧 Configuración de Autenticación

### 1. Configurar Proveedores de Autenticación
En Supabase Dashboard > Authentication > Providers:

- **Email**: Habilitado por defecto
- **Google**: Configurar OAuth
- **GitHub**: Opcional para desarrolladores

### 2. Configurar Redirecciones
- **Site URL**: `http://localhost:3000` (desarrollo)
- **Redirect URLs**: 
  - `http://localhost:3000/auth/callback`
  - `https://tu-dominio.com/auth/callback` (producción)

---

## 🌍 Variables de Entorno

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Backend (.env)
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📋 Checklist de Configuración

### ✅ Pasos a Completar

1. **Crear proyecto en Supabase**
   - [ ] Crear cuenta en supabase.com
   - [ ] Crear nuevo proyecto
   - [ ] Copiar credenciales (URL y keys)

2. **Instalar dependencias**
   - [ ] `npm install @supabase/supabase-js` (frontend)
   - [ ] `npm install @supabase/supabase-js` (backend)

3. **Ejecutar scripts SQL**
   - [ ] Crear tablas principales
   - [ ] Configurar RLS
   - [ ] Insertar datos por defecto

4. **Configurar autenticación**
   - [ ] Habilitar proveedores
   - [ ] Configurar redirecciones
   - [ ] Probar login/registro

5. **Configurar variables de entorno**
   - [ ] Frontend .env
   - [ ] Backend .env
   - [ ] Verificar conexión

6. **Migrar datos existentes**
   - [ ] Backup de datos actuales
   - [ ] Ejecutar script de migración
   - [ ] Verificar integridad

---

## 🚀 Próximos Pasos

Una vez completada esta configuración:

1. **Integrar Supabase en el frontend**
2. **Modificar servicios del backend**
3. **Implementar autenticación**
4. **Configurar Stripe para suscripciones**

---

## 📞 Soporte

Si encuentras problemas durante la configuración:

1. Revisa los logs en Supabase Dashboard
2. Verifica las políticas de RLS
3. Confirma las variables de entorno
4. Consulta la documentación oficial de Supabase

---

*Última actualización: $(date)*

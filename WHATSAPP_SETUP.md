# WhatsApp Bot Setup Guide

## Configuración del Bot de WhatsApp

### 1. Configuración del Servidor

1. **Instalar dependencias del servidor:**
   ```bash
   cd server
   npm install
   ```

2. **Crear archivo de variables de entorno:**
   Crea un archivo `.env` en la carpeta `server/` con el siguiente contenido:
       ```
    PORT=5000
    NODE_ENV=development
    DATABASE_PATH=./database/whatsapp_bot.db
    JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
    FRONTEND_URL=http://localhost:5173
    WHATSAPP_HEADLESS=true
    WHATSAPP_TIMEOUT=60000
    PROCESS_OLD_MESSAGES=false
    IGNORE_GROUP_MESSAGES=true
    ```

3. **Iniciar el servidor:**
   ```bash
   cd server
   npm start
   ```

### 2. Configuración del Frontend

1. **Instalar dependencias del frontend:**
   ```bash
   npm install
   ```

2. **Iniciar el frontend:**
   ```bash
   npm run dev
   ```

### 3. Uso del Bot de WhatsApp

#### Paso 1: Conectar WhatsApp
1. Abre la aplicación en `http://localhost:5173`
2. Ve a la sección "WhatsApp Bot"
3. Haz clic en "Initialize WhatsApp"
4. Se generará un código QR en la pantalla

#### Paso 2: Escanear el Código QR
1. Abre WhatsApp en tu teléfono
2. Ve a Configuración > Dispositivos Vinculados
3. Toca "Vincular un dispositivo"
4. Escanea el código QR que aparece en la pantalla

#### Paso 3: Configurar Respuestas Automáticas
1. Una vez conectado, ve a la pestaña "Auto-Reply Rules"
2. Crea reglas de respuesta automática:
   - **Trigger Word:** Palabra que activará la respuesta (ej: "hola", "precio")
   - **Auto-Reply:** Respuesta automática que se enviará

#### Paso 4: Enviar Mensajes
1. Ve a la pestaña "Send Messages"
2. Puedes enviar mensajes individuales por número de teléfono o nombre de contacto
3. Usa la pestaña "Broadcast" para enviar mensajes a todos tus contactos

### 4. Funcionalidades Disponibles

#### Respuestas Automáticas
- El bot detecta palabras clave en los mensajes entrantes
- Responde automáticamente según las reglas configuradas
- Registra todas las interacciones en analytics

#### Envío de Mensajes
- Envío individual por número de teléfono
- Envío por nombre de contacto
- Broadcast a todos los contactos

#### Analytics
- Registro de todos los mensajes entrantes
- Conteo de respuestas automáticas enviadas
- Historial de interacciones

### 5. Solución de Problemas

#### El código QR no aparece
1. Verifica que el servidor esté corriendo en el puerto 5000
2. Revisa la consola del navegador para errores
3. Verifica que las dependencias estén instaladas correctamente

#### Error de conexión
1. Asegúrate de que WhatsApp Web esté habilitado en tu cuenta
2. Verifica que tu teléfono tenga conexión a internet
3. Intenta desconectar y reconectar el dispositivo

#### Las respuestas automáticas no funcionan
1. Verifica que las reglas estén activas
2. Asegúrate de que las palabras clave coincidan exactamente
3. Revisa los logs del servidor para errores

### 6. Reglas Predefinidas

El bot viene con algunas reglas predefinidas:
- **"hola"** → "¡Hola! Gracias por escribirnos. ¿En qué podemos ayudarte? 😊"
- **"precio"** → "¡Hola! El precio es $99. ¿Te interesa? 💰"
- **"info"** → "¡Hola! Aquí tienes más información: https://ejemplo.com 📋"
- **"contacto"** → "¡Hola! Puedes contactarnos al +1234567890 📞"
- **"horarios"** → "¡Hola! Nuestros horarios son de 9:00 AM a 6:00 PM de lunes a viernes 🕘"

### 7. Seguridad

- El bot usa autenticación local de WhatsApp Web
- Los datos se almacenan localmente en SQLite
- No se comparten credenciales con terceros
- Se recomienda usar en un entorno seguro

### 8. Notas Importantes

- El bot requiere que WhatsApp Web esté habilitado en tu cuenta
- La primera conexión puede tardar unos segundos
- El código QR se actualiza automáticamente si expira
- Puedes desconectar el bot en cualquier momento desde la interfaz

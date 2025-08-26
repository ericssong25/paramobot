# WhatsApp Bot - Automatización de Mensajes

Un bot de WhatsApp que responde automáticamente a mensajes basado en palabras clave, similar a ManyChat pero gratuito y personalizable.

## 🚀 Características

- **Respuestas Automáticas**: Responde a comentarios basado en palabras clave
- **Campañas de DM**: Envía mensajes directos automáticos
- **Analytics**: Seguimiento de métricas y rendimiento
- **Plantillas**: Sistema de plantillas de mensajes
- **Interfaz Web**: Dashboard moderno con React y Tailwind CSS
- **Base de Datos**: SQLite para almacenamiento local
- **Web Scraping**: Monitoreo de comentarios sin límites de API

## 📋 Requisitos

- Node.js 16+ 
- npm o yarn
- Cuenta de WhatsApp Business (opcional)
- Navegador Chrome (para Puppeteer)

## 🛠️ Instalación

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd instagramBot
```

### 2. Instalar dependencias del frontend
```bash
npm install
```

### 3. Instalar dependencias del backend
```bash
cd server
npm install
cd ..
```

### 4. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp server/env.example server/.env

# Editar el archivo .env con tus credenciales
nano server/.env
```

### 5. Configurar variables de entorno
Edita el archivo `server/.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET=tu_clave_secreta_jwt

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

## 🚀 Ejecución

### Opción 1: Ejecutar todo junto
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
npm run dev
```

### Opción 2: Ejecutar por separado
```bash
# Backend (puerto 5000)
cd server
npm start

# Frontend (puerto 5173)
npm run dev
```

## 📱 Uso

1. **Acceder al Dashboard**: http://localhost:5173
2. **Conectar WhatsApp**: Ve a la sección de WhatsApp Bot y conecta tu cuenta
3. **Configurar Reglas**: Crea reglas de respuesta automática
4. **Monitorear**: El bot comenzará a procesar mensajes automáticamente

## 🔧 Configuración

### Reglas de Mensajes
- **Trigger**: Palabra clave que activa la respuesta
- **Response**: Mensaje que se enviará automáticamente
- **Estado**: Activar/desactivar reglas individuales

### Campañas de Mensajes
- **Nombre**: Identificador de la campaña
- **Plantilla**: Mensaje a enviar
- **Estado**: Activo/pausado

### Configuración de Mensajes Antiguos
- **PROCESS_OLD_MESSAGES**: Controla si el bot procesa mensajes recibidos antes de iniciarse
  - `false` (por defecto): Solo procesa mensajes nuevos recibidos después de iniciar el bot
  - `true`: Procesa todos los mensajes, incluyendo los antiguos
- **Recomendación**: Mantener en `false` para evitar respuestas automáticas a mensajes antiguos

### Configuración de Mensajes de Grupos
- **IGNORE_GROUP_MESSAGES**: Controla si el bot ignora mensajes de grupos
  - `true` (por defecto): Ignora todos los mensajes de grupos
  - `false`: Procesa mensajes de grupos (no recomendado para evitar spam)
- **Recomendación**: Mantener en `true` para evitar respuestas automáticas en grupos

## 📊 Analytics

El bot registra automáticamente:
- Mensajes procesados
- Respuestas enviadas
- DMs enviados
- Tasa de engagement
- Reglas más efectivas

## 🚫 Filtros de Mensajes

### Mensajes Ignorados
El bot automáticamente ignora:
- **Mensajes propios**: Mensajes enviados por el bot
- **Mensajes de grupos**: Mensajes de chats grupales (terminan en `@g.us`)
- **Mensajes antiguos**: Mensajes recibidos antes de iniciar el bot (configurable)

### Logs de Mensajes Ignorados
En los logs del servidor verás:
- `👥 Ignoring group message from...` - Para mensajes de grupos
- `⏰ Ignoring old message from...` - Para mensajes antiguos

## ⚠️ Advertencias

- **Uso Responsable**: Respeta los términos de servicio de Instagram
- **Límites**: No abuses del bot para evitar bloqueos
- **Privacidad**: Tus credenciales se almacenan localmente
- **Mantenimiento**: Instagram puede cambiar su interfaz

## 🔒 Seguridad

- Las credenciales se almacenan localmente
- JWT para autenticación
- CORS configurado para desarrollo
- Validación de entrada en todas las rutas

## 🛠️ Desarrollo

### Estructura del Proyecto
```
instagramBot/
├── src/                 # Frontend React
│   ├── components/      # Componentes UI
│   └── App.tsx         # Aplicación principal
├── server/             # Backend Node.js
│   ├── routes/         # Rutas API
│   ├── services/       # Servicios del bot
│   ├── database/       # Base de datos
│   └── index.js        # Servidor principal
└── README.md
```

### API Endpoints

#### Instagram
- `GET /api/instagram/comment-rules` - Obtener reglas
- `POST /api/instagram/comment-rules` - Crear regla
- `PUT /api/instagram/comment-rules/:id` - Actualizar regla
- `DELETE /api/instagram/comment-rules/:id` - Eliminar regla
- `GET /api/instagram/dm-campaigns` - Obtener campañas
- `POST /api/instagram/connect` - Conectar Instagram
- `POST /api/instagram/test-response` - Probar respuesta

#### Analytics
- `GET /api/analytics/overview` - Resumen general
- `GET /api/analytics/weekly` - Datos semanales
- `GET /api/analytics/top-rules` - Reglas más efectivas

#### Templates
- `GET /api/templates` - Obtener plantillas
- `POST /api/templates` - Crear plantilla
- `PUT /api/templates/:id` - Actualizar plantilla

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica las credenciales de Instagram
3. Asegúrate de que Chrome esté instalado
4. Revisa que los puertos 5000 y 5173 estén libres

## 🔄 Actualizaciones

Para actualizar el bot:
```bash
git pull origin main
cd server && npm install
cd .. && npm install
```

---

**Nota**: Este bot es para uso educativo y personal. Úsalo responsablemente y respeta los términos de servicio de Instagram.

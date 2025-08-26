# 🚀 Guía de Despliegue en Render

## Configuración para Render

### 1. Preparación del Proyecto

1. **Sube tu código a GitHub**
2. **Asegúrate de que todos los archivos estén incluidos**:
   - `render.yaml`
   - `server/package.json`
   - `server/init-render.js`
   - `.nvmrc`

### 2. Desplegar en Render

1. **Ve a [render.com](https://render.com)**
2. **Crea una cuenta** (gratis)
3. **Haz clic en "New +"**
4. **Selecciona "Web Service"**
5. **Conecta tu repositorio de GitHub**
6. **Configura el servicio**:
   - **Name**: `whatsapp-bot`
   - **Environment**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node init-render.js`
   - **Plan**: `Free`

### 3. Variables de Entorno

En Render, agrega estas variables de entorno:

```env
NODE_ENV=production
PORT=10000
WHATSAPP_HEADLESS=true
WHATSAPP_TIMEOUT=120000
PROCESS_OLD_MESSAGES=false
IGNORE_GROUP_MESSAGES=true
FRONTEND_URL=http://localhost:5173
JWT_SECRET=tu_clave_super_secreta_muy_larga
DATABASE_PATH=./database/whatsapp_bot.db
```

### 4. Configuración del Frontend Local

Modifica tu `src/services/api.ts`:

```typescript
const API_BASE_URL = 'https://tu-app.onrender.com/api';
```

### 5. Verificación

1. **Espera a que se complete el build** (puede tardar 5-10 minutos)
2. **Ve a la URL de tu app**: `https://tu-app.onrender.com`
3. **Verifica el health check**: `https://tu-app.onrender.com/api/health`
4. **Conecta desde tu frontend local**

## Troubleshooting

### Error de Puppeteer
- Render puede tener problemas con Puppeteer
- La configuración ya está optimizada para Render
- Si falla, considera usar un plan de pago

### Error de Memoria
- El plan gratuito tiene límites de memoria
- La configuración está optimizada para usar menos memoria

### Error de Timeout
- Los timeouts están configurados a 120 segundos
- Si sigue fallando, aumenta el timeout

## Costos

- **Plan Gratuito**: 750 horas/mes
- **Plan Pago**: $7/mes para siempre activo
- **Base de datos**: Incluida en el plan gratuito

## Ventajas de Render

✅ **Fácil despliegue**
✅ **SSL automático**
✅ **Logs en tiempo real**
✅ **Escalable**
✅ **Base de datos incluida**
✅ **Buena documentación**

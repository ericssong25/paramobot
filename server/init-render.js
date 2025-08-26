#!/usr/bin/env node

// Script de inicialización para Render
console.log('🚀 Inicializando WhatsApp Bot en Render...');

// Verificar variables de entorno
const requiredEnvVars = ['PORT', 'NODE_ENV'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars);
  process.exit(1);
}

console.log('✅ Variables de entorno verificadas');
console.log('📱 Puerto:', process.env.PORT);
console.log('🌍 Entorno:', process.env.NODE_ENV);

// Iniciar el servidor
require('./index.js');

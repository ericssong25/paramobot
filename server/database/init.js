const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || './database/instagram_bot.db';

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create comment_rules table
      db.run(`
        CREATE TABLE IF NOT EXISTS comment_rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          trigger_text TEXT NOT NULL,
          response_text TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          match_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create dm_campaigns table
      db.run(`
        CREATE TABLE IF NOT EXISTS dm_campaigns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          message_template TEXT NOT NULL,
          status TEXT DEFAULT 'paused',
          sent_count INTEGER DEFAULT 0,
          opened_count INTEGER DEFAULT 0,
          responded_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create analytics table
      db.run(`
        CREATE TABLE IF NOT EXISTS analytics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date DATE NOT NULL,
          comments_processed INTEGER DEFAULT 0,
          responses_sent INTEGER DEFAULT 0,
          dms_sent INTEGER DEFAULT 0,
          engagement_rate REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create bot_settings table
      db.run(`
        CREATE TABLE IF NOT EXISTS bot_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          setting_key TEXT UNIQUE NOT NULL,
          setting_value TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create WhatsApp rules table
      db.run(`
        CREATE TABLE IF NOT EXISTS whatsapp_rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          trigger_text TEXT NOT NULL,
          response_text TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          match_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create WhatsApp analytics table
      db.run(`
        CREATE TABLE IF NOT EXISTS whatsapp_analytics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sender TEXT NOT NULL,
          message TEXT NOT NULL,
          rule_id INTEGER,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (rule_id) REFERENCES whatsapp_rules (id)
        )
      `);

      // Create conditional responses table
      db.run(`
        CREATE TABLE IF NOT EXISTS conditional_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          option_name TEXT NOT NULL,
          response_text TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          use_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create conversation flows table
      db.run(`
        CREATE TABLE IF NOT EXISTS conversation_flows (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          flow_name TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create flow steps table
      db.run(`
        CREATE TABLE IF NOT EXISTS flow_steps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          flow_id INTEGER NOT NULL,
          step_number INTEGER NOT NULL,
          parent_step_id INTEGER,
          question_text TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (flow_id) REFERENCES conversation_flows (id),
          FOREIGN KEY (parent_step_id) REFERENCES flow_steps (id)
        )
      `);

      // Create flow options table
      db.run(`
        CREATE TABLE IF NOT EXISTS flow_options (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          step_id INTEGER NOT NULL,
          option_number INTEGER NOT NULL,
          option_text TEXT NOT NULL,
          response_text TEXT NOT NULL,
          next_step_id INTEGER,
          is_back_option BOOLEAN DEFAULT 0,
          is_final_response BOOLEAN DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          use_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (step_id) REFERENCES flow_steps (id),
          FOREIGN KEY (next_step_id) REFERENCES flow_steps (id)
        )
      `);

      // Create nested responses table for flow options
      db.run(`
        CREATE TABLE IF NOT EXISTS flow_nested_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          option_id INTEGER NOT NULL,
          trigger_text TEXT NOT NULL,
          response_text TEXT NOT NULL,
          is_active BOOLEAN DEFAULT 1,
          use_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (option_id) REFERENCES flow_options (id)
        )
      `);

      // Add is_final_response column to existing flow_options table if it doesn't exist
      db.run(`
        ALTER TABLE flow_options ADD COLUMN is_final_response BOOLEAN DEFAULT 0
      `, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding is_final_response column:', err);
        } else {
          console.log('✅ is_final_response column added to flow_options table');
        }
      });

      // Insert default comment rules
      db.run(`
        INSERT OR IGNORE INTO comment_rules (trigger_text, response_text, is_active) VALUES
        ('price', 'Hi! Thanks for your interest. Please check our DM for pricing details! 💰', 1),
        ('info', 'Hello! I''ll send you all the information right away. Check your DMs! 📩', 1),
        ('contact', 'Great question! Let me connect you with our team. DMing you now! 🤝', 1)
      `);

      // Insert default DM campaigns
      db.run(`
        INSERT OR IGNORE INTO dm_campaigns (name, message_template, status) VALUES
        ('Welcome New Followers', 'Welcome! Thanks for following us. We''re excited to have you here! 🎉', 'active'),
        ('Product Promotion', 'Hey! Check out our latest products. We think you''ll love them! 🛍️', 'paused'),
        ('Follow-up Sequence', 'Hi again! Just wanted to follow up on our previous conversation. How are things going? 🤔', 'active')
      `);

      // Insert default bot settings
      db.run(`
        INSERT OR IGNORE INTO bot_settings (setting_key, setting_value) VALUES
        ('auto_reply_enabled', 'true'),
        ('check_interval_minutes', '5'),
        ('max_daily_replies', '100'),
        ('instagram_connected', 'false'),
        ('whatsapp_auto_reply', 'true'),
        ('monitoring_interval', '30000'),
        ('flow_end_message', '🏁 Conversación finalizada. ¡Gracias por tu tiempo!'),
        ('flow_back_message', 'Volviendo al menú anterior...'),
        ('flow_error_message', '❌ Por favor, responde con un número válido (1, 2, 3...).')
      `);

      // Insert default WhatsApp rules only if table is empty
      db.get('SELECT COUNT(*) as count FROM whatsapp_rules', (err, row) => {
        if (err) {
          console.error('Error checking WhatsApp rules count:', err);
          return;
        }
        
        if (row.count === 0) {
          db.run(`
            INSERT INTO whatsapp_rules (trigger_text, response_text, is_active) VALUES
            ('hola', '¡Hola! Gracias por escribirnos. ¿En qué podemos ayudarte? 😊', 1),
            ('precio', '¡Hola! El precio es $99. ¿Te interesa? 💰', 1),
            ('info', '¡Hola! Aquí tienes más información: https://ejemplo.com 📋', 1),
            ('contacto', '¡Hola! Puedes contactarnos al +1234567890 📞', 1),
            ('horarios', '¡Hola! Nuestros horarios son de 9:00 AM a 6:00 PM de lunes a viernes 🕘', 1)
          `, (err) => {
            if (err) {
              console.error('Error inserting default WhatsApp rules:', err);
            } else {
              console.log('✅ Default WhatsApp rules inserted');
            }
          });
        } else {
          console.log('ℹ️ WhatsApp rules already exist, skipping default insertion');
        }
      });

      // Insert default conditional responses
      db.get('SELECT COUNT(*) as count FROM conditional_responses', (err, row) => {
        if (err) {
          console.error('Error checking conditional responses count:', err);
          return;
        }
        
        if (row.count === 0) {
          db.run(`
            INSERT INTO conditional_responses (option_name, response_text, is_active) VALUES
            ('ver productos', '🛍️ **Nuestros Productos:**\n\n• **Producto A** - $99\n  _Descripción del producto A_\n\n• **Producto B** - $149\n  _Descripción del producto B_\n\n• **Producto C** - $199\n  _Descripción del producto C_\n\n💡 ¿Te interesa alguno? Responde con el número del producto.', 1),
            ('consultar precios', '💰 **Nuestros Precios:**\n\n• **Consulta Básica** - $50\n  _Incluye evaluación inicial_\n\n• **Consulta Completa** - $100\n  _Incluye análisis detallado_\n\n• **Consulta Premium** - $200\n  _Incluye plan personalizado_\n\n💡 ¿Cuál prefieres? Responde con el número de la consulta.', 1),
            ('contactar', '📞 **Información de Contacto:**\n\n• **WhatsApp:** +1234567890\n• **Email:** info@empresa.com\n• **Horarios:** 9:00 AM - 6:00 PM\n• **Ubicación:** Ciudad, País\n\n💡 ¿En qué podemos ayudarte?', 1)
          `, (err) => {
            if (err) {
              console.error('Error inserting default conditional responses:', err);
            } else {
              console.log('✅ Default conditional responses inserted');
            }
          });
        } else {
          console.log('ℹ️ Conditional responses already exist, skipping default insertion');
        }
      });

      // Insert default conversation flow
      db.get('SELECT COUNT(*) as count FROM conversation_flows', (err, row) => {
        if (err) {
          console.error('Error checking conversation flows count:', err);
          return;
        }
        
        if (row.count === 0) {
          // Create default flow
          db.run(`
            INSERT INTO conversation_flows (flow_name, is_active) VALUES
            ('Flujo Principal', 1)
          `, function(err) {
            if (err) {
              console.error('Error inserting default flow:', err);
              return;
            }
            
            const flowId = this.lastID;
            
            // Create step 1 (main question)
            db.run(`
              INSERT INTO flow_steps (flow_id, step_number, parent_step_id, question_text, is_active) VALUES
              (?, 1, NULL, '¡Hola! ¿En qué puedo ayudarte hoy?', 1)
            `, [flowId], function(err) {
              if (err) {
                console.error('Error inserting step 1:', err);
                return;
              }
              
              const step1Id = this.lastID;
              
              // Create step 2 (products sub-question)
              db.run(`
                INSERT INTO flow_steps (flow_id, step_number, parent_step_id, question_text, is_active) VALUES
                (?, 2, ?, '¿Qué tipo de producto te interesa?', 1)
              `, [flowId, step1Id], function(err) {
                if (err) {
                  console.error('Error inserting step 2:', err);
                  return;
                }
                
                const step2Id = this.lastID;
                
                // Create step 3 (prices sub-question)
                db.run(`
                  INSERT INTO flow_steps (flow_id, step_number, parent_step_id, question_text, is_active) VALUES
                  (?, 3, ?, '¿Qué tipo de consulta necesitas?', 1)
                `, [flowId, step1Id], function(err) {
                  if (err) {
                    console.error('Error inserting step 3:', err);
                    return;
                  }
                  
                  const step3Id = this.lastID;
                  
                  // Create options for step 1
                  db.run(`
                    INSERT INTO flow_options (step_id, option_number, option_text, response_text, next_step_id, is_back_option, is_active) VALUES
                    (?, 1, 'Ver productos', '🛍️ Te muestro nuestros productos:', ?, 0, 1),
                    (?, 2, 'Consultar precios', '💰 Te ayudo con los precios:', ?, 0, 1),
                    (?, 3, 'Contactar', '📞 Aquí tienes nuestra información de contacto:\n\n• WhatsApp: +1234567890\n• Email: info@empresa.com\n• Horarios: 9:00 AM - 6:00 PM', NULL, 0, 1)
                  `, [step1Id, step2Id, step1Id, step3Id, step1Id], function(err) {
                    if (err) {
                      console.error('Error inserting step 1 options:', err);
                      return;
                    }
                    
                    // Create options for step 2 (products)
                    db.run(`
                      INSERT INTO flow_options (step_id, option_number, option_text, response_text, next_step_id, is_back_option, is_active) VALUES
                      (?, 1, 'Producto A', '🛍️ **Producto A - $99**\n\nDescripción detallada del producto A con todas sus características y beneficios.\n\n¿Te interesa comprarlo?', NULL, 0, 1),
                      (?, 2, 'Producto B', '🛍️ **Producto B - $149**\n\nDescripción detallada del producto B con todas sus características y beneficios.\n\n¿Te interesa comprarlo?', NULL, 0, 1),
                      (?, 3, 'Producto C', '🛍️ **Producto C - $199**\n\nDescripción detallada del producto C con todas sus características y beneficios.\n\n¿Te interesa comprarlo?', NULL, 0, 1),
                      (?, 4, '← Volver', 'Volviendo al menú principal...', ?, 1, 1)
                    `, [step2Id, step2Id, step2Id, step2Id, step1Id], function(err) {
                      if (err) {
                        console.error('Error inserting step 2 options:', err);
                        return;
                      }
                      
                      // Create options for step 3 (prices)
                      db.run(`
                        INSERT INTO flow_options (step_id, option_number, option_text, response_text, next_step_id, is_back_option, is_active) VALUES
                        (?, 1, 'Consulta Básica', '💰 **Consulta Básica - $50**\n\nIncluye:\n• Evaluación inicial\n• Recomendaciones básicas\n• Reporte simple\n\n¿Quieres proceder?', NULL, 0, 1),
                        (?, 2, 'Consulta Completa', '💰 **Consulta Completa - $100**\n\nIncluye:\n• Análisis detallado\n• Plan personalizado\n• Seguimiento por 30 días\n\n¿Quieres proceder?', NULL, 0, 1),
                        (?, 3, 'Consulta Premium', '💰 **Consulta Premium - $200**\n\nIncluye:\n• Análisis exhaustivo\n• Plan estratégico completo\n• Seguimiento por 90 días\n• Soporte prioritario\n\n¿Quieres proceder?', NULL, 0, 1),
                        (?, 4, '← Volver', 'Volviendo al menú principal...', ?, 1, 1)
                      `, [step3Id, step3Id, step3Id, step3Id, step1Id], function(err) {
                        if (err) {
                          console.error('Error inserting step 3 options:', err);
                        } else {
                          console.log('✅ Default conversation flow created successfully');
                        }
                      });
                    });
                  });
                });
              });
            });
          });
        } else {
          console.log('ℹ️ Conversation flows already exist, skipping default insertion');
        }
      });

      console.log('✅ Database initialized successfully');
      resolve();
    });
  });
};

const getDatabase = () => db;

module.exports = {
  initializeDatabase,
  getDatabase
};

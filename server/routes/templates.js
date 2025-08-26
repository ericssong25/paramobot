const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');

const db = getDatabase();

// Get all templates
router.get('/', (req, res) => {
  db.all('SELECT * FROM dm_campaigns ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create new template
router.post('/', (req, res) => {
  const { name, message_template, category = 'general' } = req.body;
  
  if (!name || !message_template) {
    return res.status(400).json({ error: 'Name and message template are required' });
  }

  db.run(
    'INSERT INTO dm_campaigns (name, message_template, status) VALUES (?, ?, ?)',
    [name, message_template, 'paused'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      db.get('SELECT * FROM dm_campaigns WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(201).json(row);
      });
    }
  );
});

// Update template
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, message_template } = req.body;

  db.run(
    'UPDATE dm_campaigns SET name = ?, message_template = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, message_template, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }
      
      db.get('SELECT * FROM dm_campaigns WHERE id = ?', [id], (err, row) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(row);
      });
    }
  );
});

// Delete template
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM dm_campaigns WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ message: 'Template deleted successfully' });
  });
});

module.exports = router;

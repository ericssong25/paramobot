const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');

const db = getDatabase();

// Get analytics overview
router.get('/overview', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's analytics
  db.get(
    'SELECT * FROM analytics WHERE date = ?',
    [today],
    (err, todayData) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Get total comment rules
      db.get('SELECT COUNT(*) as count FROM comment_rules WHERE is_active = 1', (err, rulesCount) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Get total DM campaigns
        db.get('SELECT COUNT(*) as count FROM dm_campaigns WHERE status = "active"', (err, campaignsCount) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Get last 7 days analytics
          db.all(
            'SELECT * FROM analytics WHERE date >= date("now", "-7 days") ORDER BY date DESC',
            (err, weeklyData) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              res.json({
                today: todayData || {
                  comments_processed: 0,
                  responses_sent: 0,
                  dms_sent: 0,
                  engagement_rate: 0
                },
                weekly: weeklyData,
                stats: {
                  activeRules: rulesCount.count,
                  activeCampaigns: campaignsCount.count
                }
              });
            }
          );
        });
      });
    }
  );
});

// Get weekly analytics
router.get('/weekly', (req, res) => {
  db.all(
    'SELECT * FROM analytics WHERE date >= date("now", "-7 days") ORDER BY date DESC',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get monthly analytics
router.get('/monthly', (req, res) => {
  db.all(
    'SELECT * FROM analytics WHERE date >= date("now", "-30 days") ORDER BY date DESC',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Record analytics data
router.post('/record', (req, res) => {
  const { comments_processed = 0, responses_sent = 0, dms_sent = 0, engagement_rate = 0 } = req.body;
  const today = new Date().toISOString().split('T')[0];

  // Check if record exists for today
  db.get('SELECT id FROM analytics WHERE date = ?', [today], (err, existing) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (existing) {
      // Update existing record
      db.run(
        'UPDATE analytics SET comments_processed = ?, responses_sent = ?, dms_sent = ?, engagement_rate = ? WHERE date = ?',
        [comments_processed, responses_sent, dms_sent, engagement_rate, today],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: 'Analytics updated successfully' });
        }
      );
    } else {
      // Create new record
      db.run(
        'INSERT INTO analytics (date, comments_processed, responses_sent, dms_sent, engagement_rate) VALUES (?, ?, ?, ?, ?)',
        [today, comments_processed, responses_sent, dms_sent, engagement_rate],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: 'Analytics recorded successfully' });
        }
      );
    }
  });
});

// Get top performing rules
router.get('/top-rules', (req, res) => {
  db.all(
    'SELECT trigger_text, response_text, match_count FROM comment_rules WHERE is_active = 1 ORDER BY match_count DESC LIMIT 5',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get top performing campaigns
router.get('/top-campaigns', (req, res) => {
  db.all(
    'SELECT name, sent_count, opened_count, responded_count FROM dm_campaigns ORDER BY sent_count DESC LIMIT 5',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

module.exports = router;

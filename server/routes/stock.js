const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { classifyBatch, assessFacilityStockTrust } = require('../engines/stockFreshnessEngine');
const eAushadhiAdapter = require('../adapters/eAushadhiAdapter');

module.exports = function(db) {
  // GET /api/stock — list by facility
  router.get('/', authenticateToken, (req, res) => {
    try {
      const { facility_id, medicine } = req.query;
      let query = 'SELECT s.*, f.name as facility_name FROM stock s LEFT JOIN facilities f ON s.facility_id = f.facility_id WHERE 1=1';
      const params = [];
      if (facility_id) { query += ' AND s.facility_id = ?'; params.push(facility_id); }
      if (medicine) { query += ' AND s.medicine_name LIKE ?'; params.push(`%${medicine}%`); }
      query += ' ORDER BY s.medicine_name';

      const items = db.prepare(query).all(...params);
      const classified = classifyBatch(items);
      res.json(classified);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch stock.' });
    }
  });

  // GET /api/stock/search/:medicine — search across facilities
  router.get('/search/:medicine', (req, res) => {
    try {
      const items = db.prepare('SELECT s.*, f.name as facility_name, f.lat, f.lng FROM stock s LEFT JOIN facilities f ON s.facility_id = f.facility_id WHERE s.medicine_name LIKE ? AND s.quantity > 0 ORDER BY s.quantity DESC').all(`%${req.params.medicine}%`);
      const classified = classifyBatch(items);

      // Also get adapter data
      const adapterData = eAushadhiAdapter.searchMedicine(req.params.medicine);

      res.json({ local_stock: classified, e_aushadhi: adapterData });
    } catch (err) {
      res.status(500).json({ error: 'Failed to search stock.' });
    }
  });

  // GET /api/stock/trust/:facilityId
  router.get('/trust/:facilityId', authenticateToken, (req, res) => {
    try {
      const items = db.prepare('SELECT * FROM stock WHERE facility_id = ?').all(req.params.facilityId);
      const trust = assessFacilityStockTrust(items);
      res.json(trust);
    } catch (err) {
      res.status(500).json({ error: 'Failed to assess stock trust.' });
    }
  });

  // PUT /api/stock/:id — update
  router.put('/:id', authenticateToken, authorizeRoles('facility_staff'), (req, res) => {
    try {
      const { quantity, quantity_status } = req.body;
      const existing = db.prepare('SELECT * FROM stock WHERE id = ?').get(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Stock item not found.' });

      db.prepare("UPDATE stock SET quantity = ?, quantity_status = ?, last_updated = datetime('now'), updated_by = ? WHERE id = ?").run(
        quantity ?? existing.quantity, quantity_status || existing.quantity_status, req.user.user_id, req.params.id
      );

      db.prepare("INSERT INTO audit_log (id, entity, entity_id, action, actor, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))").run(
        uuidv4(), 'stock', req.params.id, 'update', req.user.user_id, `${existing.medicine_name}: qty ${existing.quantity}→${quantity ?? existing.quantity}`
      );

      res.json({ message: 'Stock updated.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update stock.' });
    }
  });

  // POST /api/stock — add new item
  router.post('/', authenticateToken, authorizeRoles('facility_staff'), (req, res) => {
    try {
      const { facility_id, medicine_name, quantity, quantity_status } = req.body;
      if (!facility_id || !medicine_name) return res.status(400).json({ error: 'facility_id and medicine_name required.' });

      const id = uuidv4();
      db.prepare('INSERT INTO stock (id, facility_id, medicine_name, quantity, quantity_status, updated_by) VALUES (?, ?, ?, ?, ?, ?)').run(
        id, facility_id, medicine_name, quantity || 0, quantity_status || 'available', req.user.user_id
      );

      res.status(201).json({ id, medicine_name });
    } catch (err) {
      res.status(500).json({ error: 'Failed to add stock item.' });
    }
  });

  return router;
};

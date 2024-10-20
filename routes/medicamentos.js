// routes/medicamentos.js
const express = require('express');
const router = express.Router();

// Obtener todos los medicamentos
router.get('/', async (req, res) => {
  try {
    const [rows] = await req.pool.query('SELECT * FROM medicamentos');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los medicamentos' });
  }
});

// Obtener un medicamento por su CodPlex
router.get('/:CodPlex', async (req, res) => {
  const { CodPlex } = req.params;
  try {
    const [rows] = await req.pool.query('SELECT * FROM medicamentos WHERE CodPlex = ?', [CodPlex]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el medicamento' });
  }
});

// Buscar medicamentos por coincidencia parcial de código de barras
router.get('/buscar/codigo-de-barras', async (req, res) => {
  const { codebar } = req.query;
  if (!codebar) {
    return res.status(400).json({ error: 'Se requiere un código de barras para la búsqueda' });
  }

  try {
    const [rows] = await req.pool.query('SELECT * FROM medicamentos WHERE codebar LIKE ?', [`%${codebar}%`]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron medicamentos con ese código de barras' });
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al buscar medicamentos por código de barras' });
  }
});

module.exports = router;

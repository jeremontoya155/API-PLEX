// routes/ventas.js
const express = require('express');
const router = express.Router();

// Obtener todas las ventas o ventas de un producto en particular
router.get('/', async (req, res) => {
  const { idProducto } = req.query; // Capturar el idProducto de los parámetros de consulta

  try {
    // Conexión a la base de datos desde el middleware
    const pool = req.pool;

    let query1 = `
      SELECT 
        factlineas.IDProducto,
        factlineas.Detalle,  
        SUM(factlineas.CantDecimal) AS TotalCantidad
      FROM 
        factcabecera
      LEFT JOIN 
        factlineas ON factcabecera.IDComprobante = factlineas.IDComprobante
      WHERE 
        factcabecera.Sucursal = 33
      AND 
        factcabecera.Emision BETWEEN '2024-09-25' AND '2024-10-06'
      AND 
        factcabecera.Tipo IN ('FV', 'NC')
    `;

    let query2 = `
      SELECT 
        factlineas.IDProducto,
        factlineas.Detalle,
        SUM(CASE 
            WHEN factlineas.Detalle LIKE '% G' OR factlineas.Detalle LIKE '% KG' 
            THEN factlineas.CantDecimal / 1000
            ELSE factlineas.CantDecimal
        END) AS TotalCantidad
      FROM 
        factcabecera
      LEFT JOIN 
        factlineas ON factcabecera.IDComprobante = factlineas.IDComprobante
      WHERE 
        factcabecera.Sucursal = 33
      AND 
        factcabecera.Emision BETWEEN '2024-10-07' AND CURDATE()
      AND 
        factcabecera.Tipo IN ('FV', 'NC')
    `;

    // Si hay idProducto en la query, añadir la condición de filtro
    if (idProducto) {
      query1 += ` AND factlineas.IDProducto = ${idProducto} GROUP BY factlineas.IDProducto;`;
      query2 += ` AND factlineas.IDProducto = ${idProducto} GROUP BY factlineas.IDProducto;`;
    } else {
      query1 += ` GROUP BY factlineas.IDProducto;`;
      query2 += ` GROUP BY factlineas.IDProducto;`;
    }

    // Ejecutar las consultas
    const [rows1] = await pool.query(query1);
    const [rows2] = await pool.query(query2);

    // Concatenar los resultados de ambas consultas
    const ventas = [...rows1, ...rows2];

    // Si no hay ventas, devolver error 404
    if (ventas.length === 0) {
      return res.status(404).json({ error: 'No se encontraron ventas' });
    }

    // Agrupar por IDProducto, sumar las cantidades si hay ventas repetidas
    const ventasAgrupadas = ventas.reduce((acc, venta) => {
      const existing = acc.find(item => item.IDProducto === venta.IDProducto);
      if (existing) {
        existing.TotalCantidad += venta.TotalCantidad;
      } else {
        acc.push(venta);
      }
      return acc;
    }, []);

    // Devolver los resultados como respuesta JSON
    res.json(ventasAgrupadas);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener las ventas' });
  }
});

module.exports = router;

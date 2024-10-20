// app.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const medicamentosRouter = require('./routes/medicamentos');
const dotenv = require('dotenv');

// Cargar variables de entorno desde .env
dotenv.config();

const app = express();
app.set('view engine', 'ejs');

// Configuración de CORS
app.use(cors({
  origin: '*', // Permitir todos los orígenes
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'] // Encabezados permitidos
}));

// Configuración de la conexión a MySQL desde variables de entorno
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

// Middleware para pasar la conexión de base de datos a las rutas
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// Ruta principal para la documentación de los endpoints (siempre accesible)
app.get('/', (req, res) => {
  res.render('index');
});

// Middleware para verificar la clave API solo para rutas protegidas
const checkApiKey = (req, res, next) => {
  const apiKey = req.header('Authorization'); // Leer el header Authorization
  if (apiKey && apiKey === process.env.API_KEY) {
    next(); // Si la clave es válida, continúa
  } else {
    res.status(403).json({ error: 'Clave API inválida' });
  }
};

// Aplicar el middleware de la clave API solo en las rutas de medicamentos
app.use('/medicamentos', checkApiKey, medicamentosRouter);

// Establecer el puerto desde la variable de entorno o usar el 3000 por defecto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API corriendo en el puerto ${PORT}`);
});

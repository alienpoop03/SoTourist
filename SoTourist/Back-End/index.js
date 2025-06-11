require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trip');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 3000;
const HOST = 'localhost';
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

app.use(cors({
    origin: '*'
}));
  
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));


// Rotte
app.use('/api/itinerary', require('./routes/itinerary'));

//database
app.use('/api/auth', authRoutes);
app.use('/api', tripRoutes);


/*app.listen(3000, '0.0.0.0', () => {
    console.log("Server avviato");
});*/
  

app.listen(PORT,HOST, () => {
  console.log(`✅ Server attivo su http://${HOST}:${PORT}`); 
});
  

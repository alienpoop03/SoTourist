require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trip');


const app = express();
const PORT = process.env.PORT || 10000;
const HOST = '18.156.158.53';

app.use(cors({
    origin: '*'
}));
  
app.use(express.json());


// Rotte
app.use('/api/itinerary', require('./routes/itinerary'));

//database
app.use('/api/auth', authRoutes);
app.use('/api', tripRoutes);


/*app.listen(3000, '0.0.0.0', () => {
    console.log("Server avviato");
});*/
  

app.listen(PORT, HOST, () => {
  console.log(`✅ Server attivo su http://${HOST}:${PORT}`);
});
  

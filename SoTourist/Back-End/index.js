require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trip');


const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

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
  

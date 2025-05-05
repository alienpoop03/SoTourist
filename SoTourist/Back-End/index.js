require('dotenv').config();
const express = require('express');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*'
}));
  
app.use(express.json());

// Rotte
app.use('/api/itinerary', require('./routes/itinerary'));

/*app.listen(3000, '0.0.0.0', () => {
    console.log("Server avviato");
});*/
  

app.listen(PORT, () => {
    console.log(`✅ Server attivo su http://localhost:${PORT}`);
});
  

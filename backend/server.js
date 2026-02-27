import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import pantryRoutes from './routes/pantry.js';
import recipeRoutes from './routes/recipes.js';
import mealPlanRoutes from './routes/mealPlans.js';
import shoppingListRoutes from './routes/shoppingList.js';


dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // JSON gövdesini ayrıştırır
app.use(express.urlencoded({ extended: true })); // Form verilerini ayrıştırır

// Hata Ayıklama Middleware (Sadece gelen istekleri görmek için)
app.use((req, res, next) => {
    if (req.method !== 'GET') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        console.log('Body:', req.body); // Terminalde body'nin gelip gelmediğini kontrol et
    }
    next();
});

// Temel Rota
app.get('/', (req, res) => {
    res.json({ message: 'Recipe App API is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pantry', pantryRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/shopping-list', shoppingListRoutes);

// Hata Yakalama Middleware (Genel hataları terminalde düzgün görmek için)
app.use((err, req, res, next) => {
    console.error('Hata Detayı:', err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('passport');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(passport.initialize());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB successfully!'))
    .catch(err => console.error('MongoDB connection error:', err));

require('./config/passport');

// Routes
const authRoutes = require('./routes/auth');
const goalRoutes = require('./routes/goals');
const managerRoutes = require('./routes/manager');
const adminRoutes = require('./routes/admin');
const escalationRoutes = require('./routes/escalations');

app.use('/auth', authRoutes);
app.use('/goals', goalRoutes);
app.use('/manager', managerRoutes);
app.use('/admin', adminRoutes);
app.use('/escalations', escalationRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'AtomQuest Goal Tracking API' });
});

// Auth Routes (to be added)
// Goal Routes (to be added)
// User Routes (to be added)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Start Cron Jobs
    const { startCron } = require('./services/escalationCron');
    startCron();
});

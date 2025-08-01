const dotenv = require('dotenv');
const sequelize = require('./config/database');
const syncDatabase = require('./config/sync-db');
const app = require('./app');

// Load environment variables
dotenv.config();

// Test database connection
sequelize.authenticate()
  .then(async () => {
    console.log('Database connection has been established successfully.');
    
    // Sync database models
    await syncDatabase();
    
    // Start server after database is synced
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  }); 
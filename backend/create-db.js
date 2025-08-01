const { Sequelize } = require('sequelize');
require('dotenv').config();

// Connect to the default postgres database first
const sequelize = new Sequelize('postgres', process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'postgres',
  logging: console.log
});

async function createDatabase() {
  try {
    // Connect to postgres database
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');
    
    // Create the new database
    await sequelize.query(`CREATE DATABASE ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} created successfully`);
    
    // Connect to the newly created database and create the user_basic_profiles table
    const dbSequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: console.log
    });
    
    // Create the user_basic_profiles table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS user_basic_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auth_id UUID NOT NULL REFERENCES auths(id),
        full_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(20),
        date_of_birth DATE,
        street_address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        pin_code VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    try {
      await dbSequelize.query(createTableQuery);
      console.log('user_basic_profiles table created or already exists');
    } catch (error) {
      console.error('Error creating user_basic_profiles table:', error);
      console.log('Note: If you get a reference error, the auths table might not exist yet. This will be created when you start the app.');
    }
    
    await dbSequelize.close();
  } catch (error) {
    console.error('Error creating database:', error.message);
    if (error.message.includes('already exists')) {
      console.log(`Database ${process.env.DB_NAME} already exists, continuing...`);
    }
  } finally {
    await sequelize.close();
  }
}

createDatabase(); 
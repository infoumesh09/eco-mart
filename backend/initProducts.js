require('dotenv').config();
const axios = require('axios');

async function initializeProducts() {
  try {
    console.log('Initializing product data...');
    
    const response = await axios.post('http://localhost:3000/api/products/init');
    
    console.log('Product initialization response:', response.data);
    console.log('Products initialized successfully!');
  } catch (error) {
    console.error('Error initializing products:');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    } else {
      console.error(error.message);
    }
  }
}

initializeProducts(); 
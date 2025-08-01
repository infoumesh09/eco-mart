// Cart API handler
const API_URL = 'http://localhost:3000/api';

// Function to check if user is authenticated
const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

// Function to generate a UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Function to ensure product ID is a valid UUID
function ensureValidUUID(id) {
  // If ID is already a UUID, return it
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id;
  }
  
  // Otherwise, generate a UUID based on the ID
  // Store mapping in localStorage to ensure consistency
  const idMappings = JSON.parse(localStorage.getItem('productIdMappings') || '{}');
  
  if (!idMappings[id]) {
    idMappings[id] = generateUUID();
    localStorage.setItem('productIdMappings', JSON.stringify(idMappings));
  }
  
  return idMappings[id];
}

// Function to get user's cart from API
async function getCart() {
  if (!isAuthenticated()) {
    return { items: [], total: 0 };
  }

  try {
    console.log('Fetching cart from API...');
    console.log('API URL:', `${API_URL}/cart`);
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
    
    const response = await fetch(`${API_URL}/cart`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response data:', errorData);
      throw new Error(`Failed to fetch cart: ${response.status} ${response.statusText}`);
    }

    const cart = await response.json();
    console.log('Cart data received:', cart);
    return cart;
  } catch (error) {
    console.error('Error fetching cart:', error);
    showToast('Error loading your cart', 'error');
    return { items: [], total: 0 };
  }
}

// Function to add item to cart
async function addToCart(productId, quantity, price, name, image) {
  console.log('Adding to cart:', { productId, quantity, price, name, image });
  
  if (!isAuthenticated()) {
    console.log('User not authenticated, adding to local storage');
    // For non-authenticated users, use local storage
    addToLocalCart(productId, quantity, price, name, image);
    return;
  }

  try {
    // Convert productId to a valid UUID format for the database
    const uuidProductId = ensureValidUUID(productId);
    console.log('Original productId:', productId);
    console.log('UUID converted productId:', uuidProductId);
    
    console.log('User authenticated, sending to API:', `${API_URL}/cart/add`);
    console.log('Request payload:', {
      productId: uuidProductId,
      quantity,
      price,
      name,
      image
    });
    
    const response = await fetch(`${API_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        productId: uuidProductId,
        quantity,
        price,
        name,
        image
      })
    });

    console.log('API Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response data:', errorData);
      throw new Error(`Failed to add item to cart: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Item added successfully:', result);
    
    // Also add to local storage for backup
    addToLocalCartSilently(productId, quantity, price, name, image);
    
    showToast('Item added to cart', 'success');
    return result;
  } catch (error) {
    console.error('Error adding to cart:', error);
    showToast('Error adding item to cart', 'error');
    
    // Fallback to local storage
    addToLocalCart(productId, quantity, price, name, image);
  }
}

// Function to add to local cart without showing toast (for background sync)
function addToLocalCartSilently(productId, quantity, price, name, image) {
  try {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    // Check if product already exists in the cart
    const existingItem = cartItems.find(item => 
      (item.id && item.id.toString() === productId.toString()) || 
      (item.productId && item.productId.toString() === productId.toString())
    );
    
    if (existingItem) {
      // Update quantity if item exists
      existingItem.quantity = (parseInt(existingItem.quantity) || 0) + parseInt(quantity);
    } else {
      // Add new item
      cartItems.push({
        id: productId.toString(),
        productId: productId.toString(),
        name,
        price,
        quantity: parseInt(quantity),
        image
      });
    }
    
    // Save to localStorage
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    
    // No toast shown
    return { success: true };
  } catch (error) {
    console.error('Error adding to local cart silently:', error);
    return { success: false, error };
  }
}

// Function to update cart item quantity
async function updateCartItem(itemId, quantity) {
  if (!isAuthenticated()) {
    return updateLocalCartItem(itemId, quantity);
  }

  try {
    // For server operations, we need to ensure itemId is a valid UUID
    const uuidItemId = ensureValidUUID(itemId);
    console.log('Updating cart item:', { original: itemId, uuid: uuidItemId, quantity });
    
    const response = await fetch(`${API_URL}/cart/item/${uuidItemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        quantity
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error updating cart item:', errorData);
      throw new Error(`Failed to update cart item: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    showToast('Cart updated', 'success');
    return result;
  } catch (error) {
    console.error('Error updating cart item:', error);
    showToast('Error updating cart', 'error');
  }
}

// Function to remove item from cart
async function removeCartItem(itemId) {
  if (!isAuthenticated()) {
    return removeLocalCartItem(itemId);
  }

  try {
    // For server operations, we need to ensure itemId is a valid UUID
    const uuidItemId = ensureValidUUID(itemId);
    console.log('Removing cart item:', { original: itemId, uuid: uuidItemId });
    
    const response = await fetch(`${API_URL}/cart/item/${uuidItemId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error removing cart item:', errorData);
      throw new Error(`Failed to remove cart item: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    showToast('Item removed from cart', 'success');
    return result;
  } catch (error) {
    console.error('Error removing cart item:', error);
    showToast('Error removing item', 'error');
  }
}

// Function to clear cart
async function clearCart() {
  if (!isAuthenticated()) {
    clearLocalCart();
    return;
  }

  try {
    const response = await fetch(`${API_URL}/cart/clear`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to clear cart');
    }

    const result = await response.json();
    showToast('Cart cleared', 'success');
    return result;
  } catch (error) {
    console.error('Error clearing cart:', error);
    showToast('Error clearing cart', 'error');
  }
}

// Local cart functions for non-authenticated users
function getLocalCart() {
  try {
    console.log('Retrieving cart from localStorage');
    const cartItems = localStorage.getItem('cartItems');
    console.log('Raw cartItems from localStorage:', cartItems);
    
    if (!cartItems) {
      console.log('No cart items found in localStorage, returning empty array');
      return [];
    }
    
    try {
      const parsedItems = JSON.parse(cartItems);
      console.log('Successfully parsed cart items:', parsedItems);
      
      if (!Array.isArray(parsedItems)) {
        console.error('Parsed cart items is not an array, returning empty array instead');
        return [];
      }
      
      return parsedItems;
    } catch (parseError) {
      console.error('Error parsing cart items JSON:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error loading local cart:', error);
    return [];
  }
}

function addToLocalCart(productId, quantity, price, name, image) {
  try {
    console.log('Adding to local cart:', { productId, quantity, price, name, image });
    let cart = getLocalCart();
    console.log('Current cart before update:', cart);
    
    // Generate a UUID for this product ID
    const uuidProductId = ensureValidUUID(productId);
    console.log('Generated UUID for product:', uuidProductId);
    
    const existingItemIndex = cart.findIndex(item => 
      item.productId === productId || 
      item.productId === uuidProductId
    );
    
    if (existingItemIndex !== -1) {
      console.log('Found existing item at index:', existingItemIndex);
      cart[existingItemIndex].quantity += quantity;
      console.log('Updated quantity:', cart[existingItemIndex].quantity);
    } else {
      console.log('Adding new item to cart');
      
      // Ensure image path has 'images/' prefix if not already present
      let imagePath = image || '';
      if (imagePath && !imagePath.includes('/') && !imagePath.startsWith('images/')) {
        imagePath = 'images/' + imagePath;
        console.log('Added images/ prefix to image path:', imagePath);
      }
      
      // Ensure all required fields are present with proper types
      const newItem = {
        id: generateUUID(), // Generate a UUID for the cart item ID
        productId: uuidProductId,
        originalId: productId, // Store original ID for reference
        quantity: parseInt(quantity) || 1,
        price: parseFloat(price) || 0,
        name: name || 'Unknown Product',
        image: imagePath
      };
      console.log('New item:', newItem);
      cart.push(newItem);
    }
    
    console.log('Updated cart:', cart);
    
    // Ensure cart is an array
    if (!Array.isArray(cart)) {
      console.error('Cart is not an array, converting to array');
      cart = [];
    }
    
    // Save the cart
    localStorage.setItem('cartItems', JSON.stringify(cart));
    console.log('Cart saved to localStorage');
    
    showToast('Item added to cart', 'success');
  } catch (error) {
    console.error('Error adding to local cart:', error);
    showToast('Error adding item to cart', 'error');
  }
}

function updateLocalCartItem(itemId, quantity) {
  try {
    const cart = getLocalCart();
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
      cart[itemIndex].quantity = quantity;
      localStorage.setItem('cartItems', JSON.stringify(cart));
      showToast('Cart updated', 'success');
    }
  } catch (error) {
    console.error('Error updating local cart item:', error);
    showToast('Error updating cart', 'error');
  }
}

function removeLocalCartItem(itemId) {
  try {
    let cart = getLocalCart();
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem('cartItems', JSON.stringify(cart));
    showToast('Item removed from cart', 'success');
  } catch (error) {
    console.error('Error removing from local cart:', error);
    showToast('Error removing item', 'error');
  }
}

function clearLocalCart() {
  try {
    localStorage.setItem('cartItems', JSON.stringify([]));
    showToast('Cart cleared', 'success');
  } catch (error) {
    console.error('Error clearing local cart:', error);
    showToast('Error clearing cart', 'error');
  }
}

// Helper function to show toast messages
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Function to synchronize local cart with server when user logs in
async function syncCartWithServer() {
  if (!isAuthenticated()) {
    console.log('User not authenticated, cannot sync cart');
    return;
  }
  
  const localCart = getLocalCart();
  console.log('Local cart items for syncing:', localCart);
  
  if (localCart.length === 0) {
    console.log('No local cart items to sync');
    return;
  }
  
  try {
    let syncCount = 0;
    console.log('Starting to sync', localCart.length, 'items to server cart');
    
    // Add each local cart item to the server cart
    for (const item of localCart) {
      try {
        console.log('Syncing item:', item);
        
        // Extract item properties with fallbacks
        const productId = item.id || item.productId;
        const quantity = parseInt(item.quantity) || 1;
        const price = parseFloat(item.price) || 0;
        const name = item.name || 'Unknown Product';
        let image = item.image || '';
        
        // Ensure image path has 'images/' prefix if not already present
        if (image && !image.includes('/') && !image.startsWith('images/')) {
          image = 'images/' + image;
          console.log('Added images/ prefix to image path during sync:', image);
        }
        
        if (!productId) {
          console.error('Invalid product ID for item:', item);
          continue;
        }
        
        console.log('Adding item to server cart:', { 
          productId, quantity, price, name, image 
        });
        
        await addToCart(productId, quantity, price, name, image);
        syncCount++;
      } catch (itemError) {
        console.error('Error syncing individual item:', item, itemError);
      }
    }
    
    if (syncCount > 0) {
      // Clear local cart after syncing successfully
      console.log('Successfully synced', syncCount, 'items to server cart');
      clearLocalCart();
      return { success: true, count: syncCount };
    } else {
      console.error('Failed to sync any items to server cart');
      return { success: false, error: 'No items were synced' };
    }
  } catch (error) {
    console.error('Error syncing cart with server:', error);
    throw error;
  }
}

// Function to get wishlist items
async function getWishlist() {
  if (!isAuthenticated()) {
    console.log('User not authenticated, using local wishlist');
    return { items: getLocalWishlist() };
  }

  try {
    // Check if API server has wishlist endpoint available
    const response = await fetch(`${API_URL}/wishlist`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 404) {
      console.log('Wishlist API endpoint not available, using local storage instead');
      return { items: getLocalWishlist() };
    }

    if (!response.ok) {
      throw new Error('Failed to fetch wishlist');
    }

    const wishlist = await response.json();
    console.log('Fetched wishlist from server:', wishlist);
    
    // Cache server wishlist locally for persistence
    if (wishlist && Array.isArray(wishlist.items) && wishlist.items.length > 0) {
      console.log('Saving server wishlist to localStorage for persistence');
      localStorage.setItem('wishlistItems', JSON.stringify(wishlist.items));
    }
    
    return wishlist;
  } catch (error) {
    console.error('Error fetching wishlist, falling back to local storage:', error);
    return { items: getLocalWishlist() };
  }
}

// Function to add item to wishlist
async function addToWishlist(productId, price, name, image, description = '') {
  if (!isAuthenticated()) {
    console.log('User not authenticated, adding to local wishlist');
    addToLocalWishlist(productId, price, name, image, description);
    return { success: true, keptLocal: true };
  }

  try {
    // First check if the endpoint exists by using a HEAD request
    try {
      const checkResponse = await fetch(`${API_URL}/wishlist/add`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (checkResponse.status === 404) {
        console.log('Wishlist API endpoint not available, using local storage instead');
        addToLocalWishlist(productId, price, name, image, description);
        return { success: true, keptLocal: true };
      }
    } catch (headError) {
      console.log('Error checking wishlist endpoint, assuming not available:', headError);
      addToLocalWishlist(productId, price, name, image, description);
      return { success: true, keptLocal: true };
    }

    // If we reach here, endpoint might exist, try to use it
    const response = await fetch(`${API_URL}/wishlist/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId,
        price,
        name,
        image,
        description
      })
    });

    if (response.status === 404) {
      console.log('Wishlist API endpoint not available, using local storage instead');
      addToLocalWishlist(productId, price, name, image, description);
      return { success: true, keptLocal: true };
    }

    if (!response.ok) {
      throw new Error('Failed to add item to wishlist');
    }

    const result = await response.json();
    console.log('Added item to server wishlist:', result);
    return result;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    // Fallback to local storage
    addToLocalWishlist(productId, price, name, image, description);
    return { success: true, keptLocal: true };
  }
}

// Function to remove item from wishlist
async function removeFromWishlist(productId) {
  if (!isAuthenticated()) {
    console.log('User not authenticated, removing from local wishlist');
    removeFromLocalWishlist(productId);
    return { success: true, keptLocal: true };
  }

  try {
    // First check if the endpoint exists by using a HEAD request
    try {
      const checkResponse = await fetch(`${API_URL}/wishlist`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (checkResponse.status === 404) {
        console.log('Wishlist API endpoint not available, using local storage instead');
        removeFromLocalWishlist(productId);
        return { success: true, keptLocal: true };
      }
    } catch (headError) {
      console.log('Error checking wishlist endpoint, assuming not available:', headError);
      removeFromLocalWishlist(productId);
      return { success: true, keptLocal: true };
    }

    // If we reach here, endpoint might exist, try to use it
    const response = await fetch(`${API_URL}/wishlist/remove/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 404) {
      console.log('Wishlist remove API endpoint not available, using local storage instead');
      removeFromLocalWishlist(productId);
      return { success: true, keptLocal: true };
    }

    if (!response.ok) {
      throw new Error('Failed to remove item from wishlist');
    }

    const result = await response.json();
    console.log('Removed item from server wishlist:', result);
    return result;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    // Fallback to local storage
    removeFromLocalWishlist(productId);
    return { success: true, keptLocal: true };
  }
}

// Function to check if item is in wishlist
async function isInWishlist(productId) {
  if (!isAuthenticated()) {
    const items = getLocalWishlist();
    return items.some(item => 
      (item.id && item.id.toString() === productId.toString()) || 
      (item.productId && item.productId.toString() === productId.toString())
    );
  }

  try {
    // First try to get wishlist items - this has already been improved to handle 404s
    const wishlist = await getWishlist();
    if (!wishlist || !wishlist.items) return false;
    
    return wishlist.items.some(item => 
      (item.id && item.id.toString() === productId.toString()) || 
      (item.productId && item.productId.toString() === productId.toString())
    );
  } catch (error) {
    console.error('Error checking wishlist, falling back to local:', error);
    return getLocalWishlist().some(item => 
      (item.id && item.id.toString() === productId.toString()) || 
      (item.productId && item.productId.toString() === productId.toString())
    );
  }
}

// Function to synchronize local wishlist with server when user logs in
async function syncWishlistWithServer() {
  if (!isAuthenticated()) {
    console.log('User not authenticated, cannot sync wishlist');
    return { success: false, reason: 'Not authenticated' };
  }
  
  const localWishlist = getLocalWishlist();
  console.log('Local wishlist items for syncing:', localWishlist);
  
  if (localWishlist.length === 0) {
    console.log('No local wishlist items to sync');
    return { success: false, reason: 'No items to sync' };
  }
  
  // First check if the wishlist endpoint exists
  try {
    console.log('Checking if wishlist API endpoint exists...');
    const checkResponse = await fetch(`${API_URL}/wishlist`, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (checkResponse.status === 404) {
      // This is expected if the backend doesn't have a wishlist API endpoint
      console.log('Info: Wishlist API endpoint not available (404). This is normal if the backend does not implement wishlist functionality.');
      console.log('Keeping wishlist items in local storage instead.');
      return { success: false, reason: 'API not available', keptLocal: true };
    }
    
    if (!checkResponse.ok) {
      console.log(`Info: Wishlist API returned status ${checkResponse.status}. Using local storage as fallback.`);
      return { success: false, reason: `API returned ${checkResponse.status}`, keptLocal: true };
    }
  } catch (headError) {
    // This could be a network error or CORS issue
    console.log('Info: Could not check wishlist endpoint availability:', headError.message);
    console.log('Keeping wishlist items in local storage as fallback.');
    return { success: false, reason: 'API check failed', keptLocal: true };
  }
  
  // If API exists, try to sync items
  try {
    let syncCount = 0;
    console.log('Starting to sync', localWishlist.length, 'items to server wishlist');
    
    // Add each local wishlist item to the server wishlist
    for (const item of localWishlist) {
      try {
        console.log('Syncing wishlist item:', item);
        
        // Extract item properties with fallbacks
        const productId = item.id || item.productId;
        const price = parseFloat(item.price) || 0;
        const name = item.name || 'Unknown Product';
        const image = item.image || '';
        const description = item.description || '';
        
        if (!productId) {
          console.error('Invalid product ID for wishlist item:', item);
          continue;
        }
        
        console.log('Adding item to server wishlist:', { 
          productId, price, name, image, description 
        });
        
        const result = await addToWishlist(productId, price, name, image, description);
        if (result.success && !result.keptLocal) {
          syncCount++;
        }
      } catch (itemError) {
        console.error('Error syncing individual wishlist item:', item, itemError);
      }
    }
    
    if (syncCount > 0) {
      // Clear local wishlist after syncing successfully
      console.log('Successfully synced', syncCount, 'items to server wishlist');
      clearLocalWishlist();
      return { success: true, count: syncCount };
    } else {
      console.log('No items synced to server wishlist, keeping local items');
      return { success: false, error: 'No items were synced', keptLocal: true };
    }
  } catch (error) {
    console.log('Info: Error during wishlist sync. This is expected if the backend does not support the wishlist feature.');
    console.error('Error details:', error);
    return { success: false, error: error.message, keptLocal: true };
  }
}

// Local wishlist functions
function getLocalWishlist() {
  try {
    console.log('Retrieving wishlist from localStorage');
    const wishlistItems = localStorage.getItem('wishlistItems');
    console.log('Raw wishlistItems from localStorage:', wishlistItems);
    
    if (!wishlistItems) {
      console.log('No wishlist items found in localStorage, returning empty array');
      return [];
    }
    
    try {
      const parsedItems = JSON.parse(wishlistItems);
      console.log('Successfully parsed wishlist items:', parsedItems);
      
      if (!Array.isArray(parsedItems)) {
        console.error('Parsed wishlist items is not an array, returning empty array instead');
        return [];
      }
      
      return parsedItems;
    } catch (parseError) {
      console.error('Error parsing wishlist items JSON:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error loading local wishlist:', error);
    return [];
  }
}

function addToLocalWishlist(productId, price, name, image, description = '') {
  try {
    const wishlistItems = getLocalWishlist();
    
    // Check if the item already exists
    const existingItem = wishlistItems.find(item => 
      (item.id && item.id.toString() === productId.toString()) || 
      (item.productId && item.productId.toString() === productId.toString())
    );
    
    if (existingItem) {
      console.log('Item already in wishlist:', existingItem);
      return false;
    }
    
    // Add new item
    const newItem = {
      id: productId.toString(),
      productId: productId.toString(),
      price: price,
      name: name,
      image: image,
      description: description
    };
    
    wishlistItems.push(newItem);
    localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
    console.log('Added item to local wishlist:', newItem);
    return true;
  } catch (error) {
    console.error('Error adding to local wishlist:', error);
    return false;
  }
}

function removeFromLocalWishlist(productId) {
  try {
    let wishlistItems = getLocalWishlist();
    const initialLength = wishlistItems.length;
    
    wishlistItems = wishlistItems.filter(item => 
      !(item.id && item.id.toString() === productId.toString()) && 
      !(item.productId && item.productId.toString() === productId.toString())
    );
    
    localStorage.setItem('wishlistItems', JSON.stringify(wishlistItems));
    console.log('Removed item from local wishlist, items remaining:', wishlistItems.length);
    return initialLength > wishlistItems.length;
  } catch (error) {
    console.error('Error removing from local wishlist:', error);
    return false;
  }
}

function clearLocalWishlist() {
  localStorage.removeItem('wishlistItems');
  console.log('Cleared local wishlist');
  return true;
}

// Check for wishlist sync on page load
function checkForWishlistSync() {
  console.log('Checking wishlist sync...');
  const token = localStorage.getItem('token');
  console.log('Authentication token found:', token !== null);
  
  if (token !== null) {
    console.log('User has token, checking local wishlist...');
    const localWishlist = getLocalWishlist();
    console.log('Local wishlist items count:', localWishlist.length);
    
    if (localWishlist.length > 0) {
      console.log('Found local wishlist items, attempting to sync with server');
      return syncWishlistWithServer().then(result => {
        if (!result.success && result.keptLocal) {
          console.log('Could not sync with server, keeping local items');
          return { success: false, reason: 'API not available', keptLocal: true };
        }
        return result;
      }).catch(error => {
        console.error('Error during wishlist sync check:', error);
        return { success: false, error: error.message, keptLocal: true };
      });
    } else {
      console.log('No local wishlist items to sync');
    }
  } else {
    console.log('User not authenticated, skipping wishlist sync');
  }
  
  return Promise.resolve({ success: false, reason: 'No sync needed' });
}

// Function to prepare cart for checkout
// This ensures we have cart items in local storage before proceeding to checkout
function prepareCartForCheckout() {
  try {
    // First try to get cart from API if authenticated
    if (isAuthenticated()) {
      // Get cart from API and save to local storage
      return getCart().then(cart => {
        console.log('Got cart from API for checkout preparation:', cart);
        
        if (cart && cart.items && cart.items.length > 0) {
          // Save cart items to local storage
          localStorage.setItem('cartItems', JSON.stringify(cart.items));
          
          // Save total amount
          localStorage.setItem('totalAmount', cart.total || calculateCartTotal(cart.items));
          
          return {
            success: true,
            itemCount: cart.items.length,
            total: cart.total || calculateCartTotal(cart.items)
          };
        } else {
          // Try to use local cart as fallback
          const localCart = getLocalCart();
          
          if (localCart.length > 0) {
            localStorage.setItem('cartItems', JSON.stringify(localCart));
            localStorage.setItem('totalAmount', calculateCartTotal(localCart));
            
            return {
              success: true,
              itemCount: localCart.length,
              total: calculateCartTotal(localCart),
              source: 'local'
            };
          } else {
            throw new Error('No items in cart');
          }
        }
      }).catch(error => {
        console.error('Error preparing cart from API:', error);
        
        // Fallback to local cart
        const localCart = getLocalCart();
        
        if (localCart.length > 0) {
          return {
            success: true,
            itemCount: localCart.length,
            total: calculateCartTotal(localCart),
            source: 'local'
          };
        } else {
          throw new Error('No items in cart');
        }
      });
    } else {
      // Use local cart for non-authenticated users
      const localCart = getLocalCart();
      
      if (localCart.length > 0) {
        localStorage.setItem('cartItems', JSON.stringify(localCart));
        localStorage.setItem('totalAmount', calculateCartTotal(localCart));
        
        return Promise.resolve({
          success: true,
          itemCount: localCart.length,
          total: calculateCartTotal(localCart),
          source: 'local'
        });
      } else {
        return Promise.reject(new Error('No items in cart'));
      }
    }
  } catch (error) {
    console.error('Error preparing cart for checkout:', error);
    return Promise.reject(error);
  }
}

// Helper function to calculate cart total
function calculateCartTotal(items) {
  try {
    return items.reduce((total, item) => {
      const price = parseFloat(item.price) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return total + (price * quantity);
    }, 0);
  } catch (error) {
    console.error('Error calculating cart total:', error);
    return 0;
  }
} 
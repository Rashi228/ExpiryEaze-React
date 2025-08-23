// Configuration file for environment variables and API endpoints

export const config = {
  // API Configuration
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api/v1',
  
  // Environment
  ENV: process.env.REACT_APP_ENV || 'development',
  
  // API Endpoints
  endpoints: {
    auth: {
      login: '/auth/login',
      signup: '/auth/signup',
      logout: '/auth/logout',
      verify: '/auth/verify',
    },
    products: {
      all: '/products',
      byId: (id) => `/products/${id}`,
      byCategory: (category) => `/products/category/${category}`,
      byVendor: (vendorId) => `/products/vendor/${vendorId}`,
    },
    vendors: {
      all: '/vendors',
      allWithProducts: '/vendors/all-with-products',
      byId: (id) => `/vendors/${id}`,
      profile: '/vendors/profile',
    },
    cart: {
      items: '/cart',
      add: '/cart/add',
      update: '/cart/update',
      remove: '/cart/remove',
      clear: '/cart/clear',
    },
    orders: {
      all: '/orders',
      create: '/orders',
      byId: (id) => `/orders/${id}`,
      byUser: '/orders/user',
      byVendor: '/orders/vendor',
    },
    reviews: {
      byProduct: (productId) => `/reviews/product/${productId}`,
      create: '/reviews',
      update: (id) => `/reviews/${id}`,
      delete: (id) => `/reviews/${id}`,
    },
    waitlist: {
      join: '/waitlist/join',
    },
  },
  
  // Helper function to build full API URLs
  buildUrl: (endpoint) => `${config.API_URL}${endpoint}`,
};

export default config;

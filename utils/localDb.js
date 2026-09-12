const fs = require('fs');
const path = require('path');

// Helper to safely read JSON files
const readJson = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
};

const writeJson = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing JSON", error);
    return false;
  }
};

const getDbPath = () => path.join(process.cwd(), 'data', 'production_platform_db.json');
const getUsersPath = () => path.join(process.cwd(), 'data', 'users_db.json');

// Initialize user db if not exists
const initUsersDb = () => {
  const p = getUsersPath();
  if (!fs.existsSync(p)) {
    const defaultUsers = {
      "demo-supplier-1": {
        id: "demo-supplier-1",
        plan: "FREE TIER", // FREE TIER, QUARTERLY PLAN, ANNUAL PLAN
        uploaded_products: 10
      }
    };
    writeJson(p, defaultUsers);
  }
};

// Returns pricing configuration
const getPricingConfig = () => {
  return {
    platformCommissionPercent: 2.0,
    advanceLockPercent: 10.0,
  };
};

// Check if a supplier can upload a new product
const canUploadProduct = (supplierId) => {
  initUsersDb();
  const users = readJson(getUsersPath());
  const user = users[supplierId];
  if (!user) return true; // Default to true for unknown for demo
  
  if (user.plan === "FREE TIER" && user.uploaded_products >= 10) {
    return false;
  }
  return true;
};

const getUserPlan = (supplierId) => {
  initUsersDb();
  const users = readJson(getUsersPath());
  const user = users[supplierId];
  return user ? user.plan : "FREE TIER";
};

const getProducts = () => {
  const db = readJson(getDbPath());
  return db ? db.products : [];
};

module.exports = {
  getPricingConfig,
  canUploadProduct,
  getUserPlan,
  getProducts
};

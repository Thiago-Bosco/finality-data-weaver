
import { Product, Category, Supplier, InventorySummary } from "../types/inventory";

export const categories: Category[] = [
  { id: "cat1", name: "Eletrônicos" },
  { id: "cat2", name: "Móveis" },
  { id: "cat3", name: "Escritório" },
  { id: "cat4", name: "Ferramentas" },
  { id: "cat5", name: "Roupas" }
];

export const suppliers: Supplier[] = [
  { 
    id: "sup1", 
    name: "TechSupply Ltda", 
    contact: "Carlos Silva", 
    email: "carlos@techsupply.com", 
    phone: "(11) 98765-4321" 
  },
  { 
    id: "sup2", 
    name: "Móveis Brasil S.A.", 
    contact: "Ana Oliveira", 
    email: "ana@moveisbrasil.com", 
    phone: "(21) 97654-3210" 
  },
  { 
    id: "sup3", 
    name: "Office Plus Distribuidora", 
    contact: "Pedro Santos", 
    email: "pedro@officeplus.com", 
    phone: "(31) 96543-2109" 
  },
  { 
    id: "sup4", 
    name: "Tools & Co", 
    contact: "Mariana Costa", 
    email: "mariana@toolsco.com", 
    phone: "(41) 95432-1098" 
  },
  { 
    id: "sup5", 
    name: "Fashion Wear Ltda", 
    contact: "Rafaela Almeida", 
    email: "rafaela@fashionwear.com", 
    phone: "(51) 94321-0987" 
  }
];

export const products: Product[] = [
  {
    id: "prod1",
    name: "Notebook Dell Inspiron",
    sku: "NB-DELL-001",
    category: "cat1",
    price: 3999.99,
    cost: 2800.00,
    stock: 15,
    description: "Notebook Dell Inspiron 15 polegadas, 8GB RAM, SSD 256GB",
    supplier: "sup1",
    lastUpdated: "2023-04-15T10:30:00Z",
    imageUrl: "https://source.unsplash.com/featured/?laptop"
  },
  {
    id: "prod2",
    name: "Mesa de Escritório",
    sku: "ME-ESC-002",
    category: "cat2",
    price: 599.90,
    cost: 350.00,
    stock: 8,
    description: "Mesa de escritório em MDF, 120x60cm",
    supplier: "sup2",
    lastUpdated: "2023-04-12T14:45:00Z",
    imageUrl: "https://source.unsplash.com/featured/?desk"
  },
  {
    id: "prod3",
    name: "Caderno Espiral",
    sku: "PAP-CAD-003",
    category: "cat3",
    price: 25.90,
    cost: 12.50,
    stock: 120,
    description: "Caderno espiral 100 folhas, capa dura",
    supplier: "sup3",
    lastUpdated: "2023-04-10T09:20:00Z",
    imageUrl: "https://source.unsplash.com/featured/?notebook"
  },
  {
    id: "prod4",
    name: "Kit de Ferramentas",
    sku: "FER-KIT-004",
    category: "cat4",
    price: 189.90,
    cost: 100.00,
    stock: 25,
    description: "Kit de ferramentas com 42 peças",
    supplier: "sup4",
    lastUpdated: "2023-04-08T16:15:00Z",
    imageUrl: "https://source.unsplash.com/featured/?tools"
  },
  {
    id: "prod5",
    name: "Camisa Social",
    sku: "ROU-CAM-005",
    category: "cat5",
    price: 99.90,
    cost: 45.00,
    stock: 50,
    description: "Camisa social manga longa, 100% algodão",
    supplier: "sup5",
    lastUpdated: "2023-04-05T11:30:00Z",
    imageUrl: "https://source.unsplash.com/featured/?shirt"
  },
  {
    id: "prod6",
    name: "Monitor LED 24 polegadas",
    sku: "MON-LED-006",
    category: "cat1",
    price: 899.90,
    cost: 600.00,
    stock: 12,
    description: "Monitor LED 24 polegadas, Full HD",
    supplier: "sup1",
    lastUpdated: "2023-04-03T15:45:00Z",
    imageUrl: "https://source.unsplash.com/featured/?monitor"
  },
  {
    id: "prod7",
    name: "Cadeira Ergonômica",
    sku: "CAD-ERG-007",
    category: "cat2",
    price: 799.90,
    cost: 450.00,
    stock: 6,
    description: "Cadeira ergonômica para escritório",
    supplier: "sup2",
    lastUpdated: "2023-04-01T13:20:00Z",
    imageUrl: "https://source.unsplash.com/featured/?chair"
  },
  {
    id: "prod8",
    name: "Conjunto de Canetas",
    sku: "PAP-CAN-008",
    category: "cat3",
    price: 39.90,
    cost: 18.00,
    stock: 200,
    description: "Conjunto com 12 canetas coloridas",
    supplier: "sup3",
    lastUpdated: "2023-03-28T10:15:00Z",
    imageUrl: "https://source.unsplash.com/featured/?pens"
  },
  {
    id: "prod9",
    name: "Furadeira Elétrica",
    sku: "FER-FUR-009",
    category: "cat4",
    price: 299.90,
    cost: 180.00,
    stock: 3,
    description: "Furadeira elétrica 600W",
    supplier: "sup4",
    lastUpdated: "2023-03-25T14:30:00Z",
    imageUrl: "https://source.unsplash.com/featured/?drill"
  },
  {
    id: "prod10",
    name: "Calça Jeans",
    sku: "ROU-CAL-010",
    category: "cat5",
    price: 129.90,
    cost: 65.00,
    stock: 0,
    description: "Calça jeans masculina tradicional",
    supplier: "sup5",
    lastUpdated: "2023-03-22T09:45:00Z",
    imageUrl: "https://source.unsplash.com/featured/?jeans"
  }
];

export const inventorySummary: InventorySummary = {
  totalProducts: products.length,
  totalCategories: categories.length,
  totalValue: products.reduce((sum, product) => sum + (product.price * product.stock), 0),
  lowStockItems: products.filter(product => product.stock > 0 && product.stock <= 5).length,
  outOfStockItems: products.filter(product => product.stock === 0).length
};

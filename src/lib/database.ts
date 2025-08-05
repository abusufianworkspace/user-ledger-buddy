export interface User {
  id: string;
  name: string;
  phone: string;
  address: string;
  idNumber: string;
  createdAt: Date;
}

export interface Balance {
  id: string;
  userId: string;
  amount: number;
  month: string; // Format: YYYY-MM
  description?: string;
  createdAt: Date;
}

export interface ExportData {
  users: User[];
  balances: Balance[];
  exportDate: Date;
}

class DatabaseService {
  private dbName = 'UserBalanceDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('name', 'name', { unique: false });
          userStore.createIndex('idNumber', 'idNumber', { unique: true });
        }

        // Create balances store
        if (!db.objectStoreNames.contains('balances')) {
          const balanceStore = db.createObjectStore('balances', { keyPath: 'id' });
          balanceStore.createIndex('userId', 'userId', { unique: false });
          balanceStore.createIndex('month', 'month', { unique: false });
          balanceStore.createIndex('userMonth', ['userId', 'month'], { unique: true });
        }
      };
    });
  }

  // User operations
  async addUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const db = await this.initDB();
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.add(newUser);

      request.onsuccess = () => resolve(newUser);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllUsers(): Promise<User[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUserById(id: string): Promise<User | null> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Balance operations
  async addBalance(balance: Omit<Balance, 'id' | 'createdAt'>): Promise<Balance> {
    const db = await this.initDB();
    const newBalance: Balance = {
      ...balance,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['balances'], 'readwrite');
      const store = transaction.objectStore('balances');
      const request = store.add(newBalance);

      request.onsuccess = () => resolve(newBalance);
      request.onerror = () => reject(request.error);
    });
  }

  async getBalancesByUserId(userId: string): Promise<Balance[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['balances'], 'readonly');
      const store = transaction.objectStore('balances');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllBalances(): Promise<Balance[]> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['balances'], 'readonly');
      const store = transaction.objectStore('balances');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateBalance(balance: Balance): Promise<Balance> {
    const db = await this.initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['balances'], 'readwrite');
      const store = transaction.objectStore('balances');
      const request = store.put(balance);

      request.onsuccess = () => resolve(balance);
      request.onerror = () => reject(request.error);
    });
  }

  // Export/Import operations
  async exportData(): Promise<ExportData> {
    const [users, balances] = await Promise.all([
      this.getAllUsers(),
      this.getAllBalances(),
    ]);

    return {
      users,
      balances,
      exportDate: new Date(),
    };
  }

  async importData(data: ExportData): Promise<void> {
    const db = await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['users', 'balances'], 'readwrite');
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      const userStore = transaction.objectStore('users');
      const balanceStore = transaction.objectStore('balances');

      // Clear existing data
      userStore.clear();
      balanceStore.clear();

      // Import users
      data.users.forEach(user => {
        userStore.add(user);
      });

      // Import balances
      data.balances.forEach(balance => {
        balanceStore.add(balance);
      });
    });
  }
}

export const db = new DatabaseService();
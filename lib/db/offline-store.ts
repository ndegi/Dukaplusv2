// IndexedDB for local data storage and offline support

interface StoredTransaction {
  id: string
  timestamp: number
  data: any
  synced: boolean
  type: string
}

class OfflineStore {
  private dbName = "DukaPlusDB"
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains("products")) {
          db.createObjectStore("products", { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains("transactions")) {
          const txStore = db.createObjectStore("transactions", { keyPath: "id" })
          txStore.createIndex("synced", "synced", { unique: false })
          txStore.createIndex("timestamp", "timestamp", { unique: false })
        }

        if (!db.objectStoreNames.contains("cart")) {
          db.createObjectStore("cart", { keyPath: "id" })
        }

        if (!db.objectStoreNames.contains("sync-queue")) {
          db.createObjectStore("sync-queue", { keyPath: "id", autoIncrement: true })
        }
      }
    })
  }

  // Products
  async saveProducts(products: any[]): Promise<void> {
    if (!this.db) return

    const tx = this.db.transaction(["products"], "readwrite")
    const store = tx.objectStore("products")

    for (const product of products) {
      await new Promise((resolve, reject) => {
        const request = store.put(product)
        request.onsuccess = () => resolve(null)
        request.onerror = () => reject(request.error)
      })
    }
  }

  async getProducts(): Promise<any[]> {
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(["products"], "readonly")
      const store = tx.objectStore("products")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Transactions
  async saveTransaction(transaction: StoredTransaction): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(["transactions"], "readwrite")
      const store = tx.objectStore("transactions")
      const request = store.add(transaction)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getUnsyncedTransactions(): Promise<StoredTransaction[]> {
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(["transactions"], "readonly")
      const store = tx.objectStore("transactions")
      const index = store.index("synced")
      const request = index.getAll()

      request.onsuccess = () => {
        // Filter for unsynced transactions (where synced === false)
        const results = request.result.filter((tx) => tx.synced === false)
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async markTransactionSynced(id: string): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(["transactions"], "readwrite")
      const store = tx.objectStore("transactions")
      const request = store.get(id)

      request.onsuccess = () => {
        const transaction = request.result
        if (transaction) {
          transaction.synced = true
          const updateRequest = store.put(transaction)
          updateRequest.onsuccess = () => resolve()
          updateRequest.onerror = () => reject(updateRequest.error)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Cart
  async saveCart(cart: any[]): Promise<void> {
    if (!this.db) return

    const tx = this.db.transaction(["cart"], "readwrite")
    const store = tx.objectStore("cart")

    // Clear existing
    await new Promise((resolve) => {
      const clearRequest = store.clear()
      clearRequest.onsuccess = () => resolve(null)
    })

    // Add new items
    for (const item of cart) {
      await new Promise((resolve, reject) => {
        const request = store.put(item)
        request.onsuccess = () => resolve(null)
        request.onerror = () => reject(request.error)
      })
    }
  }

  async getCart(): Promise<any[]> {
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(["cart"], "readonly")
      const store = tx.objectStore("cart")
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async clearCart(): Promise<void> {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(["cart"], "readwrite")
      const store = tx.objectStore("cart")
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineStore = new OfflineStore()

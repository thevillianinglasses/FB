# deps/db.py
"""
Database dependency for pharmacy routers
This provides access to the MongoDB database instance
"""

from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/unicare_ehr")

# Global database instance
mongodb_client: AsyncIOMotorClient = None
db = None

async def connect_to_mongo():
    """Connect to MongoDB"""
    global mongodb_client, db
    mongodb_client = AsyncIOMotorClient(MONGO_URL)
    db = mongodb_client.get_database()
    
    # Test the connection
    await db.command('ping')
    print("Connected to MongoDB successfully")

async def close_mongo_connection():
    """Close MongoDB connection"""
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()

# For direct import in routers
class DatabaseManager:
    def __init__(self):
        self._client = None
        self._db = None
    
    async def connect(self):
        if not self._client:
            self._client = AsyncIOMotorClient(MONGO_URL)
            self._db = self._client.get_database()
            await self._db.command('ping')
    
    @property
    def client(self):
        return self._client
    
    @property
    def database(self):
        return self._db
    
    # Collection shortcuts for pharmacy operations
    @property
    def suppliers(self):
        return self._db.suppliers if self._db else None
    
    @property
    def products(self):
        return self._db.products if self._db else None
    
    @property
    def racks(self):
        return self._db.racks if self._db else None
    
    @property
    def chemical_schedules(self):
        return self._db.chemical_schedules if self._db else None
    
    @property
    def batches(self):
        return self._db.batches if self._db else None
    
    @property
    def purchases(self):
        return self._db.purchases if self._db else None
    
    @property
    def sales(self):
        return self._db.sales if self._db else None
    
    @property
    def sale_items(self):
        return self._db.sale_items if self._db else None
    
    @property
    def payments(self):
        return self._db.payments if self._db else None
    
    @property
    def stock_ledger(self):
        return self._db.stock_ledger if self._db else None
    
    @property
    def returns(self):
        return self._db.returns if self._db else None
    
    @property
    def disposals(self):
        return self._db.disposals if self._db else None
    
    @property
    def audits(self):
        return self._db.audits if self._db else None

# Create a global instance and connect
db_manager = DatabaseManager()

# Initialize connection on import
import asyncio
try:
    # Try to connect if we're in an async context
    loop = asyncio.get_event_loop()
    if loop.is_running():
        # We're already in an async context, schedule the connection
        asyncio.create_task(db_manager.connect())
    else:
        # We're not in an async context, run the connection
        asyncio.run(db_manager.connect())
except:
    # If we can't connect immediately, that's okay - the routers will handle it
    pass

# For backward compatibility with existing routers
db = db_manager
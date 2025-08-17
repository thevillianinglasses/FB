# deps/db.py
"""
Database dependency for pharmacy routers
This provides access to the MongoDB database instance from the main server
"""

# Import the database from the main server module
import sys
import os

# Add the backend directory to the path so we can import from server
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Database instance will be set by the main server
_database = None

def set_database(database_instance):
    """Set the database instance from the main server"""
    global _database
    _database = database_instance

def get_database():
    """Get the database instance"""
    global _database
    if _database is None:
        # Try to import from server module
        try:
            import server
            _database = server.database
        except:
            pass
    return _database

# Database manager class for pharmacy operations
class DatabaseManager:
    @property
    def database(self):
        return get_database()
    
    def is_connected(self):
        """Check if database is connected"""
        return get_database() is not None
    
    # Collection shortcuts for pharmacy operations
    @property
    def suppliers(self):
        db = get_database()
        return db.suppliers if db is not None else None
    
    @property
    def products(self):
        db = get_database()
        return db.products if db is not None else None
    
    @property
    def racks(self):
        db = get_database()
        return db.racks if db is not None else None
    
    @property
    def chemical_schedules(self):
        db = get_database()
        return db.chemical_schedules if db is not None else None
    
    @property
    def batches(self):
        db = get_database()
        return db.batches if db is not None else None
    
    @property
    def purchases(self):
        db = get_database()
        return db.purchases if db is not None else None
    
    @property
    def sales(self):
        db = get_database()
        return db.sales if db is not None else None
    
    @property
    def sale_items(self):
        db = get_database()
        return db.sale_items if db is not None else None
    
    @property
    def payments(self):
        db = get_database()
        return db.payments if db is not None else None
    
    @property
    def stock_ledger(self):
        db = get_database()
        return db.stock_ledger if db is not None else None
    
    @property
    def returns(self):
        db = get_database()
        return db.returns if db is not None else None
    
    @property
    def disposals(self):
        db = get_database()
        return db.disposals if db is not None else None
    
    @property
    def audits(self):
        db = get_database()
        return db.audits if db is not None else None

# Create a global instance
db_manager = DatabaseManager()

# For backward compatibility with existing routers
db = db_manager
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from .models.__init__ import Base
import logging
from dotenv import load_dotenv
import os

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DB")

# Module-level engine + sessionmaker singletons (created once per process)
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=True,
    pool_pre_ping=True,
    pool_recycle=1800,  # recycle after 30 mins
    # disable psycopg3 automatic server-side prepare (important for PgBouncer / pooled infra)
    connect_args={"prepare_threshold": 0},
    execution_options={"use_native_prepared_statements": False}, 
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

# Async dependency for FastAPI
async def get_db():
    async with AsyncSessionLocal() as db:
        yield db

# Create extensions (idempotent)
async def create_extensions():
    async with engine.connect() as conn:
        try:
            # Using IF NOT EXISTS so this is safe to run multiple times
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
            await conn.commit()
            print("Extensions created successfully")
        except Exception as e:
            print(f"Warning: Could not create extensions: {e}")
            print("Continuing without vector extension - embeddings will be stored as JSON")
            await conn.rollback()

# Create embedding indexes (idempotent; uses IF NOT EXISTS SQL)
async def create_embedding_index():
    try:
        async with engine.begin() as conn:
            # Check if vector extension is available
            result = await conn.execute(text("SELECT 1 FROM pg_extension WHERE extname = 'vector'"))
            vector_available = result.fetchone() is not None
            
            if vector_available:
                # HNSW index for embedding column (single-column). Use IF NOT EXISTS to avoid race errors.
                # NOTE: hnsw index syntax is Postgres-vector specific; ensure your server supports it.
                await conn.execute(
                    text(
                        """
                        CREATE INDEX IF NOT EXISTS indexing_vectors
                        ON embedding
                        USING hnsw (embedding vector_cosine_ops)
                        WITH (m = 16, ef_construction = 64);
                        """
                    )
                )
                print("Created HNSW vector index")
            else:
                # Create a GIN index for JSON embeddings
                await conn.execute(
                    text(
                        """
                        CREATE INDEX IF NOT EXISTS indexing_vectors_json
                        ON embedding
                        USING gin (embedding);
                        """
                    )
                )
                print("Created GIN index for JSON embeddings")

            # B-tree index for attraction_id (useful for filtering)
            await conn.execute(
                text(
                    """
                    CREATE INDEX IF NOT EXISTS embedding_attraction_id_idx
                    ON embedding (attraction_id);
                    """
                )
            )
    except Exception as e:
        # Log but don't raise — index creation can be retried next startup.
        logging.exception("Error creating embedding indexes: %s", e)

# Create all tables and indexes (idempotent)
async def create_all_tables():
    async with engine.begin() as conn:
        # create_all via run_sync to use SQLAlchemy metadata (works with async engine)
        await conn.run_sync(Base.metadata.create_all)

    # attempt to create indexes (safe to call repeatedly)
    await create_embedding_index()

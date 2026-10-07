"""Database configuration shared by the API and seed initializer."""
import os
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

APP_ENV = os.getenv("APP_ENV", "production").strip().lower()
database_path = os.getenv("DATABASE_PATH", "").strip()
if APP_ENV == "production" and not database_path:
    raise RuntimeError("DATABASE_PATH must point to persistent storage in production")

DB_PATH = Path(database_path or str(Path(__file__).with_name("stayfinder.db"))).expanduser()
if not DB_PATH.is_absolute():
    DB_PATH = Path(__file__).parent / DB_PATH
DB_PATH = DB_PATH.resolve()

volume_mount = os.getenv("RAILWAY_VOLUME_MOUNT_PATH", "").strip()
if APP_ENV == "production" and volume_mount:
    try:
        DB_PATH.relative_to(Path(volume_mount).resolve())
    except ValueError as error:
        raise RuntimeError("DATABASE_PATH must be inside RAILWAY_VOLUME_MOUNT_PATH") from error

DB_PATH.parent.mkdir(parents=True, exist_ok=True)
engine = create_engine(
    URL.create("sqlite+pysqlite", database=str(DB_PATH)),
    connect_args={"check_same_thread": False, "timeout": 30},
)


@event.listens_for(engine, "connect")
def enable_foreign_keys(connection, _record):
    cursor = connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA busy_timeout=30000")
    cursor.close()


def session_factory(target_engine=engine):
    return sessionmaker(bind=target_engine, expire_on_commit=False)


def create_schema(target_engine=engine):
    from models import Base
    Base.metadata.create_all(target_engine)

"""Root conftest that makes ``pytest`` safe by default.

The test suite deletes rows on the real app engine, so without isolation a host
run would wipe the dev database. This conftest:

1. Guard - refuses to run unless ``POSTGRES_DB`` looks like a test database
   (ends in ``_test``). This is the safety net that protects the dev DB even if
   the pytest-env plugin is missing.
2. Bootstrap - (re)creates a pristine, throwaway ``app_test`` database on the
   same Postgres and builds the schema via Alembic (exactly like production,
   including migration ``ALTER``s that ``create_all`` would miss).

The env vars (``POSTGRES_DB=app_test``) are set by pytest-env - see
``[tool.pytest.ini_options].env`` in ``pyproject.toml``. Important: do NOT
import the app at module level here, or the ``settings`` singleton would freeze
before pytest-env sets the env. All app imports happen lazily in
``pytest_configure``, which runs after pytest-env's hook.
"""

from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING

import psycopg
import pytest
from psycopg import sql

if TYPE_CHECKING:
    from app.core.config import Settings

_HERE = Path(__file__).parent


def _recreate_test_db(settings: Settings) -> None:
    """Drop (if present) and recreate the test DB pristine via the maintenance DB."""
    admin_dsn = (
        f"host={settings.POSTGRES_SERVER} port={settings.POSTGRES_PORT} "
        f"user={settings.POSTGRES_USER} password={settings.POSTGRES_PASSWORD} "
        "dbname=postgres"
    )
    db = sql.Identifier(settings.POSTGRES_DB)
    with psycopg.connect(admin_dsn, autocommit=True) as conn:
        conn.execute(sql.SQL("DROP DATABASE IF EXISTS {} WITH (FORCE)").format(db))
        conn.execute(sql.SQL("CREATE DATABASE {}").format(db))


def _migrate() -> None:
    """Build the schema via ``alembic upgrade head``.

    env.py reads the database URL from ``settings`` (now app_test), so this
    migrates the test DB. script_location is set explicitly so it works
    independently of the current working directory.
    """
    from alembic import command
    from alembic.config import Config

    cfg = Config(str(_HERE / "alembic.ini"))
    cfg.set_main_option("script_location", str(_HERE / "app" / "alembic"))
    command.upgrade(cfg, "head")


def pytest_configure() -> None:
    # Lazy import: pytest-env has set the env by now (it runs in
    # pytest_load_initial_conftests, before this hook), so settings reads app_test.
    from app.core.config import settings

    if not settings.POSTGRES_DB.endswith("_test"):
        pytest.exit(
            f"Refusing to run tests against POSTGRES_DB={settings.POSTGRES_DB!r}: "
            "this does not look like a test database (expected a name ending in "
            "'_test'), and running could wipe the dev DB. Run `uv sync` so the "
            "pytest-env plugin is active, or set POSTGRES_DB to a *_test database.",
            returncode=1,
        )

    _recreate_test_db(settings)
    _migrate()

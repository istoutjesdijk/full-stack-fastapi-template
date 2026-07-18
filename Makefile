# Dev entrypoint. The unique dev ports live in the root .env (single source of
# truth). The frontend reads FRONTEND_PORT via vite.config.ts; the backend gets
# BACKEND_PORT passed here. We only grep the port out of .env (no `include .env`)
# so make never parses the secrets.
.PHONY: dev dev-backend dev-frontend test

dev-backend:
	cd backend && uv run fastapi dev app/main.py --port $$(grep -E '^BACKEND_PORT=' ../.env | cut -d= -f2)

dev-frontend:
	cd frontend && bun run dev

dev:
	$(MAKE) -j2 dev-backend dev-frontend

# Safe by default: the test env (test DB app_test + dummy mode) comes from
# pytest-env, and the guard in backend/conftest.py refuses to run against the
# dev DB. Never touches `app`.
test:
	cd backend && uv run pytest

import json
from pathlib import Path

# Update .env (and frontend/.env) from the Copier answers, without using Jinja2
# templates in the env files, so the files still work as-is without Copier. If
# Copier is used, the env files are updated with the answers.
root_path = Path(__file__).parent.parent
answers_path = Path(__file__).parent / ".copier-answers.yml"
answers = json.loads(answers_path.read_text())


def set_env_values(path: Path, values: dict[str, str]) -> None:
    """Replace `KEY=...` lines in an env file for the given keys, in place."""
    if not path.exists():
        return
    lines = []
    for line in path.read_text().splitlines():
        for key, value in values.items():
            if line.startswith(f"{key}="):
                lines.append(f"{key}={value!r}" if " " in value else f"{key}={value}")
                break
        else:
            lines.append(line)
    path.write_text("\n".join(lines) + "\n")


# The root .env is git-ignored, so Copier does not copy it into a generated
# project; create it from the tracked .env.example before patching.
env_path = root_path / ".env"
example_path = root_path / ".env.example"
if not env_path.exists() and example_path.exists():
    env_path.write_text(example_path.read_text())

# 1) Scalar answers (project_name, secret_key, ...) -> root .env
scalar_values = {key.upper(): str(value) for key, value in answers.items()}

# 2) Dev ports: base + offset, so several generated stacks can run side by side.
offset = int(answers.get("dev_port_offset", 0) or 0)
base_ports = {
    "FRONTEND_PORT": 5173,
    "BACKEND_PORT": 8000,
    "ADMINER_PORT": 8080,
    "TRAEFIK_UI_PORT": 8090,
    "PROXY_HTTP_PORT": 80,
    "MAILCATCHER_UI_PORT": 1080,
    "MAILCATCHER_SMTP_PORT": 1025,
    "PLAYWRIGHT_PORT": 9323,
    "POSTGRES_PORT": 5432,
}
ports = {key: str(base + offset) for key, base in base_ports.items()}

set_env_values(root_path / ".env", {**scalar_values, **ports})

# 3) Frontend dev env follows the backend/mailcatcher host ports.
set_env_values(
    root_path / "frontend" / ".env",
    {
        "VITE_API_URL": f"http://localhost:{ports['BACKEND_PORT']}",
        "MAILCATCHER_HOST": f"http://localhost:{ports['MAILCATCHER_UI_PORT']}",
    },
)

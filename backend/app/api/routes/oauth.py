"""Central login (SSO) via an OIDC provider such as Authentik.

Backend-driven OIDC Authorization Code flow with PKCE. After the callback the
user is matched on email (or auto-provisioned) and receives the existing app
JWT back through a redirect to the frontend (URL fragment, so the token stays
out of server logs and referrers). The rest of the app (deps.py,
get_current_user) is untouched; password login keeps working.
"""

import base64
import hashlib
import secrets
from datetime import timedelta
from functools import lru_cache
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from app import crud
from app.api.deps import SessionDep
from app.core import security
from app.core.config import settings
from app.models import UserCreate

router = APIRouter(prefix="/oauth", tags=["oauth"])

_STATE_COOKIE = "oidc_state"
_VERIFIER_COOKIE = "oidc_verifier"
# Only send the cookies on our own oauth paths; lax is enough because the
# callback is a top-level GET redirect coming back from the provider.
_COOKIE_KWARGS: dict[str, Any] = {
    "httponly": True,
    "samesite": "lax",
    "path": f"{settings.API_V1_STR}/oauth",
}


def _require_oidc() -> None:
    if not settings.oidc_enabled:
        raise HTTPException(status_code=404, detail="OIDC is not configured")


@lru_cache(maxsize=1)
def _discovery() -> dict[str, Any]:
    url = f"{settings.OIDC_ISSUER.rstrip('/')}/.well-known/openid-configuration"
    resp = httpx.get(url, timeout=10)
    resp.raise_for_status()
    config: dict[str, Any] = resp.json()
    return config


def _redirect_uri(request: Request) -> str:
    if settings.OIDC_REDIRECT_URI:
        return settings.OIDC_REDIRECT_URI
    return str(request.url_for("oauth_callback"))


@router.get("/login")
def oauth_login(request: Request) -> RedirectResponse:
    """Start the OIDC flow: redirect to the provider's authorize endpoint."""
    _require_oidc()
    try:
        conf = _discovery()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail="OIDC provider unreachable") from e
    state = secrets.token_urlsafe(32)
    verifier = secrets.token_urlsafe(48)
    challenge = (
        base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest())
        .rstrip(b"=")
        .decode()
    )
    params = {
        "client_id": settings.OIDC_CLIENT_ID,
        "response_type": "code",
        "scope": "openid profile email",
        "redirect_uri": _redirect_uri(request),
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    }
    response = RedirectResponse(f"{conf['authorization_endpoint']}?{urlencode(params)}")
    secure = settings.ENVIRONMENT != "local"
    response.set_cookie(
        _STATE_COOKIE, state, max_age=600, secure=secure, **_COOKIE_KWARGS
    )
    response.set_cookie(
        _VERIFIER_COOKIE, verifier, max_age=600, secure=secure, **_COOKIE_KWARGS
    )
    return response


@router.get("/callback", name="oauth_callback")
def oauth_callback(
    request: Request,
    session: SessionDep,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
) -> RedirectResponse:
    """Handle the provider callback and hand the app JWT to the frontend."""
    _require_oidc()
    if error:
        return RedirectResponse(f"{settings.FRONTEND_HOST}/login?error=sso")
    cookie_state = request.cookies.get(_STATE_COOKIE)
    verifier = request.cookies.get(_VERIFIER_COOKIE)
    if not code or not state or not verifier or state != cookie_state:
        raise HTTPException(status_code=400, detail="Invalid OIDC state")

    conf = _discovery()
    try:
        with httpx.Client(timeout=10) as client:
            token_resp = client.post(
                conf["token_endpoint"],
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": _redirect_uri(request),
                    "client_id": settings.OIDC_CLIENT_ID,
                    "client_secret": settings.OIDC_CLIENT_SECRET,
                    "code_verifier": verifier,
                },
            )
            token_resp.raise_for_status()
            userinfo_resp = client.get(
                conf["userinfo_endpoint"],
                headers={
                    "Authorization": f"Bearer {token_resp.json()['access_token']}"
                },
            )
            userinfo_resp.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail="OIDC token exchange failed") from e

    info = userinfo_resp.json()
    email = info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="OIDC userinfo has no email")
    # Group membership at the provider drives superuser rights.
    is_admin = settings.OIDC_ADMIN_GROUP in (info.get("groups") or [])

    user = crud.get_user_by_email(session=session, email=email)
    if user is None:
        # Auto-provisioning: password login stays reachable via password recovery.
        user = crud.create_user(
            session=session,
            user_create=UserCreate(
                email=email,
                password=secrets.token_urlsafe(32),
                full_name=info.get("name"),
                is_superuser=is_admin,
            ),
        )
    else:
        if not user.is_active:
            raise HTTPException(status_code=400, detail="Inactive user")
        if user.is_superuser != is_admin:
            user.is_superuser = is_admin
            session.add(user)
            session.commit()
            session.refresh(user)

    access_token = security.create_access_token(
        user.id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    response = RedirectResponse(
        f"{settings.FRONTEND_HOST}/oauth-callback#access_token={access_token}"
    )
    response.delete_cookie(_STATE_COOKIE, path=_COOKIE_KWARGS["path"])
    response.delete_cookie(_VERIFIER_COOKIE, path=_COOKIE_KWARGS["path"])
    return response

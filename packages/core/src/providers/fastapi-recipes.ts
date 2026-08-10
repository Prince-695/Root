import type { RootJson } from "../config/root-json.js";
import { hasAuth } from "../engine/module-graph.js";
import type { Operation } from "../engine/operations.js";
import { resolveResourceNames } from "../registry/codegen/resource-files.js";
import type { PlanAuthContext, PlanResourceContext } from "./types.js";

const ROUTES_ANCHOR = "[ROOT-INJECT:ROUTES]";

export function fastapiModuleFiles(
  _config: RootJson,
  name: string,
  type: RootJson["modules"][string]["type"],
): string[] | null {
  if (type === "auth") {
    return ["app/routers/auth.py", "app/schemas/auth.py", "app/services/auth.py", "app/deps.py"];
  }
  if (type === "resource") {
    const mod = name.replace(/-/g, "_");
    return [`app/routers/${mod}.py`, `app/schemas/${mod}.py`, `app/services/${mod}.py`];
  }
  return [];
}

export function planFastapiAuth(ctx: PlanAuthContext): Operation[] {
  const { graph, addedAt } = ctx;
  if (graph.config.modules.auth) {
    return [];
  }

  const serverRel = graph.config.aliases.server;
  const anchor = graph.config.inject.routesAnchor;
  const mountNeedle = 'prefix="/auth"';

  const ops: Operation[] = [
    {
      type: "createFile",
      path: "app/__init__.py",
      content: "",
    },
    {
      type: "createFile",
      path: "app/routers/__init__.py",
      content: "",
    },
    {
      type: "createFile",
      path: "app/schemas/__init__.py",
      content: "",
    },
    {
      type: "createFile",
      path: "app/services/__init__.py",
      content: "",
    },
    {
      type: "createFile",
      path: "app/schemas/auth.py",
      content: `from pydantic import BaseModel, EmailStr


class SignupBody(BaseModel):
    email: EmailStr
    password: str


class SigninBody(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    id: str
    email: EmailStr
`,
    },
    {
      type: "createFile",
      path: "app/services/auth.py",
      content: `from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

SECRET = os.getenv("ACCESS_TOKEN_SECRET", "dev-secret-change-me")
ALGORITHM = "HS256"
EXPIRE_MINUTES = 60 * 24

_users: dict[str, dict] = {}


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_MINUTES),
    }
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET, algorithms=[ALGORITHM])


def signup(email: str, password: str) -> dict:
    for user in _users.values():
        if user["email"] == email:
            raise ValueError("email already registered")
    user_id = str(uuid.uuid4())
    user = {"id": user_id, "email": email, "password_hash": hash_password(password)}
    _users[user_id] = user
    return user


def signin(email: str, password: str) -> dict:
    for user in _users.values():
        if user["email"] == email and verify_password(password, user["password_hash"]):
            return user
    raise ValueError("invalid credentials")


def get_user(user_id: str) -> dict | None:
    return _users.get(user_id)
`,
    },
    {
      type: "createFile",
      path: "app/deps.py",
      content: `from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services import auth as auth_service

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = auth_service.decode_token(credentials.credentials)
        user = auth_service.get_user(str(payload.get("sub", "")))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from exc
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
`,
    },
    {
      type: "createFile",
      path: "app/routers/auth.py",
      content: `from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_current_user
from app.schemas.auth import SigninBody, SignupBody, TokenResponse, UserPublic
from app.services import auth as auth_service

router = APIRouter()


@router.post("/signup", response_model=TokenResponse)
def signup(body: SignupBody):
    try:
        user = auth_service.signup(body.email, body.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    token = auth_service.create_access_token(user["id"], user["email"])
    return TokenResponse(access_token=token)


@router.post("/signin", response_model=TokenResponse)
def signin(body: SigninBody):
    try:
        user = auth_service.signin(body.email, body.password)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    token = auth_service.create_access_token(user["id"], user["email"])
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserPublic)
def me(user: dict = Depends(get_current_user)):
    return UserPublic(id=user["id"], email=user["email"])
`,
    },
    {
      type: "patchFile",
      path: serverRel,
      kind: "anchor",
      anchor,
      insertion: `from app.routers import auth as auth_router
app.include_router(auth_router.router, prefix="/auth", tags=["auth"])
`,
      skipIfContains: mountNeedle,
    },
    {
      type: "ensureText",
      path: ".env.example",
      skipIfContains: "ACCESS_TOKEN_SECRET",
      transform: "access-token-env",
    },
    {
      type: "ensureText",
      path: "README.md",
      skipIfContains: "## Authentication",
      transform: "auth-readme",
    },
    {
      type: "ensurePythonDependency",
      name: "PyJWT",
      spec: "PyJWT>=2.8.0",
    },
    {
      type: "ensurePythonDependency",
      name: "bcrypt",
      spec: "bcrypt>=4.0.0",
    },
    {
      type: "ensurePythonDependency",
      name: "email-validator",
      spec: "email-validator>=2.0.0",
    },
    {
      type: "updateManifest",
      moduleName: "auth",
      entry: { type: "auth", addedAt },
    },
  ];

  return ops;
}

export function planFastapiResource(ctx: PlanResourceContext): Operation[] {
  const { graph, resourceName, addedAt } = ctx;
  const names = resolveResourceNames(resourceName, ctx.mountPath);
  if (graph.config.modules[names.slug]) {
    return [];
  }

  const authAware = hasAuth(graph);
  const serverRel = graph.config.aliases.server;
  const anchor = graph.config.inject.routesAnchor;
  const mountNeedle = `prefix="${names.mountPath}"`;
  const slug = names.slug;
  const mod = slug.replace(/-/g, "_");
  const pascal = names.pascal;
  const listFn = `list_${mod}`;
  const getFn = `get_${mod}`;
  const createFn = `create_${mod}`;
  const deleteFn = `delete_${mod}`;

  const createFields = authAware
    ? `    title: str
    author_id: str | None = None
`
    : `    title: str
`;

  const serviceStore = `_items: dict[str, dict] = {}


def list_items() -> list[dict]:
    return list(_items.values())


def get_item(item_id: str) -> dict | None:
    return _items.get(item_id)


def create_item(title: str, author_id: str | None = None) -> dict:
    item_id = str(uuid.uuid4())
    item = {"id": item_id, "title": title${authAware ? ', "author_id": author_id' : ""}}
    _items[item_id] = item
    return item


def delete_item(item_id: str) -> bool:
    return _items.pop(item_id, None) is not None
`;

  const routerAuthImport = authAware
    ? `from app.deps import get_current_user
`
    : "";
  const createDep = authAware ? ", user: dict = Depends(get_current_user)" : "";
  const createCall = authAware
    ? `service.create_item(body.title, user["id"])`
    : "service.create_item(body.title)";

  const ops: Operation[] = [
    {
      type: "createFile",
      path: "app/__init__.py",
      content: "",
    },
    {
      type: "createFile",
      path: "app/routers/__init__.py",
      content: "",
    },
    {
      type: "createFile",
      path: "app/schemas/__init__.py",
      content: "",
    },
    {
      type: "createFile",
      path: "app/services/__init__.py",
      content: "",
    },
    {
      type: "createFile",
      path: `app/schemas/${mod}.py`,
      content: `from pydantic import BaseModel


class ${pascal}Create(BaseModel):
${createFields}

class ${pascal}Public(BaseModel):
    id: str
    title: str
${authAware ? "    author_id: str | None = None\n" : ""}`,
    },
    {
      type: "createFile",
      path: `app/services/${mod}.py`,
      content: `from __future__ import annotations

import uuid

${serviceStore}`,
    },
    {
      type: "createFile",
      path: `app/routers/${mod}.py`,
      content: `from fastapi import APIRouter, Depends, HTTPException, status

${routerAuthImport}from app.schemas.${mod} import ${pascal}Create, ${pascal}Public
from app.services import ${mod} as service

router = APIRouter()


@router.get("", response_model=list[${pascal}Public])
def ${listFn}():
    return service.list_items()


@router.get("/{item_id}", response_model=${pascal}Public)
def ${getFn}(item_id: str):
    item = service.get_item(item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return item


@router.post("", response_model=${pascal}Public, status_code=status.HTTP_201_CREATED)
def ${createFn}(body: ${pascal}Create${createDep}):
    return ${createCall}


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def ${deleteFn}(item_id: str):
    if not service.delete_item(item_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
`,
    },
    {
      type: "patchFile",
      path: serverRel,
      kind: "anchor",
      anchor,
      insertion: `from app.routers import ${mod} as ${mod}_router
app.include_router(${mod}_router.router, prefix="${names.mountPath}", tags=["${slug}"])
`,
      skipIfContains: mountNeedle,
    },
    {
      type: "updateManifest",
      moduleName: names.slug,
      entry: { type: "resource", addedAt },
    },
  ];

  return ops;
}

export { ROUTES_ANCHOR as FASTAPI_ROUTES_ANCHOR };

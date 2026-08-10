import type { RootJson } from "../config/root-json.js";
import { hasAuth } from "../engine/module-graph.js";
import type { Operation } from "../engine/operations.js";
import { resolveResourceNames } from "../registry/codegen/resource-files.js";
import type { PlanAuthContext, PlanResourceContext } from "./types.js";

export function flaskModuleFiles(
  _config: RootJson,
  name: string,
  type: RootJson["modules"][string]["type"],
): string[] | null {
  if (type === "auth") {
    return ["routers/auth.py", "services/auth.py", "auth_guard.py"];
  }
  if (type === "resource") {
    const mod = name.replace(/-/g, "_");
    return [`routers/${mod}.py`, `services/${mod}.py`];
  }
  return [];
}

export function planFlaskAuth(ctx: PlanAuthContext): Operation[] {
  const { graph, addedAt } = ctx;
  if (graph.config.modules.auth) {
    return [];
  }

  const serverRel = graph.config.aliases.server;
  const anchor = graph.config.inject.routesAnchor;
  const mountNeedle = "register_blueprint(auth_bp";

  const ops: Operation[] = [
    {
      type: "createFile",
      path: "routers/__init__.py",
      content: "",
    },
    {
      type: "createFile",
      path: "services/__init__.py",
      content: "",
    },
    {
      type: "createFile",
      path: "services/auth.py",
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
      path: "auth_guard.py",
      content: `from __future__ import annotations

from functools import wraps

from flask import jsonify, request

from services import auth as auth_service


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify(error="Not authenticated"), 401
        token = header[7:]
        try:
            payload = auth_service.decode_token(token)
            user = auth_service.get_user(str(payload.get("sub", "")))
        except Exception:
            return jsonify(error="Invalid token"), 401
        if not user:
            return jsonify(error="User not found"), 401
        return fn(*args, user=user, **kwargs)

    return wrapper
`,
    },
    {
      type: "createFile",
      path: "routers/auth.py",
      content: `from flask import Blueprint, jsonify, request

from services import auth as auth_service

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/signup")
def signup():
    body = request.get_json(silent=True) or {}
    email = body.get("email")
    password = body.get("password")
    if not email or not password:
        return jsonify(error="email and password required"), 400
    try:
        user = auth_service.signup(email, password)
    except ValueError as exc:
        return jsonify(error=str(exc)), 400
    token = auth_service.create_access_token(user["id"], user["email"])
    return jsonify(access_token=token, token_type="bearer")


@auth_bp.post("/signin")
def signin():
    body = request.get_json(silent=True) or {}
    email = body.get("email")
    password = body.get("password")
    if not email or not password:
        return jsonify(error="email and password required"), 400
    try:
        user = auth_service.signin(email, password)
    except ValueError as exc:
        return jsonify(error=str(exc)), 401
    token = auth_service.create_access_token(user["id"], user["email"])
    return jsonify(access_token=token, token_type="bearer")
`,
    },
    {
      type: "patchFile",
      path: serverRel,
      kind: "anchor",
      anchor,
      insertion: `from routers.auth import auth_bp
app.register_blueprint(auth_bp, url_prefix="/auth")
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
      type: "updateManifest",
      moduleName: "auth",
      entry: { type: "auth", addedAt },
    },
  ];

  return ops;
}

export function planFlaskResource(ctx: PlanResourceContext): Operation[] {
  const { graph, resourceName, addedAt } = ctx;
  const names = resolveResourceNames(resourceName, ctx.mountPath);
  if (graph.config.modules[names.slug]) {
    return [];
  }

  const authAware = hasAuth(graph);
  const serverRel = graph.config.aliases.server;
  const anchor = graph.config.inject.routesAnchor;
  const slug = names.slug;
  const mod = slug.replace(/-/g, "_");
  const bpName = `${mod}_bp`;
  const mountNeedle = `register_blueprint(${bpName}`;

  const createHandler = authAware
    ? `@${bpName}.post("")
@require_auth
def create_item(user):
    body = request.get_json(silent=True) or {}
    title = body.get("title")
    if not title:
        return jsonify(error="title required"), 400
    item = service.create_item(title, user["id"])
    return jsonify(item), 201
`
    : `@${bpName}.post("")
def create_item():
    body = request.get_json(silent=True) or {}
    title = body.get("title")
    if not title:
        return jsonify(error="title required"), 400
    item = service.create_item(title)
    return jsonify(item), 201
`;

  const authImport = authAware ? "from auth_guard import require_auth\n" : "";

  const ops: Operation[] = [
    {
      type: "createFile",
      path: "routers/__init__.py",
      content: "",
    },
    {
      type: "createFile",
      path: "services/__init__.py",
      content: "",
    },
    {
      type: "createFile",
      path: `services/${mod}.py`,
      content: `from __future__ import annotations

import uuid

_items: dict[str, dict] = {}


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
`,
    },
    {
      type: "createFile",
      path: `routers/${mod}.py`,
      content: `from flask import Blueprint, jsonify, request

${authImport}from services import ${mod} as service

${bpName} = Blueprint("${mod}", __name__)


@${bpName}.get("")
def list_items():
    return jsonify(service.list_items())


@${bpName}.get("/<item_id>")
def get_item(item_id):
    item = service.get_item(item_id)
    if not item:
        return jsonify(error="Not found"), 404
    return jsonify(item)


${createHandler}
@${bpName}.delete("/<item_id>")
def delete_item(item_id):
    if not service.delete_item(item_id):
        return jsonify(error="Not found"), 404
    return ("", 204)
`,
    },
    {
      type: "patchFile",
      path: serverRel,
      kind: "anchor",
      anchor,
      insertion: `from routers.${mod} import ${bpName}
app.register_blueprint(${bpName}, url_prefix="${names.mountPath}")
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

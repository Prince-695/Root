import type { RootJson } from "../config/root-json.js";
import { hasAuth } from "../engine/module-graph.js";
import type { Operation } from "../engine/operations.js";
import { resolveResourceNames } from "../registry/codegen/resource-files.js";
import type { PlanAuthContext, PlanResourceContext } from "./types.js";

export function goModuleFiles(
  _config: RootJson,
  name: string,
  type: RootJson["modules"][string]["type"],
): string[] | null {
  if (type === "auth") {
    return ["internal/auth/auth.go", "internal/auth/handlers.go"];
  }
  if (type === "resource") {
    const pkg = name.replace(/-/g, "");
    return [`internal/${pkg}/${pkg}.go`, `internal/${pkg}/handlers.go`];
  }
  return [];
}

function goPkg(slug: string): string {
  return slug.replace(/-/g, "");
}

export function planGoAuth(ctx: PlanAuthContext): Operation[] {
  const { graph, addedAt } = ctx;
  if (graph.config.modules.auth) {
    return [];
  }

  const serverRel = graph.config.aliases.server;
  const anchor = graph.config.inject.routesAnchor;
  const mountNeedle = "auth.Register(mux)";

  const ops: Operation[] = [
    {
      type: "createFile",
      path: "internal/auth/auth.go",
      content: `package auth

import (
        "errors"
        "os"
        "sync"
        "time"

        "github.com/golang-jwt/jwt/v5"
        "github.com/google/uuid"
        "golang.org/x/crypto/bcrypt"
)

var (
        secret = []byte(getenv("ACCESS_TOKEN_SECRET", "dev-secret-change-me"))
        mu     sync.Mutex
        users  = map[string]User{}
)

type User struct {
        ID           string \`json:"id"\`
        Email        string \`json:"email"\`
        PasswordHash string \`json:"-"\`
}

type Claims struct {
        Email string \`json:"email"\`
        jwt.RegisteredClaims
}

func getenv(k, def string) string {
        if v := os.Getenv(k); v != "" {
                return v
        }
        return def
}

func Signup(email, password string) (User, string, error) {
        mu.Lock()
        defer mu.Unlock()
        for _, u := range users {
                if u.Email == email {
                        return User{}, "", errors.New("email already registered")
                }
        }
        hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
        if err != nil {
                return User{}, "", err
        }
        u := User{ID: uuid.NewString(), Email: email, PasswordHash: string(hash)}
        users[u.ID] = u
        token, err := IssueToken(u)
        return u, token, err
}

func Signin(email, password string) (User, string, error) {
        mu.Lock()
        defer mu.Unlock()
        for _, u := range users {
                if u.Email == email {
                        if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password)); err != nil {
                                return User{}, "", errors.New("invalid credentials")
                        }
                        token, err := IssueToken(u)
                        return u, token, err
                }
        }
        return User{}, "", errors.New("invalid credentials")
}

func IssueToken(u User) (string, error) {
        claims := Claims{
                Email: u.Email,
                RegisteredClaims: jwt.RegisteredClaims{
                        Subject:   u.ID,
                        ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
                },
        }
        t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
        return t.SignedString(secret)
}

func ParseToken(token string) (*Claims, error) {
        parsed, err := jwt.ParseWithClaims(token, &Claims{}, func(t *jwt.Token) (any, error) {
                return secret, nil
        })
        if err != nil {
                return nil, err
        }
        claims, ok := parsed.Claims.(*Claims)
        if !ok || !parsed.Valid {
                return nil, errors.New("invalid token")
        }
        return claims, nil
}

func GetUser(id string) (User, bool) {
        mu.Lock()
        defer mu.Unlock()
        u, ok := users[id]
        return u, ok
}
`,
    },
    {
      type: "createFile",
      path: "internal/auth/handlers.go",
      content: `package auth

import (
        "encoding/json"
        "net/http"
        "strings"
)

type credsBody struct {
        Email    string \`json:"email"\`
        Password string \`json:"password"\`
}

func Register(mux *http.ServeMux) {
        mux.HandleFunc("POST /auth/signup", signupHandler)
        mux.HandleFunc("POST /auth/signin", signinHandler)
}

func signupHandler(w http.ResponseWriter, r *http.Request) {
        var body credsBody
        if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Email == "" || body.Password == "" {
                http.Error(w, \`{"error":"email and password required"}\`, http.StatusBadRequest)
                return
        }
        _, token, err := Signup(body.Email, body.Password)
        if err != nil {
                http.Error(w, \`{"error":"\`+err.Error()+\`"}\`, http.StatusBadRequest)
                return
        }
        w.Header().Set("Content-Type", "application/json")
        _ = json.NewEncoder(w).Encode(map[string]string{"access_token": token, "token_type": "bearer"})
}

func signinHandler(w http.ResponseWriter, r *http.Request) {
        var body credsBody
        if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Email == "" || body.Password == "" {
                http.Error(w, \`{"error":"email and password required"}\`, http.StatusBadRequest)
                return
        }
        _, token, err := Signin(body.Email, body.Password)
        if err != nil {
                http.Error(w, \`{"error":"\`+err.Error()+\`"}\`, http.StatusUnauthorized)
                return
        }
        w.Header().Set("Content-Type", "application/json")
        _ = json.NewEncoder(w).Encode(map[string]string{"access_token": token, "token_type": "bearer"})
}

func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
        return func(w http.ResponseWriter, r *http.Request) {
                h := r.Header.Get("Authorization")
                if !strings.HasPrefix(h, "Bearer ") {
                        http.Error(w, \`{"error":"Not authenticated"}\`, http.StatusUnauthorized)
                        return
                }
                claims, err := ParseToken(strings.TrimPrefix(h, "Bearer "))
                if err != nil {
                        http.Error(w, \`{"error":"Invalid token"}\`, http.StatusUnauthorized)
                        return
                }
                if _, ok := GetUser(claims.Subject); !ok {
                        http.Error(w, \`{"error":"User not found"}\`, http.StatusUnauthorized)
                        return
                }
                r.Header.Set("X-User-Id", claims.Subject)
                next(w, r)
        }
}
`,
    },
    {
      type: "patchFile",
      path: serverRel,
      kind: "anchor",
      anchor,
      insertion: `        auth.Register(mux)
`,
      skipIfContains: mountNeedle,
    },
    // Ensure import for auth package — inserted via second anchor line in main after package imports
    {
      type: "patchFile",
      path: serverRel,
      kind: "anchor",
      anchor: "[ROOT-INJECT:IMPORTS]",
      insertion: `        "example.com/MODULE/internal/auth"`,
      skipIfContains: "/internal/auth",
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
      type: "ensureGoModule",
      path: "github.com/golang-jwt/jwt/v5",
      version: "v5.2.1",
    },
    {
      type: "ensureGoModule",
      path: "github.com/google/uuid",
      version: "v1.6.0",
    },
    {
      type: "ensureGoModule",
      path: "golang.org/x/crypto",
      version: "v0.31.0",
    },
    {
      type: "updateManifest",
      moduleName: "auth",
      entry: { type: "auth", addedAt },
    },
  ];

  // Fix module path placeholder using go.mod module line is done at apply time via patch;
  // replace MODULE after we know module from graph projectName.
  const modulePath = `example.com/${graph.config.projectName}`;
  for (const op of ops) {
    if (op.type === "patchFile" && op.kind === "anchor" && op.insertion.includes("MODULE")) {
      op.insertion = op.insertion.replace("example.com/MODULE", modulePath);
    }
  }

  return ops;
}

export function planGoResource(ctx: PlanResourceContext): Operation[] {
  const { graph, resourceName, addedAt } = ctx;
  const names = resolveResourceNames(resourceName, ctx.mountPath);
  if (graph.config.modules[names.slug]) {
    return [];
  }

  const authAware = hasAuth(graph);
  const serverRel = graph.config.aliases.server;
  const anchor = graph.config.inject.routesAnchor;
  const pkg = goPkg(names.slug);
  const mountPath = names.mountPath;
  const mountNeedle = `"${mountPath}"`;
  const modulePath = `example.com/${graph.config.projectName}`;

  const createHandler = authAware
    ? `func createHandler(w http.ResponseWriter, r *http.Request) {
        auth.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
                var body struct {
                        Title string \`json:"title"\`
                }
                if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Title == "" {
                        http.Error(w, \`{"error":"title required"}\`, http.StatusBadRequest)
                        return
                }
                item := Create(body.Title, r.Header.Get("X-User-Id"))
                w.Header().Set("Content-Type", "application/json")
                w.WriteHeader(http.StatusCreated)
                _ = json.NewEncoder(w).Encode(item)
        })(w, r)
}
`
    : `func createHandler(w http.ResponseWriter, r *http.Request) {
        var body struct {
                Title string \`json:"title"\`
        }
        if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Title == "" {
                http.Error(w, \`{"error":"title required"}\`, http.StatusBadRequest)
                return
        }
        item := Create(body.Title, "")
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusCreated)
        _ = json.NewEncoder(w).Encode(item)
}
`;

  const authImport = authAware ? `\n        "${modulePath}/internal/auth"` : "";

  const ops: Operation[] = [
    {
      type: "createFile",
      path: `internal/${pkg}/${pkg}.go`,
      content: `package ${pkg}

import (
        "sync"

        "github.com/google/uuid"
)

type Item struct {
        ID       string  \`json:"id"\`
        Title    string  \`json:"title"\`
        AuthorID *string \`json:"author_id,omitempty"\`
}

var (
        mu    sync.Mutex
        items = map[string]Item{}
)

func List() []Item {
        mu.Lock()
        defer mu.Unlock()
        out := make([]Item, 0, len(items))
        for _, it := range items {
                out = append(out, it)
        }
        return out
}

func Get(id string) (Item, bool) {
        mu.Lock()
        defer mu.Unlock()
        it, ok := items[id]
        return it, ok
}

func Create(title, authorID string) Item {
        mu.Lock()
        defer mu.Unlock()
        it := Item{ID: uuid.NewString(), Title: title}
        if authorID != "" {
                it.AuthorID = &authorID
        }
        items[it.ID] = it
        return it
}

func Delete(id string) bool {
        mu.Lock()
        defer mu.Unlock()
        if _, ok := items[id]; !ok {
                return false
        }
        delete(items, id)
        return true
}
`,
    },
    {
      type: "createFile",
      path: `internal/${pkg}/handlers.go`,
      content: `package ${pkg}

import (
        "encoding/json"
        "net/http"${authImport}
)

func Register(mux *http.ServeMux) {
        mux.HandleFunc("GET ${mountPath}", listHandler)
        mux.HandleFunc("GET ${mountPath}/{id}", getHandler)
        mux.HandleFunc("POST ${mountPath}", createHandler)
        mux.HandleFunc("DELETE ${mountPath}/{id}", deleteHandler)
}

func listHandler(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        _ = json.NewEncoder(w).Encode(List())
}

func getHandler(w http.ResponseWriter, r *http.Request) {
        id := r.PathValue("id")
        it, ok := Get(id)
        if !ok {
                http.Error(w, \`{"error":"Not found"}\`, http.StatusNotFound)
                return
        }
        w.Header().Set("Content-Type", "application/json")
        _ = json.NewEncoder(w).Encode(it)
}

${createHandler}
func deleteHandler(w http.ResponseWriter, r *http.Request) {
        id := r.PathValue("id")
        if !Delete(id) {
                http.Error(w, \`{"error":"Not found"}\`, http.StatusNotFound)
                return
        }
        w.WriteHeader(http.StatusNoContent)
}
`,
    },
    {
      type: "patchFile",
      path: serverRel,
      kind: "anchor",
      anchor,
      insertion: `        ${pkg}.Register(mux)
`,
      skipIfContains: `${pkg}.Register(mux)`,
    },
    {
      type: "patchFile",
      path: serverRel,
      kind: "anchor",
      anchor: "[ROOT-INJECT:IMPORTS]",
      insertion: `        "${modulePath}/internal/${pkg}"`,
      skipIfContains: `/internal/${pkg}"`,
    },
    {
      type: "ensureGoModule",
      path: "github.com/google/uuid",
      version: "v1.6.0",
    },
    {
      type: "updateManifest",
      moduleName: names.slug,
      entry: { type: "resource", addedAt },
    },
  ];

  return ops;
}

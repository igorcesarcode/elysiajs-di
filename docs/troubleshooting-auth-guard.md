# Troubleshooting: AuthGuard JWT Authentication

## Problema

O `AuthGuard` estava sempre retornando `401 Unauthorized` mesmo quando um token JWT válido era fornecido nas requisições protegidas.

### Sintomas

- ✅ Endpoint de login funcionava corretamente e retornava tokens válidos
- ❌ Endpoints protegidos com `@UseGuards(AuthGuard)` retornavam `401 Unauthorized` mesmo com tokens válidos
- ❌ O plugin JWT estava registrado e disponível no contexto principal
- ❌ Logs mostravam que o plugin JWT estava presente no contexto (`"jwt"` nas chaves do contexto)

### Análise Inicial

Inicialmente, suspeitamos que o problema estava relacionado à disponibilidade do plugin JWT no contexto quando os guards eram executados. A hipótese era que:

1. O plugin JWT estava registrado no app principal, mas não estava disponível nos plugins dos controllers
2. O contexto não estava sendo propagado corretamente do app principal para os controller plugins

## Causa Raiz

Após investigação detalhada com logs de debug, descobrimos que o problema **não era** a disponibilidade do plugin JWT, mas sim a **leitura dos headers HTTP**.

### Problema Real

No ElysiaJS, os headers HTTP podem estar disponíveis em diferentes locais do contexto:

1. `context.headers` - Objeto simples com chaves/valores
2. `context.request.headers` - Headers do objeto Request nativo
3. Headers podem estar em diferentes formatos (lowercase, camelCase, etc.)

O código original do `AuthGuard` estava tentando ler os headers apenas de `context.headers`, que estava vazio. O token estava presente no header `Authorization`, mas não estava sendo encontrado porque:

```typescript
// ❌ Código original (não funcionava)
const headers = elysiaContext.headers || {};
const token = this.jwtService.extractToken(headers);
// headers estava vazio: []
```

## Solução Implementada

### 1. Correção da Leitura de Headers

Modificamos o `AuthGuard` para ler headers de múltiplas fontes e mesclá-los:

```typescript
// ✅ Código corrigido
// Extract token from Authorization header
// In Elysia, headers can be in context.headers or context.request.headers
const headers = elysiaContext.headers || {};
const requestHeaders = elysiaContext.request?.headers || {};

// Merge both sources of headers (Elysia may use either)
const allHeaders: Record<string, string | undefined> = {
  ...headers,
  ...Object.fromEntries(
    Array.from(requestHeaders.entries() || []).map(([k, v]) => [
      k.toLowerCase(),
      v,
    ])
  ),
};

// Also check the raw request headers
if (elysiaContext.request) {
  const rawHeaders = elysiaContext.request.headers;
  if (rawHeaders) {
    const authHeader =
      rawHeaders.get?.("authorization") || rawHeaders.get?.("Authorization");
    if (authHeader) {
      allHeaders.authorization = authHeader;
      allHeaders.Authorization = authHeader;
    }
  }
}

const token = this.jwtService.extractToken(allHeaders);
```

### 2. Melhorias Adicionais

#### Armazenamento da Instância do Plugin JWT

Para garantir que o plugin JWT esteja sempre disponível nos controller plugins, implementamos o armazenamento da instância do plugin:

```typescript
// Em ModuleFactory
private jwtPluginInstance: Elysia | null = null

// Ao registrar o plugin JWT
const jwtPlugin = await registerJWT(app, metadata.plugins.jwt)
this.jwtPluginInstance = jwtPlugin

// Ao criar controller plugins
if (this.jwtPluginInstance) {
  plugin.use(this.jwtPluginInstance)
}
```

#### Melhorias no Tratamento de Erros

O `AuthGuard` agora distingue entre diferentes tipos de erro:

- **401 Unauthorized**: Sem token, token inválido, token expirado, payload inválido, usuário não encontrado
- **500 Internal Server Error**: Plugin JWT não disponível (erro de configuração)

## Arquivos Modificados

### 1. `/server/src/modules/auth/auth.guard.ts`

- Correção na leitura de headers de múltiplas fontes
- Melhorias no tratamento de erros
- Comentários explicativos adicionados

### 2. `/elysiajs-di/factory/module.factory.ts`

- Adicionado campo `jwtPluginInstance` para armazenar a instância do plugin
- Modificado `registerModule` para armazenar a instância retornada por `registerJWT`
- Modificado `createControllerPlugin` para reutilizar a mesma instância do plugin JWT
- Atualizado método `reset()` para limpar também a instância do plugin

### 3. `/elysiajs-di/services/jwt.service.ts`

- Melhorias nas mensagens de erro
- Tratamento de exceções aprimorado
- Código de debug removido

## Como Testar

### 1. Teste de Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

**Resultado esperado:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User"
  }
}
```

### 2. Teste de Rota Protegida com Token Válido

```bash
TOKEN="seu-token-aqui"
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado esperado:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User"
  },
  "tokenData": {
    "userId": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "iat": 1234567890
  }
}
```

### 3. Teste de Rota Protegida sem Token

```bash
curl -X GET http://localhost:3000/auth/profile
```

**Resultado esperado:**

```json
{
  "error": "Unauthorized"
}
```

**Status HTTP:** `401 Unauthorized`

### 4. Teste de Rota Protegida com Token Inválido

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer invalid-token-12345"
```

**Resultado esperado:**

```json
{
  "error": "Unauthorized"
}
```

**Status HTTP:** `401 Unauthorized`

## Lições Aprendidas

### 1. Headers no ElysiaJS

No ElysiaJS, os headers podem estar em diferentes locais do contexto. Sempre verifique:

- `context.headers`
- `context.request.headers`
- Use métodos como `get()` para acessar headers do objeto Request nativo

### 2. Debugging Eficaz

Use logs de debug estratégicos para identificar onde o problema realmente está:

- Não assuma que o problema está onde você pensa que está
- Verifique cada etapa do fluxo (extração de token, verificação, etc.)
- Use logs para inspecionar a estrutura dos objetos

### 3. Testes Abrangentes

Sempre teste todos os cenários:

- ✅ Caso de sucesso (token válido)
- ❌ Caso sem token
- ❌ Caso com token inválido
- ❌ Caso com token expirado
- ❌ Caso com token malformado

## Checklist de Troubleshooting

Se você encontrar problemas similares, verifique:

- [ ] O plugin JWT está registrado no módulo?
- [ ] O plugin JWT está sendo aplicado aos controller plugins?
- [ ] Os headers estão sendo lidos corretamente?
- [ ] O token está sendo extraído do header `Authorization`?
- [ ] O formato do token está correto (Bearer token)?
- [ ] O JwtService está encontrando o plugin JWT no contexto?
- [ ] O método `verify` está sendo chamado corretamente?
- [ ] O payload do token contém os campos esperados (ex: `userId`)?
- [ ] O usuário existe no banco de dados?

## Referências

- [ElysiaJS JWT Plugin Documentation](https://elysiajs.com/plugins/jwt)
- [ElysiaJS Context Documentation](https://elysiajs.com/concept/context)
- [NestJS Guards Documentation](https://docs.nestjs.com/guards)

## Histórico

- **Data:** Dezembro 2024
- **Versão:** 0.0.7-beta
- **Status:** ✅ Resolvido e testado

# Correções de autenticação

Atualização de segurança de 2 de novembro de 2026: os JWTs não incluem mais nome, e-mail, usuário ou nível de acesso. O `sub` contém somente o código do usuário. A validação exige HS256, emissor, destinatário, versão e tipo corretos; cada token recebe um `jti` aleatório. O formato anterior será rejeitado depois da publicação desta versão.

A recuperação de senha e a troca autenticada usam transações no banco. Um link só pode ser consumido uma vez, inclusive com requisições concorrentes; trocar a senha também invalida os links pendentes. Novas senhas exigem 12 caracteres, letra, número e símbolo, limitadas a 72 bytes para evitar truncamento pelo bcrypt. Senhas existentes continuam aceitas no login.

Os links novos usam `#token=...`, que não é enviado na URL HTTP. O frontend aceita links antigos e remove a credencial da barra de endereço. Há proteção contra respostas atrasadas de renovação após logout e headers de CSP, bloqueio de enquadramento, referrer e HSTS no `vercel.json`.

O navegador usa cookies `HttpOnly` para os tokens de acesso e renovação. O JavaScript mantém somente os dados do usuário em memória. Credenciais antigas em `localStorage` são removidas. O cliente mobile continua recebendo tokens JSON e pode enviar `Authorization: Bearer`.

Cada login cria uma sessão persistente em `DIMISESSAO`. Somente o hash SHA-256 do refresh token é armazenado. A renovação substitui esse hash por comparação e atualização atômicas; um refresh antigo não pode ser reutilizado. A sessão tem um prazo absoluto, determinado pelo refresh original. Logout revoga a sessão no servidor. O logout do cliente mobile deve chamar `POST /sessions/logout` com `{ "refreshToken": "..." }` antes de apagar as credenciais locais.

As requisições autenticadas consultam a conta e a sessão no banco. Contas inativas ou excluídas são bloqueadas imediatamente. Desativar uma conta pelo administrador revoga suas sessões, mesmo que ela seja reativada depois. Os dois tipos de JWT incluem uma versão das credenciais derivada por HMAC do hash da senha. Alterar ou recuperar a senha invalida todos os tokens anteriores, inclusive refresh tokens.

O modo web exige `X-Auth-Mode: cookie` no login e na renovação e devolve apenas o usuário no JSON. Escritas autenticadas por cookie, login web, renovação por cookie e logout por cookie exigem um `Origin` presente na lista `CORS_ORIGINS`. Tokens nunca aparecem nos logs de login/cadastro. A consulta pública `/usuarios/email/:email` e a verificação correspondente no formulário foram removidas; a tela só valida o formato do e-mail.

## Implantação

1. Publicar backend e frontend de forma coordenada. Tokens antigos, sem sessão/versão de credenciais, deixam de ser aceitos; todos precisarão entrar novamente.
2. Aplicar a migration `1793328000000-Sessoes` antes de receber tráfego. A inicialização existente aplica migrations automaticamente quando `DB_MIGRATIONS_RUN` não é `false`. Não foi executada migration em banco publicado durante este trabalho.
3. Configurar `CORS_ORIGINS` com as origens exatas do frontend, separadas por vírgula, sem caminhos. Sem a lista, as chamadas de navegadores ficam bloqueadas. Incluir a origem local ao desenvolver.
4. Em produção, configurar `NODE_ENV=production` e HTTPS: os cookies usam `Secure` e `SameSite=None`. Preferir frontend e API no mesmo site (por exemplo, `app.exemplo.com` e `api.exemplo.com`) ou proxy na mesma origem; navegadores podem bloquear cookies entre sites diferentes. Não há fallback para guardar tokens no navegador.
5. O novo executor de testes do frontend exige Node 22 compatível com Vite 8 (o trabalho foi validado com Node 22.23.4).

Os arquivos `.env` reais foram preservados. O `.env.example` foi atualizado com comentários, prazo padrão de acesso de 15 minutos e `DB_SSL_CA` opcional. Os prazos já configurados no ambiente continuam respeitados. Em produção, a API recusa segredos ausentes, curtos, repetitivos, exemplos conhecidos ou chaves de acesso/refresh iguais; também recusa `DEBUG=true`, `DB_SYNCHRONIZE=true` e origens sem HTTPS. Sem `JWT_REFRESH_SECRET`, deriva uma chave distinta de `JWT_SECRET`.

A conexão por `DATABASE_URL` agora valida o certificado TLS. Se o provedor usa CA privada, configurar `DB_SSL_CA` com o certificado PEM, mantendo a validação habilitada.

## Validação

- Backend: `cd ../server` e `npm test`. A suíte inclui testes HTTP reais em servidor local, usando repositórios em memória: login web/mobile, cookies, CSRF, renovação concorrente, reutilização de refresh, logout, conta inativa/excluída/reativada, troca/recuperação de senha, cadastro e autorização.
- Frontend: `npm test`. Testes dos composables, interceptores Axios, restauração de sessão, rotas protegidas, perfil administrativo, cadastro, logout e serviços de senha. As respostas HTTP são simuladas pelos adapters do Axios.
- Builds: `npm run build` em cada projeto. Verificação TypeScript do backend: `node node_modules/typescript/bin/tsc --noEmit`.
- PostgreSQL real: `npm run test:postgres` na pasta server valida as oito migrations, rotação concorrente, expiração, revogação e consumo único dos links. Cria e remove um container local descartável.
- Navegador real: `npm run test:browser` na pasta web usa Edge, API real e PostgreSQL local descartável. Valida login, cookies HttpOnly, renovação, recuperação, troca de senha e logout. Os headers do `vercel.json` também são aplicados no teste.
- `npm run typecheck` no frontend e `tsc --noEmit` no backend verificam os tipos. Os erros anteriores de tipos do frontend foram corrigidos.
- Os testes Docker só expõem o banco em `127.0.0.1`, não montam volumes e não usam as conexões dos arquivos `.env`. O build de navegador usa `dist/security-browser`, separado do build normal.

## Auditoria e limites da validação

A auditoria completa `npm audit`, incluindo ferramentas de desenvolvimento, retornou zero vulnerabilidades conhecidas nos dois projetos em 2 de novembro de 2026. Bibliotecas diretas e transitivas foram corrigidas; os `overrides` e lockfiles fazem parte da entrega. O SheetJS usa a distribuição corrigida do [CDN oficial](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/). O backend usa watch nativo do Node, removendo o `ts-node-dev` antigo.

Não houve publicação nem acesso ao banco de produção. Os testes locais não verificam a configuração atual do serviço publicado. As regras de verificação dos JWTs seguem as recomendações do [RFC 8725](https://www.rfc-editor.org/rfc/rfc8725.html).

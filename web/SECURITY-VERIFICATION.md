# Verificação de segurança — 2 de novembro de 2026

Fluxo verificado: usuário entra pela tela web, recebe cookies de sessão da API, acessa dados no PostgreSQL, renova a sessão, recupera/troca a senha e encerra o acesso.

| Fronteira | Resultado | Evidência |
|---|---|---|
| Interface e CSP | Passou | Navegação real no Edge, sem violações da CSP aplicada pelo `vercel.json` |
| Navegador → API | Passou | Login responde 200, sem tokens no JSON; cookies têm `HttpOnly` e não aparecem em `document.cookie` |
| API → PostgreSQL | Passou | Banco PostgreSQL 16 local descartável; oito migrations aplicadas em banco vazio |
| Rotação concorrente | Passou | Apenas uma atualização com o refresh anterior vence; reutilização é recusada |
| Recuperação concorrente | Passou | Apenas uma troca consome o mesmo link; senha e consumo são atualizados em transação |
| Troca autenticada | Passou | Invalida access/refresh anteriores e links de recuperação pendentes |
| API → interface | Passou | Recarga renova cookies e mantém acesso; recuperação e troca exigem novo login; logout bloqueia páginas privadas |
| JWTs | Passou | Sem dados pessoais/privilégios no payload; tokens alterados, antigos, expirados ou de tipo/algoritmo/emissor/destinatário incorretos são rejeitados |
| Tipos e builds | Passou | Frontend e backend compilados; TypeScript sem erros nos dois projetos |
| Dependências | Passou | `npm audit`: zero alertas conhecidos, incluindo dependências de desenvolvimento, nos dois projetos |

Resultados das suítes:

- Backend: **132 testes** unitários e de integração HTTP passaram.
- PostgreSQL real: **6 testes** adicionais passaram com `npm run test:postgres`. Esses testes ficam separados e são ignorados pela suíte padrão quando o banco temporário não é fornecido.
- Frontend: **30 testes** passaram.
- Navegador: **1 cenário completo** passou com `npm run test:browser`, incluindo recuperação de senha por fragmento e verificação dos cookies.

Todos os bancos e contas utilizados eram temporários. Os containers foram removidos. Nenhum banco de produção foi acessado. Os arquivos `.env` reais foram preservados; o `.env.example` e os requisitos de configuração foram atualizados.

Os testes não verificam a configuração atualmente publicada: para que os novos controles protejam produção, publicar esta versão do backend e frontend com os lockfiles e atender aos requisitos descritos em [SECURITY-CHANGES.md](./SECURITY-CHANGES.md). O formato anterior de token deixa de ser aceito após essa publicação.

# Revisão de segurança e testes — 02/11/2026

Escopo: código do aplicativo Expo SDK 58 em `mobile`, configuração de sessão, navegação, comunicação com API, atualização Android e dependências npm. Revisão estática e testes automatizados locais. Nenhum ataque foi executado contra produção. O servidor e o histórico completo do Git não foram auditados.

## Achados e proteções implementadas

| Achado | Impacto | Correção |
| --- | --- | --- |
| `vendas.tsx` fora dos grupos protegidos | Abertura da tela administrativa por navegação direta, mesmo sem login; o acesso aos dados ainda depende da API | Rota registrada em grupo que exige login e `nivelAcesso >= 3`; testes para visitante, usuário e administrador |
| Tokens da versão web em localStorage | Persistência de credenciais acessíveis a JavaScript da mesma origem | Sessão web apenas em memória e remoção da chave antiga; recarregar a página exige login novamente |
| Renovação concluindo após logout | Possível restauração indevida da sessão | Resultado descartado se a sessão mudou; persistência serializada para manter a limpeza do logout depois das gravações pendentes |
| Sessão local aceita sem validação | Dados corrompidos tratados como sessão válida | Verificação mínima de tokens, código do usuário e nível de acesso; armazenamento nativo vinculado ao dispositivo e disponível apenas desbloqueado |
| Cliente HTTP sem exigência de transporte seguro | Configuração HTTP poderia transmitir credenciais em produção | HTTPS obrigatório em produção; HTTP permitido somente em desenvolvimento; pedidos privados sem token recusados |
| Requisições sem prazo e respostas internas expostas | Espera indefinida pelos cabeçalhos e detalhes de erros 500 exibidos ao usuário | Abort após 30 segundos até os cabeçalhos, mensagens genéricas para 5xx e rejeição de caminhos malformados |
| Segunda resposta 401 não encerrava sessão | Estado autenticado continuava após renovação recusada | Expiração após falha do token renovado, sem tentativas infinitas |
| Resposta da conta anterior após troca de usuário | Resultado pendente poderia chegar ao consumidor da outra conta | Cliente descarta resposta quando o código do usuário mudou durante a requisição inicial |
| Metadados de APK aceitando qualquer host HTTPS e versão livre | Origem de instalação não restrita e versão utilizada no nome do arquivo | Apenas `https://download.dimitech.com.br/seniorai/seniorai.apk`, sem credenciais na URL; versão numérica `x.y.z`; validação também na entrada do download |
| Link de pagamento sem validar protocolo | Abertura de esquema arbitrário fornecido pela API | Apenas HTTPS sem credenciais e tratamento de erro ao abrir navegador |

O bloqueio de telas no cliente não substitui autorização no servidor. A API deve validar o proprietário de cada recurso, o perfil de administrador e o estado da assinatura em todas as operações. O nível salvo no dispositivo não é uma fronteira de segurança do backend.

## Dependências

Foi executado `npm audit fix` sem `--force`, preservando as faixas declaradas. O alerta alto presente na primeira auditoria foi eliminado. O resultado final está em `audit-result.json`: **43 alertas, sendo 1 baixo e 42 moderados, nenhum alto ou crítico**. A contagem inclui pacotes afetados indiretamente; não representa 43 falhas independentes.

As origens restantes são `deepmerge`, `glob` e `minimatch`, nas cadeias de ferramentas Expo, ESLint e Jest. O npm sugere inclusive regressões incompatíveis de versão para algumas correções. Não foi aplicado downgrade de SDK ou `audit fix --force`. É necessário acompanhar releases compatíveis dos mantenedores e repetir a auditoria; os alertas permanecem abertos.

## Testes

Jest com `jest-expo`, preset do React Native 0.88 e React Native Testing Library. Os testes ficam em `tests/`, fora das rotas. Serviços de rede e motores nativos são simulados; componentes de tela e gráficos permanecem reais.

- Matriz das **8 telas**: entrar, alterar-senha, reuniao, assinatura, vendas, início, reuniões e mais, cada uma com dados vazios e erro de serviço.
- Cada tela verifica renderização e conteúdo esperado com dados vazios ou erro de serviço. A matriz é comparada aos arquivos de rotas para detectar telas novas sem teste.
- Cenários adicionais: validação de login, deep links malformados, permissões de navegação, armazenamento nativo/web, renovação simultânea, logout durante renovação, URLs de APK, requisições públicas/privadas, timeout, erro 500 e troca de conta.

Comandos no PowerShell:

```powershell
npm.cmd test
npm.cmd run test:coverage
npm.cmd run typecheck
npm.cmd run lint
npm.cmd audit
```

O relatório HTML de cobertura é gerado em `coverage/lcov-report/index.html`. Renderizar todas as telas não significa cobrir todas as ações e ramificações. Fluxos reais de criação, edição, exclusão, pagamentos, instalação de APK, deep links no sistema e acessibilidade ainda precisam de testes E2E em Android/iOS com ambiente de teste.

Resultado local: **48 testes aprovados em 6 suítes**, cobertura global de **45,7% das linhas** (27,38% das ramificações). Typecheck aprovado. Lint aprovado sem erros, com os três avisos listados abaixo. Não há alegação de cobertura funcional completa ou ausência de vulnerabilidades.

## Limites e pontos pendentes

- Não houve teste em emulador/dispositivo nem comprovação de autorização, isolamento entre contas, rate limiting, rotação/revogação de refresh tokens e política de senha no servidor.
- Sessão em memória na web reduz persistência, mas não impede roubo de tokens por JavaScript malicioso em execução. Cookies HttpOnly exigem mudança coordenada com backend.
- A origem permitida do APK acompanha o endereço atual do script de lançamento. Alterar a hospedagem exige atualizar a política e seus testes. O conteúdo do APK não ganhou verificação criptográfica adicional; a assinatura do pacote continua a cargo do Android. Redirecionamentos e instalação devem ser verificados em aparelho.
- Os três avisos existentes do lint são: importação de Tabs em `(tabs)/_layout.tsx` e dependências de efeitos em `investimento.tsx` e `meta.tsx`.
- As alterações anteriores em `.env.example` e `../server/.env.example` foram preservadas. A inspeção dos arquivos rastreados encontrou exemplos de ambiente, sem arquivo `.env` real rastreado no escopo mobile; isso não substitui varredura de segredos no histórico.

Referências consultadas: [SDK 58](https://docs.expo.dev/versions/v58.0.0/), [SecureStore](https://docs.expo.dev/versions/v58.0.0/sdk/securestore/), [rotas protegidas](https://docs.expo.dev/router/advanced/protected/), [testes Expo](https://docs.expo.dev/develop/unit-testing/) e [WebBrowser](https://docs.expo.dev/versions/v58.0.0/sdk/webbrowser/).

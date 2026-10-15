# Backend do ComércioOS

API REST em TypeScript, Node.js e Express para as telas Home, Login, Cadastro e Recuperação de acesso.

## Executar localmente

```powershell
cd back-end
npm install
Copy-Item .env.example .env
npm run prisma:migrate -- --name init
npm run dev
```

O servidor inicia em `http://localhost:3333`. O banco local é o SQLite `prisma/dev.db`.

## Endpoints

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/health` | Verifica se a API está disponível |
| GET | `/api/home` | Retorna os dados públicos da Home |
| POST | `/api/auth/register` | Cria comércio e usuário administrador |
| POST | `/api/auth/login` | Autentica e retorna JWT |
| GET | `/api/auth/me` | Retorna o usuário do JWT enviado no Bearer token |
| POST | `/api/auth/forgot-password` | Gera token de recuperação sem expor se o e-mail existe |
| POST | `/api/auth/reset-password` | Redefine a senha usando o token |
| DELETE | `/api/auth/account` | Exclui permanentemente o comércio e seus dados |

O cadastro recebe os campos usados por `Register.tsx`: `cnpj`, `legalName`,
`fantasyName`, `ie`, `segment`, `cep`, `address`, `number`, `city`, `state`,
`name`, `phone`, `email`, `password`, `confirmPassword`, `terms` e `privacy`.

Para chamadas autenticadas, envie:

```http
Authorization: Bearer <jwt>
```

O JWT de autenticação é persistente e não possui expiração por tempo. A cada
requisição, o backend valida no Prisma se a conta, o usuário, o papel e o
comércio ainda existem e estão ativos. Para encerrar a conta, envie `DELETE
/api/auth/account` com o JWT e o body `{ "password": "senha-atual" }`. A
exclusão do comércio usa a relação em cascata e invalida o token imediatamente.

Em desenvolvimento, o token de recuperação é impresso no console. Em produção,
configure `PASSWORD_RESET_WEBHOOK_URL` para encaminhar o token a um serviço de
e-mail por meio do axios. Nunca use o `JWT_SECRET` padrão em produção. Como o token é persistente, use
HTTPS, proteja o armazenamento do navegador e considere implementar revogação
de sessões se houver múltiplos dispositivos.

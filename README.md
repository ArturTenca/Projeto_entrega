# Gemma Entregas

Aplicação web para gerenciamento de entregas de ovos da Gemma.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase Auth + Postgres (RLS)
- React Router

## Configuração local

1. Instale as dependências:

```bash
npm install
```

2. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

3. Preencha em `.env` (este arquivo não é versionado no Git):

- `VITE_SUPABASE_URL` — URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY` — chave anon (pública) do Supabase

4. No Supabase Dashboard:

- Crie os usuários em **Authentication → Users** (sem tela de cadastro no app)
- Desabilite sign-up público em **Authentication → Providers → Email**
- Execute os SQLs locais em `supabase/migrations/` **na ordem** (001 → 002 → 003) no SQL Editor

5. Deploy da Edge Function de bloqueio por IP:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase functions deploy login-rate-limit
```

A função usa `SUPABASE_SERVICE_ROLE_KEY` automaticamente no ambiente Supabase.

6. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

## Proteção de login

1. **5 tentativas falhas** → bloqueio de 30 segundos
2. Após o cooldown → **modo alerta** (última tentativa)
3. **Mais 1 erro** → bloqueio do **IP por 24 horas** (Edge Function + tabela `login_ip_blocks`)

## Deploy (Vercel)

1. Importe o repositório na Vercel
2. Configure as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. O arquivo `vercel.json` já inclui redirect SPA e headers de segurança
4. Deploy da Edge Function no Supabase (passo 5 acima)

## Segurança

Consulte `skills/CYBERSECURITY.md` antes de qualquer alteração que envolva dados de clientes.

- `.env` e arquivos `supabase/**/*.sql` estão no `.gitignore` — nunca commite credenciais nem o schema do banco.

## Dados compartilhados

Não há hierarquia entre usuários. Tudo que André ou Ana criar (clientes, pedidos, entregas) fica visível para todos os usuários autenticados.

## Roteamento e mapa

A tela **Entregas** agrupa o dia por condomínio (cápsulas) e calcula a rota no mapa.

| Prioridade | API | O que faz |
|------------|-----|-----------|
| 1ª | `VITE_GOOGLE_MAPS_API_KEY` | Rota com **trânsito em tempo real** (Routes API) |
| 2ª | `VITE_ORS_API_KEY` | Rota mais curta **sem trânsito** (OpenRouteService) |
| 3ª | — | Estimativa por distância em linha reta |

**Waze** não possui API pública para embedar rotas no app. Cada condomínio tem botão **Waze** que abre o app com navegação e trânsito ao vivo.

Execute também `supabase/migrations/004_condominios_coordinates.sql` para latitude/longitude nos condomínios.

## Fase atual

- [x] Autenticação com Supabase
- [x] Layout base com navegação inferior
- [x] Modelo de dados (condomínios, clientes, pedidos, entregas) + RLS
- [x] Bloqueio de IP por tentativas de login
- [x] Visualização da entrega do dia + mapa + rota otimizada
- [x] CRUD de clientes, condomínios e pedidos (Supabase)
- [x] Agenda semanal + gerar entregas

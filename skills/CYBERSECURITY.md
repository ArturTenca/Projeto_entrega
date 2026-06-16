# CYBERSECURITY.MD

## Objetivo

Esta aplicação gerencia dados pessoais de clientes da Gemma, incluindo:

* Nome
* Telefone
* Endereço
* Condomínio
* Histórico de pedidos

Mesmo sendo uma empresa pequena, todos os dados devem ser tratados como sensíveis.

A segurança deve ser considerada em todas as implementações.

---

# Princípios Gerais

1. Nunca confiar em dados enviados pelo frontend.
2. Toda autorização deve ser validada pelo backend/Supabase.
3. O menor privilégio possível.
4. Nunca expor informações desnecessárias.
5. Segurança é prioridade sobre velocidade de desenvolvimento.

---

# Autenticação

Utilizar exclusivamente Supabase Auth.

Regras:

* Sem sistema próprio de login.
* Sem armazenamento de senhas.
* Utilizar apenas autenticação oficial do Supabase.
* Sempre validar sessão no carregamento da aplicação.
* Implementar logout seguro.
* Redirecionar usuários não autenticados para /login.

---

# Banco de Dados

Todos os acessos devem utilizar Row Level Security (RLS).

Toda tabela deve possuir:

* RLS habilitado
* Policies explícitas

Nunca criar tabelas acessíveis anonimamente.

Exemplo:

* authenticated → acesso permitido
* anon → acesso negado

---

# Dados Sensíveis

Nunca armazenar:

* Senhas
* Tokens
* Chaves privadas
* Segredos da aplicação

Nunca exibir:

* IDs internos
* Tokens JWT
* Dados de configuração

---

# Variáveis de Ambiente

Todas as chaves devem ser armazenadas em:

.env.local

Nunca hardcodar:

* URLs privadas
* Tokens
* Chaves API

Utilizar:

process.env
ou
import.meta.env

dependendo do framework.

---

# Logs

Logs não devem conter:

* Nome de clientes
* Telefones
* Endereços
* Tokens
* Sessões

Permitido:

* Erros técnicos
* IDs de operação
* Mensagens de sistema

---

# Proteção Contra Ataques

Implementar proteção contra:

* XSS
* CSRF
* SQL Injection
* Clickjacking

Regras:

Nunca utilizar:

dangerouslySetInnerHTML

sem sanitização.

---

# Dependências

Antes de instalar qualquer biblioteca:

* verificar manutenção
* verificar popularidade
* verificar vulnerabilidades

Executar regularmente:

npm audit

---

# Frontend

Nunca confiar em:

* hidden inputs
* localStorage para permissões
* verificações apenas visuais

Toda autorização deve ser feita no backend.

---

# Sessões

* Renovação automática de sessão
* Logout em sessão inválida
* Bloqueio de acesso após expiração

---

# Backup

O sistema deve permitir exportação futura dos dados.

Estrutura compatível com:

* CSV
* Excel
* JSON

---

# Checklist Obrigatório

Antes de qualquer Pull Request:

□ RLS ativo

□ Nenhuma chave exposta

□ Nenhum dado sensível em logs

□ Nenhuma senha armazenada

□ Dependências verificadas

□ Sessões validadas

□ Permissões testadas

□ Build de produção funcionando

□ Deploy seguro em Vercel ou Netlify

---

# Regra Absoluta

Sempre que houver dúvida entre:

* praticidade
* segurança

escolher segurança.

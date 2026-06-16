# DESIGN.MD

## Filosofia

O sistema será utilizado diariamente por pessoas operacionais.

O usuário deve conseguir executar tarefas sem treinamento.

Toda decisão de design deve seguir:

* Clareza
* Rapidez
* Simplicidade
* Poucos cliques

Inspirado em:

* iFood Entregador
* iFood Merchant
* Apple
* Linear
* Notion

---

# Mobile First

A aplicação deve ser desenvolvida inicialmente para telas mobile.

Largura base:

390px

Referência:

iPhone 15

---

# Desktop

No desktop:

* Não ocupar 100% da tela
* Utilizar container centralizado
* Largura máxima entre 1200px e 1400px
* Manter aparência semelhante à versão mobile

Objetivo:

Parecer uma aplicação premium e não um painel corporativo antigo.

---

# Visual

Estilo:

* Minimalista
* Moderno
* Limpo
* Profissional

Evitar:

* Gradientes exagerados
* Sombras pesadas
* Bordas chamativas
* Elementos decorativos sem função

---

# Paleta

Primária:

#F54B2E

Secundária:

#111827

Sucesso:

#22C55E

Aviso:

#F59E0B

Erro:

#EF4444

Background:

#FAFAFA

Cards:

#FFFFFF

---

# Bordas

Border Radius:

12px

Cards importantes:

16px

Botões:

12px

---

# Espaçamento

Utilizar escala:

4
8
12
16
24
32
48

Nunca utilizar valores aleatórios.

---

# Tipografia

Fonte:

Inter

Fallback:

sans-serif

Pesos:

400
500
600
700

Evitar textos longos.

Priorizar leitura rápida.

---

# Navegação

Mobile:

Bottom Navigation fixa.

Abas:

* Entregas
* Pedidos
* Clientes
* Agenda
* Configurações

---

# Dashboard

A primeira tela deve responder:

1. O que entregar hoje?
2. Para onde entregar?
3. Quantos pedidos existem?
4. O que está atrasado?

Tudo visível sem scroll excessivo.

---

# Cards

Os cards são a principal unidade visual.

Todo card deve conter:

* Informação principal
* Informação secundária
* Ação rápida

Nunca criar cards apenas decorativos.

---

# Botões

Primário:

Cor laranja da marca.

Secundário:

Outline.

Perigo:

Vermelho.

Botões devem ser grandes o suficiente para uso com polegar.

Altura mínima:

48px

---

# Formulários

Regras:

* Um campo por linha
* Labels sempre visíveis
* Feedback imediato
* Máscaras para telefone e CEP

---

# Entregas

Tela mais importante do sistema.

Cada entrega deve mostrar:

* Cliente
* Condomínio
* Endereço
* Quantidade
* Dia da entrega
* Status

Status:

* Pendente
* Separado
* Em rota
* Entregue

Cores devem seguir o padrão do sistema.

---

# Agenda

Visual semelhante a agenda de entregas.

Objetivo:

Visualizar rapidamente:

* Segunda
* Terça
* Quarta
* Quinta
* Sexta
* Sábado

---

# Performance Visual

Prioridades:

1. Velocidade
2. Clareza
3. Beleza

Nunca adicionar animações desnecessárias.

Animações devem ser:

* Curtas
* Sutis
* Menos de 200ms

---

# Componentes

Criar componentes reutilizáveis:

* Button
* Input
* Card
* Modal
* Badge
* Tabs
* BottomNavigation
* LoadingState
* EmptyState

---

# Regra Absoluta

Se existir dúvida entre:

* adicionar mais elementos
* remover elementos

remover elementos.

A interface deve parecer simples mesmo quando executa tarefas complexas.

# Instruções e Diretrizes do Projeto (Project Guidelines)

Este documento serve como o "Cérebro" do projeto `finance`. Ele contém as principais regras de arquitetura, padrões de código e diretrizes que devem ser seguidas. O objetivo é que qualquer pessoa desenvolvedora — ou Agente de Inteligência Artificial — entenda o contexto e mantenha o padrão da base de código ao contribuir.

**🤖 Aviso para a Inteligência Artificial:** 
Ao iniciar um novo chat envolvendo este repositório, **leia atentamente todas as diretrizes abaixo** antes de escrever código ou sugerir alterações estruturais. Não quebre a arquitetura de Event Sourcing/CQRS.

---

## 1. Stack Tecnológica e Ferramentas
- **Linguagem:** TypeScript (Node.js) configurado como ESM (`"type": "module"`).
- **Gerenciador de Pacotes:** `pnpm`. **Regra absoluta:** Use *apenas* comandos `pnpm` (ex: `pnpm install`, `pnpm add`, `pnpm test`). Nunca utilize `npm` ou `yarn` para não corromper o `pnpm-lock.yaml`.
- **Framework de Testes:** Vitest. O projeto segue estritamente a prática de **Test-Driven Development (TDD)**. Os testes devem *sempre* ser escritos **antes** de qualquer implementação e executados usando as bibliotecas e ferramentas do Vitest (`pnpm run test`).

## 2. Arquitetura do Projeto (DDD, CQRS e Event Sourcing)
Este projeto não utiliza uma estrutura tradicional de ORM/CRUD. Ele é desenhado utilizando os conceitos de **Domain-Driven Design (DDD)** focado em **Event Sourcing** e **CQRS**.

- **Estrutura Modular (`src/modules/*`):** 
  Os contextos da aplicação são divididos em módulos (como `finance` e `shared`). Um módulo é instanciado por meio de uma função de injeção de dependências (ex: `makeFinanceModule({ datasource })`), que retorna seus comandos e lógicas próprias.
  
- **Commands e Command Handlers (`shared/command/`):** 
  São a intenção do usuário de alterar o estado do sistema (ex: `create-recurrence`). 
  **Regra:** Handlers não alteram o banco de dados diretamente através de "updates" nas tabelas, eles geram um ou mais *Events*.

- **Events e Event Store (`shared/event/`):** 
  Representam fatos passados no sistema (ex: `finance:recurrence-created`).
  **Regra:** Toda mudança de estado no domínio deve resultar na criação de um evento usando a função `buildEvent`. Novos eventos devem receber a versão iterada corretamente (`version: events.length + 1`).

- **Aggregates (`shared/aggregate/`):** 
  Representam as entidades raízes do negócio (ex: `Recurrence`). O estado de um Aggregate é sempre fruto da soma de todos os eventos que ele sofreu ao longo do tempo.

- **Infraestrutura (`src/infra/`):** 
  A comunicação com bancos de dados reais (`datasource`), APIs externas e serviços de mensageria devem ficar isolados dentro da camada de infraestrutura. Os módulos de domínio devem ser puros, apenas recebendo as interfaces necessárias na sua injeção.

## 3. Padrões de Escrita de Código
1. **Tipagem Estrita:** 
   Tipar rigorosamente contratos, *Payloads* de eventos, assinaturas de construtores de módulos e retornos.
2. **Imutabilidade:**
   Evite a mutação direta de objetos e prefira operações imutáveis na construção da lógica de negócio.
4. **TDD (Test-Driven Development) Obrigatório:**
   Os testes unitários ou de integração devem *sempre* ser escritos **antes** de implementar a funcionalidade. Nenhuma linha de implementação deve ser feita sem que o teste correspondente tenha sido criado e tenha falhado inicialmente (Red, Green, Refactor).

## 4. Guia Rápido (Workflow para Agentes de IA)
1. **Não Reinvente a Roda:** Antes de criar interfaces base como `Command`, `Event` ou `Aggregate`, verifique se as mesmas já não existem na pasta `src/modules/shared/`.
2. **Seja Fiel aos Módulos:** Toda nova funcionalidade de domínio deve ficar estritamente no seu módulo correspondente.
3. **TDD Sempre:** A IA *deve* primeiro propor e escrever os testes (na pasta `src/test/`) antes de gerar ou sugerir qualquer linha de código final para a implementação. 
4. **Responda em Português:** Para este projeto, o código e suas lógicas (variáveis, types, etc.) devem ser em Inglês. Porém, todas as explicações, relatórios e interação no chat com a pessoa usuária devem ser em **Português do Brasil**.

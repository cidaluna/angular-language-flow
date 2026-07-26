# Angular Language Flow
Projeto Angular Language Flow.

## 📋 Pré-Requisitos
- Node.js 21.2.0
- Angular CLI 21.2.0

## 🚀 Como rodar a aplicação

1. **Clone o repositório:**
  ```bash
    git clone https://github.com/cidaluna/angular-language-flow.git
  ```

2. **Navegue até o diretório do projeto**
```bash
  cd angular-language-flow
```

3. **Instale as dependências do projeto**
  ```bash 
    npm install
  ```

4. **Inicie a aplicação Angular**
  ```bash 
    ng serve
  ```

5. **Abra o seu navegador e acesse a aplicação em:**
  ```text
   http://localhost:4200/
   ```

6. **Em outro terminal, dentro de server rode o comando:**
  ```bash
    node server.js
   ```

## 🗺️ Instalação da lib jsverse/transloco

Para configurar a biblioteca no ambiente, execute o comando interativo do Angular CLI no terminal da raiz do projeto:

```bash
ng add @jsverse/transloco
``` 
Ao executar o comando, responda às perguntas do prompt exatamente com as definições abaixo para manter o padrão do ecossistema:

*   **Which languages do you want to support?** `pt-BR, en-US` (Digite separado por vírgulas)
*   **Which language is the default language?** `pt-BR`
*   **Are you using Server-Side Rendering (SSR)?** `No`

---
## ⚙️ Configuração Estrutural (Angular 18)

O processo de instalação automatizado cria o arquivo de carregamento e injeta a configuração global. Certifique-se de que os arquivos gerados seguem o padrão de arquitetura baseada em funções (*Standalone App*) do Angular 18:

### 1. Loader de Tradução (`src/app/transloco-loader.ts`)
Este serviço é responsável por buscar os arquivos JSON locais sob demanda:

```typescript
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  getTranslation(lang: string) {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}
```

### 2. Registro Global (`src/app/app.config.ts`)
O Transloco é registrado na inicialização da aplicação através do bloco `provideTransloco`:

```typescript
import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './transloco-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['pt-BR', 'en', 'es'],
        defaultLang: 'pt-BR',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader
    })
  ]
};
```
---
## 📊 Guia de Boas Práticas

A tabela abaixo define os padrões de desenvolvimento para a internacionalização do ecossistema. Siga estas diretrizes para garantir a melhor performance e consistência de código:

| Caso de Uso | Abordagem Incorreta (Don't)  | Abordagem Correta (Do)  | Por que fazer assim? |
| :--- | :--- | :--- | :--- |
| **Texto estático no HTML** | `<p>Bem-vindo ao sistema</p>` | `<p>{{ 'home.welcome' \| transloco }}</p>` | **Evita hardcode:** Permite que o texto mude dinamicamente conforme o arquivo JSON de tradução. |
| **Blocos grandes ou formulários** | `<label>{{ 'form.name' \| transloco }}</label>`<br>`<input>`<br>`<span>{{ 'form.required' \| transloco }}</span>` | `<div *transloco="let t">`<br>&nbsp;&nbsp;`<label>{{ t('form.name') }}</label>`<br>&nbsp;&nbsp;`<input>`<br>&nbsp;&nbsp;`<span *ngIf="err">{{ t('form.required') }}</span>`<br>`</div>` | **Performance:** O pipe `\| transloco` cria uma assinatura/instância para cada tag. A diretiva `*transloco` cria apenas uma instância para todo o bloco, otimizando o Change Detection do Angular. |
| **Tradução dentro do TypeScript** | `const msg = 'Operação realizada com sucesso';`<br>`this.toast.show(msg);` | `this.translocoService.selectTranslate('sucesso.salvar')`<br>`.subscribe(msg => this.toast.show(msg));`<br><br>*Ou usando sinais (Angular Signals):*<br>`msg = this.translocoService.selectTranslate('sucesso.salvar');` | **Reatividade:** Se o idioma mudar com o app aberto, a string no TypeScript atualiza sozinha na tela. Nunca use `.translate()` puro se o valor for persistir na tela para evitar strings órfãs. |
| **Textos com variáveis dinâmicas** | `<p>Olá, {{ nome }}. Você tem {{ qtd }} mensagens.</p>` | `<p>{{ 'home.greeting' \| transloco: { nome: nome, qtd: qtd } }}</p>`<br><br>*No JSON:*<br>`"greeting": "Olá, {{nome}}. Você tem {{qtd}} mensagens."` | **Segurança de sintaxe:** Mantém a estrutura da frase natural para o tradutor em outros idiomas (onde a ordem e concordância das palavras mudam de acordo com o país). |
| **Atributos HTML (Placeholder/Title)** | `<input placeholder="Digite seu e-mail">` | `<input [placeholder]="'form.emailPlaceholder' \| transloco">` | **Acessibilidade e UX:** Garante que dicas de ferramentas (tooltips), placeholders e atributos `aria-label` acompanhem a internacionalização em tempo real. |
| **Pluralização complexa** | `<p *ngIf="total === 1">1 item encontrado</p>`<br>`<p *ngIf="total !== 1">{{total}} itens encontrados</p>` | `<p>{{ 'search.result' \| transloco: { count: total } }}</p>`<br><br>*No JSON (com Transloco MessageFormat):*<br>`"result": "{count, plural, =0 {Nenhum item} =1 {1 item} other {# itens}}"` | **Clean Code:** Elimina diretivas estruturais (`*ngIf`) desnecessárias e poluição visual no HTML para tratar regras gramaticais e numéricas de plural. |

⚠️ **Aviso de Sincronismo:** Toda nova chave criada nos arquivos `.json` deve ser adicionada simultaneamente em `pt-BR.json` e `en-US.json` para evitar erros de renderização ou chaves em branco (*missing translation*) em produção.

---
## 🧩 Uso Avançado: Integração com Design System e Tags Semânticas

Para utilizar a diretiva estrutural `*transloco="let t"` sem injetar tags HTML adicionais (como `<div>`) que possam quebrar o layout, as regras de CSS do seu Design System ou a semântica estrutural (`<header>`, `<footer>`), utilize a tag lógica **`<ng-container>`**. O Angular remove esta tag do DOM final durante a renderização.

### 1. Uso Semântico Estrutural (Sem injetar DIVs no DOM)
Ideal para encapsular blocos inteiros mantendo a fidelidade das tags nativas e componentes customizados:

```html
<header>
  <!-- O ng-container não gera nenhuma tag física na tela, apenas expõe a variável 't' -->
  <ng-container *transloco="let t">
    <h1>{{ t('header.title') }}</h1>
    <p>{{ t('header.subtitle') }}</p>
  </ng-container>
</header>
```

### 2. Passando Traduções para Inputs de Componentes do Design System
Se os componentes do seu Design System recebem texto via propriedades (`@Input`), você pode invocar a função `t()` diretamente no mapeamento de propriedade (Property Binding) do Angular:

```html
<ng-container *transloco="let t">
  <!-- Exemplo com Dropdown customizado -->
  <ds-dropdown 
    [label]="t('form.selectLanguage')" 
    [placeholder]="t('form.chooseOption')">
    <ds-dropdown-item value="pt-BR">Português</ds-dropdown-item>
  </ds-dropdown>

  <!-- Exemplo com Tooltip customizado -->
  <button [dsTooltip]="t('actions.deleteHelp')">
    {{ t('actions.delete') }}
  </button>
</ng-container>
```

### 3. Uso Direto sem Diretiva Estrutural (Pipe Alternativo)
Caso precise traduzir uma propriedade única em um componente isolado do Design System e não queira criar um bloco `<ng-container>`, você pode usar o pipe `| transloco` diretamente na propriedade:

```html
<input 
  [label]="'form.name' | transloco" 
  [errorMessage]="'form.required' | transloco" />
```
---
## 📏 Linha de Corte: Pipe (`| transloco`) vs Diretiva (`*transloco`)

Para manter a aplicação performática e o consumo de memória controlado, estabelecemos a seguinte métrica de corte para revisões de código (PRs):

*   **⚠️ Limite Máximo de Pipes:** É permitida a utilização de no máximo **3 a 4 ocorrências** do pipe `\| transloco` por arquivo HTML.
*   **🚀 Regra de Transição:** Caso o arquivo HTML necessite traduzir **5 ou mais chaves**, torna-se **obrigatório** o uso do escopo estrutural `<ng-container *transloco="let t">` envolvendo o trecho ou a totalidade do código.

**Exemplo de cenário que DEVE ser rejeitado no Code Review:**
```html
<!-- Repetição ineficiente: 5 assinaturas impuras em memória -->
<h1>{{ 'auth.login.title' \| transloco }}</h1>
<p>{{ 'auth.login.subtitle' \| transloco }}</p>
<input [placeholder]="'auth.login.userPlaceholder' \| transloco">
<input [placeholder]="'auth.login.passPlaceholder' \| transloco">
<button>{{ 'auth.login.submitBtn' \| transloco }}</button>
```

**Exemplo corrigido e aprovado:**
```html
<!-- Otimizado: Apenas 1 assinatura gerenciando todo o escopo do formulário -->
<ng-container *transloco="let t">
  <h1>{{ t('auth.login.title') }}</h1>
  <p>{{ t('auth.login.subtitle') }}</p>
  <input [placeholder]="t('auth.login.userPlaceholder')">
  <input [placeholder]="t('auth.login.passPlaceholder')">
  <button>{{ t('auth.login.submitBtn') }}</button>
</ng-container>
```
---
## 📐 Arquitetura de Pastas e Estrutura de Arquivos

Seguindo os padrões de arquitetura corporativa para o Angular 18, a internacionalização é tratada como um serviço de infraestrutura global dentro de `core/`. Abaixo está a árvore de diretórios focada no ecossistema do Transloco e NGXS, demonstrando como ela se acopla aos seletores e interceptores globais já existentes na aplicação:

```text
angular-language-flow/
├── node_modules/                   # Dependências instaladas do ecossistema Node.js
├── public/                         # Pasta de arquivos públicos estáticos do Angular moderno
│   ├── i18n/                       # Dicionários de tradução (Arquivos JSON locais)
│   │   ├── en-US.json              # Chaves e textos traduzidos para Inglês (US)
│   │   ├── es-ES.json              
│   │   └── pt-BR.json              
│   └── favicon.ico                 
├── server/                         # Ambiente de mock da API corporativa para simular o Backend
│   ├── db.json                     # Banco de dados fake com dados dinâmicos internacionalizados
│   └── server.js                   # Script Node.js que serve a API e simula latência/erros
└── src/                            
    └── app/                        
        ├── core/                   # Núcleo da aplicação (Lógicas globais, interceptors e serviços)
        │   ├── error/              # Tratamento e mapeamento global de falhas de rede
        │   ├── i18n/               # Infraestrutura e engine de internacionalização
        │   │   ├── transloco-loader.ts # Serviço HTTP responsável por buscar os JSONs locais
        │   │   └── transloco.config.js # Configuração central da CLI e do extrator de chaves
        │   ├── interceptors/       # Interceptadores de tráfego HTTP global
        │   │   └── language-header.interceptor.ts # Injeta automaticamente o idioma reativo nos headers da API
        │   ├── loader/             # Orquestração do estado visual de carregamento atômico
        │   │   ├── loader/         # Componente visual do Loader de tela inteira
        │   │   │   ├── loader.html
        │   │   │   ├── loader.scss
        │   │   │   ├── loader.spec.ts
        │   │   │   └── loader.ts
        │   │   ├── loader.interceptor.ts # Intercepta requisições HTTP para ligar/desligar o Loader de forma automatizada
        │   │   └── loader.state.ts # Gerenciamento de estado reativo (NGXS/Signals) do Loader global
        │   └── services/           
        │       └── language.service.ts # Centraliza o Signal do idioma atual e expõe métodos de troca
        ├── home\components\home/   
        │   ├── interfaces/         
        │   │   ├── home-item.interface.ts # Tipagem rígida para os dados dinâmicos da API
        │   │   └── language.type.ts 
        │   ├── services/           # Serviços de dados restritos à tela Home
        │   │   └── home-api.service.ts # Consome os endpoints da API trazendo dados dinâmicos com cabeçalhos de idioma
        │   ├── home.html           
        │   ├── home.scss
        │   ├── home.spec.ts
        │   └── home.ts             # Componente reativo que consome os dados e gerencia o ciclo de vida
        ├── app.config.ts           # Registro de provedores globais do Angular, HttpClient e Transloco
        ├── app.html                # Template base do Angular (Injeta o router-outlet e o loader global)
        └── app.routes.ts           # Mapeamento e guarda de rotas da aplicação
```

---
## 📐 O Fluxo de Dados Ponta a Ponta

Abaixo está o mapa visual de como o sistema se comporta de forma totalmente reativa a partir da interação do usuário no dropdown do cabeçalho:

```text
[ Dropdown Header ]  ──(Ação manual do usuário)──> Dispara LanguageService.changeLanguage()
         │
         ▼
[ LanguageService ]  ──(Fonte da Verdade)────────> Atualiza o activeLang: WritableSignal
         │
         ▼
[ effect() na Home ] ──(Radar Reativo Ativo)─────> Detecta mudança no Signal e aciona a API
         │
         ▼
[ HttpClient.get ]   ──(Interceptor Acted)──────> loaderInterceptor dispara [Loader] Show no NGXS
         │                                         ↳ 🛑 Tela bloqueada c/ Overlay e Spinner
         ▼
[ switchMap (RxJS) ] ──(Barreira Bloqueante)─────> 1. Recebe dados 200 da API Fake
         │                                         2. Segura o loader na tela
         │                                         3. Baixa o arquivo JSON do Transloco (public/i18n/)
         ▼
[ Fluxo Concluído ] ──(Desbloqueio Atômico)─────> Transloco renderiza textos fixos + API exibe os cards
                                                   ↳ 🟢 Interceptor fecha o Loader Global
```

---
## 🧱 Divisão de Responsabilidades (SOLID & Clean Code)

Para garantir escalabilidade, aplicamos o **Princípio de Responsabilidade Única** onde cada arquivo atua de forma isolada e desacoplada:

| Camada do Sistema | Responsabilidade Técnica | Motivo da Escolha Arquitetural |
| :--- | :--- | :--- |
| **`LanguageService`** | Estado Global do Idioma | Centraliza a "Fonte da Verdade" usando um **Signal**. Impede loops infinitos isolando a gravação de dados da leitura de tela. |
| **`HomeService`** | Consumo e *Sanity Check* | Injeta o idioma ativo diretamente no cabeçalho `Accept-Language`. Valida a saúde dos dados e força um erro `404/500` caso a API envie um corpo vazio (`[]`). |
| **`HomeComponent`** | Orquestração Reativa | Usa o **`effect()`** no construtor como um radar. Ele se reativa sozinho toda vez que o idioma do dropdown muda, redesenhando a tela. |
| **`loaderInterceptor`**| Controle de Tráfego Passivo | Monitora de forma automática o ciclo de vida das chamadas HTTP da aplicação, acionando o estado global do loader no **NGXS**. |
| **`errorInterceptor`** | Contingência Global | Protege o usuário contra falhas do servidor. Caso ocorra um erro de rede ou o `HomeService` lance uma exceção, ele assume a navegação para `/error`. |

---
## 🏆 Por que esta solução é considerada válida?

1. **Evita o uso do `APP_INITIALIZER`:** Inicializadores de boot travam o carregamento total do ecossistema e impedem o **Componente do Loader** de nascer no HTML antes da chamada começar. Delegar o fluxo para o `effect` da Home permite que a tela de carregamento exista fisicamente de forma acessível.
2. **Encadeamento Bloqueante com `switchMap`:** O `loaderInterceptor` monitora a requisição HTTP. Ao estendermos o fluxo com o `switchMap` para aguardar também o `selectTranslation()` do Transloco, o interceptor entende que a tarefa só terminou quando **ambos** os arquivos (o dado do banco + o JSON do front) estão baixados. O loader só sai da tela quando a tradução for 100% atômica.
3. **Imunidade a Telas em Branco:** Caso o servidor dê um status `200 OK` incompleto ou sem dados, o *Sanity Check* do serviço quebra o fluxo de forma segura no `map` do RxJS, ativando as rotas de contingência automaticamente sem congelar a aplicação em estados de carregamento infinito.

---
## 🛠️ Ferramentas de Auditoria e Qualidade de Código (i18n)

Para garantir que nenhuma chave de internacionalização pendente, incorreta ou vazia seja enviada para os ambientes de homologação e produção, este projeto adota ferramentas de análise estática integradas ao ecossistema do Transloco. 

| Dependência | O que é? | Papel Prático na Aplicação Corporativa | Importância no Projeto |
| :--- | :--- | :--- | :--- |
| **`@jsverse/transloco-keys-manager`** | CLI de Gerenciamento Estático de Chaves | Executa a varredura automática (linter) cruzando todas as strings usadas nos arquivos HTML/TS com os arquivos JSON na pasta `public/i18n/`. | **Altíssima (Crítica):** Usado no script `npm run i18n:find-missing` para quebrar o build e impedir o deploy na esteira de CI/CD se o desenvolvedor esquecer de traduzir um rótulo ou botão em qualquer idioma. |
| **`@jsverse/transloco-utils`** | Biblioteca de Tipagem e Utilitários | Fornece os contratos de interface e parsers necessários (como a tipagem `TranslocoGlobalConfig`) para que as ferramentas de CLI conversem com as configurações do ecossistema Node.js na raiz do projeto. | **Alta (Infraestrutura):** Garante a validação de tipos em tempo de desenvolvimento no VS Code, mapeando corretamente as pastas de entrada e saída de dados sem gerar falhas de runtime no terminal. |

### 🚫 Política Estrita contra Traduções Omissas (Missing Keys)

Neste projeto, **não é permitida a geração de chaves automáticas com valores vazios ou placeholders genéricos**, pois interfaces corporativas não podem exibir contextos irreais ou incompletos para o usuário final. 

Por consequência, o comando de auditoria opera de forma restritiva:

1. **Fase de Desenvolvimento (Local):** O desenvolvedor deve rodar `npm run i18n:find-missing` antes de commitar. O terminal listará exatamente quais chaves estão ausentes nos dicionários `en-US.json` ou `pt-BR.json`.
2. **Fase de Integração (CI/CD):** A esteira executa o mesmo comando. Caso o relatório encontre assimetria entre os arquivos de idioma, o pipeline de build é **abortado imediatamente**, bloqueando o Pull Request até que as chaves reais sejam inseridas pelo desenvolvedor.

---
## 🚀 Como Adicionar um Novo Idioma na Aplicação (Guia de Expansão)

O ecossistema de internacionalização desta aplicação foi arquitetado sob os princípios de **baixo acoplamento**, tornando o processo de adição de novas línguas (ex: Francês - `fr-FR`) extremamente simples, seguro e padronizado. 

Qualquer desenvolvedor da equipe pode expandir o sistema seguindo rigorosamente os **3 passos** abaixo:

### 📂 Passo 1: Criar o Arquivo de Tradução do Frontend
Navegue até o diretório `public/i18n/` e crie o arquivo JSON utilizando o código longo do novo idioma (ex: `fr-FR.json`). Copie a estrutura de chaves existentes e insira as novas traduções fixas:

```text
public/
└── i18n/
    ├── pt-BR.json
    ├── en-US.json
    ├── es-ES.json
    └── fr-FR.json      <-- 1. Novo arquivo criado aqui
```

### 🎨 Passo 2: Atualizar a Interface e os Modificadores Globais
Para manter a segurança de tipo do TypeScript e garantir que as telas reconheçam a nova opção, precisamos registrar o novo código em dois arquivos de infraestrutura:

1. **No arquivo de contratos (`button.interface.ts` ou similar):**
   Atualize o tipo literal para aceitar o novo código de idioma:
   ```typescript
   export interface HomeItemsResponse {
     id: number;
     lang: 'pt-BR' | 'en-US' | 'es-ES' | 'fr-FR'; // 2. Adicione o novo literal aqui
     items: Array<{ id: number; titulo: string; descricao: string; }>;
   }
   ```

2. **No arquivo de configuração do app (`app.config.ts`):**
   Adicione o novo código no array de idiomas disponíveis do Transloco:
   ```typescript
   provideTransloco({
     config: {
       availableLangs: ['pt-BR', 'en-US', 'es-ES', 'fr-FR'], // 3. Adicione aqui
       defaultLang: 'pt-BR',
       reRenderOnLangChange: true,
     },
     loader: TranslocoHttpLoader
   })
   ```

3. **No componente do menu (`header.component.ts`):**
   Insira a nova opção no array para que ela apareça automaticamente no Dropdown do cabeçalho:
   ```typescript
   protected languages = [
     { code: 'pt-BR', label: 'Português (Brasil)' },
     { code: 'en-US', label: 'English (US)' },
     { code: 'es-ES', label: 'Español' },
     { code: 'fr-FR', label: 'Français' } // 4. Adicione aqui
   ];
   ```

### ⚙️ Passo 3: Alimentar a API Mock (Banco de Dados Fake)
Abra o seu arquivo `db.json` no backend fake e adicione o novo bloco de dados dinâmicos correspondente dentro do array `"homeItems"`. 

Certifique-se de preencher o campo `"lang"` com o valor exato que você registrou no frontend:

```json
{
  "homeItems": [
    {
      "id": 4,
      "lang": "fr-FR",
      "items": [
        { "id": 1, "titulo": "API - Parcours d'études", "descricao": "API - Contenu adapté à votre rythme." },
        { "id": 2, "titulo": "API - Mentorat", "descricao": "API - Un accompagnement de proche à chaque étape." },
        { "id": 3, "titulo": "API - Certificat", "descricao": "API - Reconnaissance à la fin du cours." },
        { "id": 4, "titulo": "API - Communauté", "descricao": "API - Échange avec d'autres étudiants et anciens." }
      ]
    }
  ]
}
```


### 🎯 Pronto! O que acontece por baixo dos panos?
Graças à nossa **arquitetura orientada a Signals e Efeitos**, você **não precisa alterar nenhuma linha de código lógico** na página `Home`. 

Assim que o usuário selecionar "Français" no dropdown:
1. O `LanguageService` atualiza o sinal reativo para `'fr-FR'`.
2. O `effect()` da Home detecta a mudança e ativa o loader global.
3. O `HomeService` faz o `HttpClient.get()` injetando o idioma no header.
4. O `switchMap` captura o novo bloco do `db.json`, baixa o arquivo `fr-FR.json` e redesenha a tela perfeitamente sem nenhuma piscada bilingue!

# Angular Language Flow
Projeto Angular Language Flow.

### 📋 Pré-Requisitos
- Node.js 21.2.0
- Angular CLI 21.2.0

### 🚀 Como rodar a aplicação

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

### 🗺️ Instalação da lib jsverse/transloco

Para configurar a biblioteca no ambiente, execute o comando interativo do Angular CLI no terminal da raiz do projeto:

```bash
ng add @jsverse/transloco
``` 
Ao executar o comando, responda às perguntas do prompt exatamente com as definições abaixo para manter o padrão do ecossistema:

*   **Which languages do you want to support?** `pt-BR, en-US` (Digite separado por vírgulas)
*   **Which language is the default language?** `pt-BR`
*   **Are you using Server-Side Rendering (SSR)?** `No`

---

### ⚙️ Configuração Estrutural (Angular 18)

O processo de instalação automatizado cria o arquivo de carregamento e injeta a configuração global. Certifique-se de que os arquivos gerados seguem o padrão de arquitetura baseada em funções (*Standalone App*) do Angular 18:

#### 1. Loader de Tradução (`src/app/transloco-loader.ts`)
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

#### 2. Registro Global (`src/app/app.config.ts`)
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
### 📊 Guia de Boas Práticas

A tabela abaixo define os padrões de desenvolvimento para a internacionalização do ecossistema. Siga estas diretrizes para garantir a melhor performance e consistência de código:

| Caso de Uso | Abordagem Incorreta (Don't) ❌ | Abordagem Correta (Do)  | Por que fazer assim? |
| :--- | :--- | :--- | :--- |
| **Texto estático no HTML** | `<p>Bem-vindo ao sistema</p>` | `<p>{{ 'home.welcome' \| transloco }}</p>` | **Evita hardcode:** Permite que o texto mude dinamicamente conforme o arquivo JSON de tradução. |
| **Blocos grandes ou formulários** | `<label>{{ 'form.name' \| transloco }}</label>`<br>`<input>`<br>`<span>{{ 'form.required' \| transloco }}</span>` | `<div *transloco="let t">`<br>&nbsp;&nbsp;`<label>{{ t('form.name') }}</label>`<br>&nbsp;&nbsp;`<input>`<br>&nbsp;&nbsp;`<span *ngIf="err">{{ t('form.required') }}</span>`<br>`</div>` | **Performance:** O pipe `\| transloco` cria uma assinatura/instância para cada tag. A diretiva `*transloco` cria apenas uma instância para todo o bloco, otimizando o Change Detection do Angular. |
| **Tradução dentro do TypeScript** | `const msg = 'Operação realizada com sucesso';`<br>`this.toast.show(msg);` | `this.translocoService.selectTranslate('sucesso.salvar')`<br>`.subscribe(msg => this.toast.show(msg));`<br><br>*Ou usando sinais (Angular Signals):*<br>`msg = this.translocoService.selectTranslate('sucesso.salvar');` | **Reatividade:** Se o idioma mudar com o app aberto, a string no TypeScript atualiza sozinha na tela. Nunca use `.translate()` puro se o valor for persistir na tela para evitar strings órfãs. |
| **Textos com variáveis dinâmicas** | `<p>Olá, {{ nome }}. Você tem {{ qtd }} mensagens.</p>` | `<p>{{ 'home.greeting' \| transloco: { nome: nome, qtd: qtd } }}</p>`<br><br>*No JSON:*<br>`"greeting": "Olá, {nome}. Você tem {qtd} mensagens."` | **Segurança de sintaxe:** Mantém a estrutura da frase natural para o tradutor em outros idiomas (onde a ordem e concordância das palavras mudam de acordo com o país). |
| **Atributos HTML (Placeholder/Title)** | `<input placeholder="Digite seu e-mail">` | `<input [placeholder]="'form.emailPlaceholder' \| transloco">` | **Acessibilidade e UX:** Garante que dicas de ferramentas (tooltips), placeholders e atributos `aria-label` acompanhem a internacionalização em tempo real. |
| **Pluralização complexa** | `<p *ngIf="total === 1">1 item encontrado</p>`<br>`<p *ngIf="total !== 1">{{total}} itens encontrados</p>` | `<p>{{ 'search.result' \| transloco: { count: total } }}</p>`<br><br>*No JSON (com Transloco MessageFormat):*<br>`"result": "{count, plural, =0 {Nenhum item} =1 {1 item} other {# itens}}"` | **Clean Code:** Elimina diretivas estruturais (`*ngIf`) desnecessárias e poluição visual no HTML para tratar regras gramaticais e numéricas de plural. |

⚠️ **Aviso de Sincronismo:** Toda nova chave criada nos arquivos `.json` deve ser adicionada simultaneamente em `pt-BR.json`, `en.json` e `es.json` para evitar erros de renderização ou chaves em branco (*missing translation*) em produção.

---
### 🧩 Uso Avançado: Integração com Design System e Tags Semânticas

Para utilizar a diretiva estrutural `*transloco="let t"` sem injetar tags HTML adicionais (como `<div>`) que possam quebrar o layout, as regras de CSS do seu Design System ou a semântica estrutural (`<header>`, `<footer>`), utilize a tag lógica **`<ng-container>`**. O Angular remove esta tag do DOM final durante a renderização.

#### 1. Uso Semântico Estrutural (Sem injetar DIVs no DOM)
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

#### 2. Passando Traduções para Inputs de Componentes do Design System
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

#### 3. Uso Direto sem Diretiva Estrutural (Pipe Alternativo)
Caso precise traduzir uma propriedade única em um componente isolado do Design System e não queira criar um bloco `<ng-container>`, você pode usar o pipe `| transloco` diretamente na propriedade:

```html
<ds-input 
  [label]="'form.name' | transloco" 
  [errorMessage]="'form.required' | transloco">
</ds-input>
```
---
## 📐 Arquitetura de Pastas e Estrutura de Arquivos

Seguindo os padrões de arquitetura corporativa para o Angular 18, a internacionalização é tratada como um serviço de infraestrutura global dentro de `core/`. Abaixo está a árvore de diretórios focada no ecossistema do Transloco e NGXS, demonstrando como ela se acopla aos seletores e interceptores globais já existentes na aplicação:

```text
src/
├── app/
│   ├── core/
│   │   ├── interceptors/
│   │   │   ├── global.interceptor.ts         # Interceptor global existente
│   │   │   └── i18n-http.interceptor.ts      # NOVO: Injeta header de idioma nas requisições do BFF
│   │   ├── services/
│   │   │   └── loader.service.ts             # Loader global existente (exibe/esconde spinner)
│   │   └── i18n/                             # NOVO: Módulo isolado de Internacionalização
│   │       ├── constants/
│   │       │   └── i18n.constants.ts         # Definição única de idiomas suportados, chaves e tipos
│   │       ├── helpers/
│   │       │   └── i18n-test.helper.ts       # Utilitário de Mock para testes unitários (.spec)
│   │       ├── state/
│   │       │   ├── i18n.actions.ts           # Actions do NGXS para troca de idioma
│   │       │   ├── i18n.state.ts             # Estado do NGXS que gerencia o fluxo com o BFF Java
│   │       │   └── i18n.state.spec.ts        # Testes unitários do fluxo de transição de idioma
│   │       └── transloco-loader.ts           # Loader do Transloco configurado com as constantes
│   └── store/                                # Gerenciamento de Estados Globais Existentes
│       ├── user/
│       │   └── user.state.ts                 # Estado do usuário logado
│       └── preferences/
│           └── preferences.state.ts          # Estado de preferências do sistema
└── assets/
    └── i18n/                                 # Dicionários de tradução exclusivos do Front-end
        ├── pt-BR.json
        ├── en.json
        └── es.json
```

---

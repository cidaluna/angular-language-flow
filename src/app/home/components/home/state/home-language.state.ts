import { Injectable } from '@angular/core';

import {
  Action,
  Selector,
  State,
  StateContext,
} from '@ngxs/store';

import {
  catchError,
  map,
  switchMap,
  tap,
  throwError,
  timeout,
} from 'rxjs';

import { TranslocoService } from '@jsverse/transloco';

import { HomeApiService } from '../services/home-api.service';
import { LanguagePreferenceApiService } from '../services/language-preference-api.service';

import {
  ChangeLanguage,
  ClearSwitchError,
  LoadInitialHomeItems,
  SyncLanguageFailure,
  SyncLanguageSuccess,
} from './home-language.actions';

import {
  HOME_LANGUAGE_STATE_DEFAULTS,
  HomeItemsResponse,
  HomeLanguageStateModel,
} from '../interfaces/home-item.interface';

@State<HomeLanguageStateModel>({
  name: 'homeLanguage',
  defaults: HOME_LANGUAGE_STATE_DEFAULTS,
})
@Injectable()
export class HomeLanguageState {
  constructor(
    private readonly homeApi: HomeApiService,
    private readonly languagePreferenceApi: LanguagePreferenceApiService,
    private readonly translocoService: TranslocoService,
  ) {}

  // ---------------------------------------------------------------------------
  // SELECTORS
  // ---------------------------------------------------------------------------

  @Selector()
  static items(state: HomeLanguageStateModel) {
    return state.items;
  }

  @Selector()
  static loading(state: HomeLanguageStateModel) {
    return state.loading;
  }

  @Selector()
  static error(state: HomeLanguageStateModel) {
    return state.error;
  }

  @Selector()
  static currentLang(state: HomeLanguageStateModel) {
    return state.currentLang;
  }

  // ---------------------------------------------------------------------------
  // VALIDADORES
  // ---------------------------------------------------------------------------

  /**
   * Valida a estrutura mínima da resposta.
   *
   * Independente do fluxo, o backend precisa devolver:
   *
   * response.lang
   *
   * Caso o idioma não exista, a resposta não pode ser considerada válida.
   */
  private validateResponseStructure(
    response: HomeItemsResponse,
  ): HomeItemsResponse {
    if (!response.lang?.trim()) {
      throw new Error(
        'PAYLOAD_INVALIDO_LANG_AUSENTE',
      );
    }

    return response;
  }

  /**
   * Validação utilizada SOMENTE na troca manual de idioma.
   *
   * Quando o usuário escolhe explicitamente "en-US", primeiro persistimos
   * essa preferência no backend.
   *
   * Depois fazemos o GET da Home com:
   *
   * Accept-Language: en-US
   *
   * Nesse fluxo esperamos que o backend devolva:
   *
   * response.lang === en-US
   */
  private validateRequestedLanguage(
    response: HomeItemsResponse,
    requestedLang: string,
  ): HomeItemsResponse {
    if (response.lang !== requestedLang) {
      throw new Error(
        'PAYLOAD_LANG_DIVERGENTE_DO_SOLICITADO',
      );
    }

    return response;
  }

  // ---------------------------------------------------------------------------
  // PIPELINE DE SINCRONIZAÇÃO
  // ---------------------------------------------------------------------------

  /**
   * Pipeline comum depois que o GET /apiHomeItems foi executado.
   *
   * Responsabilidades:
   *
   * 1. Validar payload.
   * 2. Carregar a tradução correspondente.
   * 3. Só depois alterar o Transloco.
   * 4. Só depois realizar o commit no NGXS.
   *
   * O parâmetro validateRequestedLanguage controla se devemos exigir
   * que response.lang seja exatamente igual ao idioma solicitado.
   *
   * INITIAL:
   *   false
   *
   * CHANGE:
   *   true
   */
  private syncAndApply(
    ctx: StateContext<HomeLanguageStateModel>,
    response$: ReturnType<HomeApiService['getHomeItems']>,
    requestedLang: string,
    validateRequestedLanguage: boolean,
  ) {
    return response$.pipe(

      // -----------------------------------------------------------------------
      // 1. Validação estrutural
      // -----------------------------------------------------------------------
      map((response) =>
        this.validateResponseStructure(response),
      ),

      // -----------------------------------------------------------------------
      // 2. Validação específica da troca manual
      // -----------------------------------------------------------------------
      map((response) => {
        if (!validateRequestedLanguage) {
          return response;
        }

        return this.validateRequestedLanguage(
          response,
          requestedLang,
        );
      }),

      // -----------------------------------------------------------------------
      // 3. O idioma efetivo vem do response.lang
      // -----------------------------------------------------------------------
      switchMap((response) =>
        this.translocoService.selectTranslation(response.lang).pipe(
          timeout({
            each: 6000,
            with: () => throwError(() => new Error('TIMEOUT_TRANSLOCO')),
          }),
          map(() => response),
        ),
      ),

      // -----------------------------------------------------------------------
      // 4. COMMIT
      // -----------------------------------------------------------------------
      //
      // Somente neste ponto temos:
      //
      // API válida
      // +
      // idioma válido
      // +
      // tradução carregada
      //
      // Portanto o idioma pode ser considerado oficialmente aplicado.
      //
      tap((response) => {
        this.translocoService.setActiveLang(
          response.lang,
        );

        ctx.dispatch(
          new SyncLanguageSuccess(
            response.lang,
            response.items,
          ),
        );
      }),

      // -----------------------------------------------------------------------
      // 5. Falha
      // -----------------------------------------------------------------------
      catchError((err) => {
        const errorMessage =
          err?.message ??
          'ERRO_DESCONHECIDO';

        console.error(
          '[HomeLanguageState] falha na sincronização:',
          errorMessage,
        );

        ctx.dispatch(
          new SyncLanguageFailure(
            errorMessage,
          ),
        );

        return throwError(() => err);
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // FLUXO 1 — CARGA INICIAL
  // ---------------------------------------------------------------------------

  /**
   * Fluxo executado quando a Home nasce.
   *
   * Regra:
   *
   * 1. Começamos com pt-BR.
   * 2. Fazemos GET /apiHomeItems.
   * 3. Enviamos Accept-Language: pt-BR.
   * 4. O backend consulta a preferência persistida.
   * 5. response.lang representa o idioma efetivamente determinado.
   *
   * Portanto:
   *
   * requestedLang !== necessariamente response.lang
   */
  @Action(LoadInitialHomeItems)
  loadInitial(
    ctx: StateContext<HomeLanguageStateModel>,
    action: LoadInitialHomeItems,
  ) {
    console.log(
      '[HomeLanguageState] carga inicial:',
      action.lang,
    );

    ctx.patchState({
      pendingLang: action.lang,
      lastAttemptedLang: action.lang,
      loading: true,
      error: null,
    });

    return this.syncAndApply(
      ctx,
      this.homeApi.getHomeItems(action.lang),
      action.lang,

      // Na inicialização NÃO exigimos:
      // response.lang === requestedLang
      false,
    );
  }

  // ---------------------------------------------------------------------------
  // FLUXO 2 — TROCA MANUAL DE IDIOMA
  // ---------------------------------------------------------------------------

  /**
   * Fluxo iniciado pelo dropdown.
   *
   * Regra obrigatória:
   *
   * POST preferência
   *       ↓
   * sucesso
   *       ↓
   * GET Home
   *       ↓
   * valida response.lang
   *       ↓
   * Transloco
   *       ↓
   * commit
   */
  @Action(ChangeLanguage)
  changeLanguage(
    ctx: StateContext<HomeLanguageStateModel>,
    action: ChangeLanguage,
  ) {
    console.log(
      '[HomeLanguageState] troca de idioma:',
      action.lang,
    );

    ctx.patchState({
      pendingLang: action.lang,
      lastAttemptedLang: action.lang,
      loading: true,
      error: null,
    });

    return this.languagePreferenceApi
      .saveLanguagePreference(action.lang)
      .pipe(

        // O GET só acontece depois do sucesso do POST.
        switchMap(() =>
          this.syncAndApply(
            ctx,
            this.homeApi.getHomeItems(
              action.lang,
            ),
            action.lang,

            // Neste fluxo a resposta precisa corresponder
            // ao idioma solicitado.
            true,
          ),
        ),

        catchError((err) => {
          const errorMessage =
            err?.message ??
            'ERRO_DESCONHECIDO';

          console.error(
            '[HomeLanguageState] falha ao salvar preferência ou sincronizar:',
            errorMessage,
          );

          ctx.dispatch(
            new SyncLanguageFailure(
              errorMessage,
            ),
          );

          return throwError(() => err);
        }),
      );
  }

  // ---------------------------------------------------------------------------
  // SUCCESS
  // ---------------------------------------------------------------------------

  @Action(SyncLanguageSuccess)
  syncSuccess(
    ctx: StateContext<HomeLanguageStateModel>,
    action: SyncLanguageSuccess,
  ) {
    ctx.patchState({
      currentLang: action.lang,
      items: action.items,
      pendingLang: null,
      loading: false,
      error: null,
    });
  }

  // ---------------------------------------------------------------------------
  // FAILURE
  // ---------------------------------------------------------------------------

  @Action(SyncLanguageFailure)
  syncFailure(
    ctx: StateContext<HomeLanguageStateModel>,
    action: SyncLanguageFailure,
  ) {
    /**
     * IMPORTANTE:
     *
     * currentLang e items NÃO são alterados.
     *
     * Isso garante que uma troca de idioma malsucedida não destrua
     * a última tela válida.
     */
    ctx.patchState({
      pendingLang: null,
      loading: false,
      error: action.error,
    });
  }

  // ---------------------------------------------------------------------------
  // CLEAR ERROR
  // ---------------------------------------------------------------------------

  @Action(ClearSwitchError)
  clearSwitchError(
    ctx: StateContext<HomeLanguageStateModel>,
  ) {
    ctx.patchState({
      error: null,
    });
  }
}

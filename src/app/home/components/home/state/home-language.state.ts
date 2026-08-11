import { Injectable } from '@angular/core';
import { State, Action, StateContext, Selector } from '@ngxs/store';
import { catchError, tap, throwError, switchMap, map, timeout } from 'rxjs';
import { HomeApiService } from '../services/home-api.service';
import { LanguagePreferenceApiService } from './../services/language-preference-api.service';
import {
  ChangeLanguage,
  SyncLanguageSuccess,
  SyncLanguageFailure,
  LoadInitialHomeItems,
  ClearSwitchError,
} from './home-language.actions';
import {
  HOME_LANGUAGE_STATE_DEFAULTS,
  HomeItemsResponse,
  HomeLanguageStateModel,
  LanguagePreferenceResponse,
} from './../interfaces/home-item.interface';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Idioma padrão da aplicação.
 *
 * Esta constante representa o fallback de negócio:
 *
 * "Se não existir preferência persistida, a Home deve ser
 * carregada em pt-BR."
 */
const DEFAULT_LANGUAGE = 'pt-BR';

@State<HomeLanguageStateModel>({ name: 'homeLanguage', defaults: HOME_LANGUAGE_STATE_DEFAULTS })
@Injectable()
export class HomeLanguageState {
  constructor(
    private homeApi: HomeApiService,
    private languagePreferenceApi: LanguagePreferenceApiService,
    private translocoService: TranslocoService,
  ) {}

  @Selector() static items(state: HomeLanguageStateModel) {
    return state.items;
  }
  @Selector() static loading(state: HomeLanguageStateModel) {
    return state.loading;
  }
  @Selector() static error(state: HomeLanguageStateModel) {
    return state.error;
  }
  @Selector() static currentLang(state: HomeLanguageStateModel) {
    return state.currentLang;
  }

  /**
   * A API não é considerada válida somente porque respondeu HTTP 200.
   *
   * Também precisamos garantir que o conteúdo retornado pertence
   * exatamente ao idioma solicitado.
   *
   * Exemplo:
   *
   * solicitado: en-US
   * recebido:   pt-BR
   *
   * Nesse caso a resposta é rejeitada.
   */
  private validateResponse(response: HomeItemsResponse, requestedLang: string): HomeItemsResponse {
    if (!response.lang?.trim()) {
      throw new Error('PAYLOAD_INVALIDO_LANG_AUSENTE');
    }
    if (response.lang !== requestedLang) {
      throw new Error('PAYLOAD_LANG_DIVERGENTE_DO_SOLICITADO');
    }
    return response;
  }

  // ---------------------------------------------------------------------------
  // PIPELINE HTTP + TRANSLOCO + COMMIT
  // ---------------------------------------------------------------------------

  /**
   * Pipeline compartilhado pela carga inicial e pela troca de idioma.
   *
   * Ordem obrigatória:
   *
   * 1. API responde
   * 2. valida response.lang
   * 3. garante que o Transloco possui o idioma
   * 4. ativa o idioma
   * 5. commita items + currentLang no NGXS
   *
   * Caso qualquer etapa falhe:
   *
   * - idioma atual não é alterado;
   * - cards atuais não são alterados;
   * - erro é armazenado no State.
   */
  private syncAndApply(
    ctx: StateContext<HomeLanguageStateModel>,
    response$: ReturnType<HomeApiService['getHomeItems']>,
    requestedLang: string,
  ) {
    return response$.pipe(
      // -----------------------------------------------------------------------
      // 1. Validação do payload
      // -----------------------------------------------------------------------

      map((response) => this.validateResponse(response, requestedLang)),

      // -----------------------------------------------------------------------
      // 2. Garantir que o Transloco conseguiu carregar o idioma
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
      // 3. Commit atômico
      // -----------------------------------------------------------------------

      tap((response) => {
        /**
         * O idioma somente se torna oficial neste ponto.
         *
         * Antes disso:
         *
         * currentLang = idioma anterior
         *
         * Depois disso:
         *
         * currentLang = idioma novo
         */
        this.translocoService.setActiveLang(response.lang);

        ctx.dispatch(new SyncLanguageSuccess(response.lang, response.items));
      }),

      // -----------------------------------------------------------------------
      // 4. Falha
      // -----------------------------------------------------------------------

      catchError((err) => {
        const message = err?.message ?? 'ERRO_DESCONHECIDO';

        console.error('[HomeLanguageState] falha na sincronização:', message);

        ctx.dispatch(new SyncLanguageFailure(message));

        return throwError(() => err);
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // CARGA INICIAL
  // ---------------------------------------------------------------------------

  /**
   * Fluxo inicial da Home.
   *
   * Regra:
   *
   * GET apiLanguagePreference
   *          ↓
   * preferência encontrada?
   *      ↓          ↓
   *     sim        não
   *      ↓          ↓
   *  preferência   pt-BR
   *      ↓          ↓
   *      └────┬─────┘
   *           ↓
   * GET apiHomeItems
   */
  @Action(LoadInitialHomeItems)
  loadInitial(ctx: StateContext<HomeLanguageStateModel>) {
    console.log('[HomeLanguageState] iniciando carga inicial');

    ctx.patchState({
      pendingLang: null,
      lastAttemptedLang: null,
      loading: true,
      error: null,
    });

    return this.languagePreferenceApi.getLanguagePreference().pipe(
      // ---------------------------------------------------------------------
      // Resolve idioma
      // ---------------------------------------------------------------------

      map((preference: LanguagePreferenceResponse) => {
        const preferenceLang = preference.lang?.trim();

        const resolvedLang = preferenceLang || DEFAULT_LANGUAGE;

        console.log('[HomeLanguageState] preferência recebida:', preferenceLang);

        console.log('[HomeLanguageState] idioma resolvido:', resolvedLang);

        return resolvedLang;
      }),

      // ---------------------------------------------------------------------
      // GET da Home com idioma efetivamente resolvido
      // ---------------------------------------------------------------------

      switchMap((resolvedLang) => {
        ctx.patchState({
          pendingLang: resolvedLang,
          lastAttemptedLang: resolvedLang,
        });

        return this.syncAndApply(ctx, this.homeApi.getHomeItems(resolvedLang), resolvedLang);
      }),

      // ---------------------------------------------------------------------
      // Falha ao consultar a preferência
      // ---------------------------------------------------------------------

      catchError((err) => {
        const message = err?.message ?? 'ERRO_AO_CONSULTAR_PREFERENCIA';

        console.error('[HomeLanguageState] falha ao consultar preferência:', message);

        ctx.dispatch(new SyncLanguageFailure(message));

        return throwError(() => err);
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // TROCA DE IDIOMA
  // ---------------------------------------------------------------------------

  /**
   * Fluxo de troca manual.
   *
   * POST preferência
   *       ↓
   * sucesso?
   *       ↓
   * GET Home
   *       ↓
   * valida
   *       ↓
   * Transloco
   *       ↓
   * commit
   *
   * Se o POST falhar:
   *
   * - não executamos GET Home;
   * - idioma atual continua intacto;
   * - cards atuais continuam intactos.
   */
  @Action(ChangeLanguage)
  changeLanguage(ctx: StateContext<HomeLanguageStateModel>, action: ChangeLanguage) {
    console.log('[HomeLanguageState] troca de idioma solicitada →', action.lang);

    ctx.patchState({
      pendingLang: action.lang,
      lastAttemptedLang: action.lang,
      loading: true,
      error: null,
    });

    return this.languagePreferenceApi.saveLanguagePreference(action.lang).pipe(
      // ---------------------------------------------------------------------
      // POST falhou
      // ---------------------------------------------------------------------

      catchError((err) => {
        const message = err?.message ?? 'ERRO_AO_SALVAR_PREFERENCIA';

        console.error('[HomeLanguageState] falha ao salvar preferência:', message);

        ctx.dispatch(new SyncLanguageFailure(message));

        return throwError(() => err);
      }),

      // ---------------------------------------------------------------------
      // POST sucesso → somente então GET Home
      // ---------------------------------------------------------------------

      switchMap(() => this.syncAndApply(ctx, this.homeApi.getHomeItems(action.lang), action.lang)),
    );
  }

  // ---------------------------------------------------------------------------
  // COMMIT DE SUCESSO
  // ---------------------------------------------------------------------------

  @Action(SyncLanguageSuccess)
  syncSuccess(ctx: StateContext<HomeLanguageStateModel>, action: SyncLanguageSuccess) {
    ctx.patchState({
      currentLang: action.lang,

      items: action.items,

      pendingLang: null,

      loading: false,

      error: null,
    });
  }

  // ---------------------------------------------------------------------------
  // COMMIT DE FALHA
  // ---------------------------------------------------------------------------

  @Action(SyncLanguageFailure)
  syncFailure(ctx: StateContext<HomeLanguageStateModel>, action: SyncLanguageFailure) {
    /**
     * Muito importante:
     *
     * NÃO alteramos:
     *
     * currentLang
     * items
     *
     * Portanto, se o usuário já tinha uma Home válida e a troca
     * falhar, a tela permanece no idioma anterior.
     */
    ctx.patchState({
      pendingLang: null,

      loading: false,

      error: action.error,
    });
  }

  // ---------------------------------------------------------------------------
  // LIMPA ERRO DO TOAST
  // ---------------------------------------------------------------------------

  @Action(ClearSwitchError)
  clearSwitchError(ctx: StateContext<HomeLanguageStateModel>) {
    ctx.patchState({
      error: null,
    });
  }
}

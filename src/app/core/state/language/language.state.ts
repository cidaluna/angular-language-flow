import { Injectable, inject } from '@angular/core';
import { State, Action, StateContext } from '@ngxs/store';
import { TranslocoService } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { BootstrapApplication, UserRequestedLanguageChange, ForceFetchTranslatedData } from './language.actions';
import { LanguageStateModel, AppLanguage } from './language.model';
import { SetGlobalLoading } from '../loading/loading.actions';
import { HomeApiService } from '../../../features/home/data-access/home-api.service';

@State<LanguageStateModel>({
  name: 'language',
  defaults: {
    activeLanguage: 'pt-BR', // Bootstrap padrão exigido pelo negócio
    apiData: [],
    hasError: false,
    isReady: false
  }
})
@Injectable()
export class LanguageState {
  private readonly homeApiService = inject(HomeApiService);
  private readonly translocoService = inject(TranslocoService);

  @Action(BootstrapApplication)
  async bootstrapApplication(ctx: StateContext<LanguageStateModel>): Promise<void> {
    // Configura o transloco para iniciar síncronamente com o idioma básico de bootstrap
    const currentLang = ctx.getState().activeLanguage;
    this.translocoService.setActiveLang(currentLang);

    // Encaminha a execução para a ação interna que lida com o I/O de rede
    await ctx.dispatch(new ForceFetchTranslatedData()).toPromise();
  }

  @Action(UserRequestedLanguageChange)
  async userRequestedLanguageChange(ctx: StateContext<LanguageStateModel>, action: UserRequestedLanguageChange): Promise<void> {
    // Atualiza o estado da linguagem pretendida temporariamente antes do disparo HTTP
    ctx.patchState({ activeLanguage: action.requestedLanguage });

    // Executa a busca forçada com o novo idioma injetado automaticamente via interceptor
    await ctx.dispatch(new ForceFetchTranslatedData()).toPromise();
  }

  @Action(ForceFetchTranslatedData)
  async forceFetchTranslatedData(ctx: StateContext<LanguageStateModel>): Promise<void> {
    // Dispara a subida do Loader de forma síncrona
    ctx.dispatch(new SetGlobalLoading(true));
    ctx.patchState({ hasError: false });

    try {
      // Executa o I/O assíncrono convertendo a Stream do RxJS em Promise atômica
      const response = await firstValueFrom(this.homeApiService.getHomeData());

      // Carrega os arquivos estáticos de tradução do Transloco antes de liberar a UI
      // Isso impede que textos estáticos pisquem no idioma antigo
      await firstValueFrom(this.translocoService.load(response.language));

      // 💡 JUSTIFICATIVA ARQUITETURAL: patchState ÚNICO E ATÔMICO
      // Modifica dados, idioma oficial e flags de visualização em um único ciclo de processamento da CPU.
      // Impede de forma definitiva estados inconsistentes (dados novos com idioma antigo ou vice-versa).
      ctx.patchState({
        activeLanguage: response.language as AppLanguage,
        apiData: response.items,
        isReady: true,
        hasError: false
      });

      // Sincroniza a instância em execução do Transloco para renderizar as chaves estáticas do novo idioma
      this.translocoService.setActiveLang(response.language);

    } catch (error) {
      // Preserva o estado estável anterior e sinaliza erro para exibição da tela de Retry
      ctx.patchState({ hasError: true });
    } finally {
      // Remove o Loader de tela independente de sucesso ou falha da transação corporativa
      ctx.dispatch(new SetGlobalLoading(false));
    }
  }
}
export type { LanguageStateModel };

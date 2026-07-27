import { Injectable } from "@angular/core";
import { Action, Selector, State, StateContext } from "@ngxs/store";

// 1. Definição das Ações
export class ShowLoader {
  static readonly type = '[Loader] Show';
}

export class HideLoader {
  static readonly type = '[Loader] Hide';
}

// 2. Interface
// export interface LoaderStateModel {
//   isLoading: boolean;
// }
export interface LoaderStateModel {
  activeRequests: number;
}

@State<LoaderStateModel>({
  name: 'loader',
  defaults: { activeRequests: 0 }
})
@Injectable()
export class LoaderState {
  // Seletor reativo para os componentes escutarem o estado
  // O overlay só some quando NENHUMA requisição em andamento restar — não quando "a última" terminar
  @Selector()
  static isLoading(state: LoaderStateModel): boolean {
    console.log(":: [Loader State] com state: ", state);
    return state.activeRequests > 0;
  }

  @Action(ShowLoader)
  show(ctx: StateContext<LoaderStateModel>){
    const state = ctx.getState();
    ctx.patchState({ activeRequests: state.activeRequests + 1 });
  }

  @Action(HideLoader)
  hide(ctx: StateContext<LoaderStateModel>){
    const state = ctx.getState();
    ctx.patchState({ activeRequests: Math.max(0, state.activeRequests - 1) });
  }
}

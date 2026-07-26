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
export interface LoaderStateModel {
  isLoading: boolean;
}

@State<LoaderStateModel>({
  name: 'loader',
  defaults: { isLoading: false }
})
@Injectable()
export class LoaderState {
  // Seletor reativo para os componentes escutarem o estado
  @Selector()
  static isLoading(state: LoaderStateModel): boolean {
    console.log(":: [Loader State] com state: ", state);
    return state.isLoading;
  }

  @Action(ShowLoader)
  show(ctx: StateContext<LoaderStateModel>){
    ctx.patchState({ isLoading: true });
  }

  @Action(HideLoader)
  hide(ctx: StateContext<LoaderStateModel>){
    ctx.patchState({ isLoading: false });
  }
}

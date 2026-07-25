import { Injectable } from '@angular/core';
import { State, Action, StateContext } from '@ngxs/store';
import { SetGlobalLoading } from './loading.actions';
import { LoadingStateModel } from './loading.model';

@State<LoadingStateModel>({
  name: 'loading',
  defaults: {
    globalLoading: false
  }
})
@Injectable()
export class LoadingState {
  @Action(SetGlobalLoading)
  setGlobalLoading(ctx: StateContext<LoadingStateModel>, action: SetGlobalLoading): void {
    ctx.patchState({ globalLoading: action.isLoading });
  }
}
export type { LoadingStateModel };

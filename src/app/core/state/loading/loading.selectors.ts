import { Selector } from '@ngxs/store';
import { LoadingState, LoadingStateModel } from './loading.state';

export class LoadingSelectors {
  @Selector([LoadingState])
  static isGlobalLoading(state: LoadingStateModel): boolean {
    return state.globalLoading;
  }
}

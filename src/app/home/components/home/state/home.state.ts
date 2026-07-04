/**
 * EXEMPLO ilustrativo do estado da feature Home em NgXs. Diferente do
 * idioma, os itens da Home só interessam a esta feature — por isso o
 * state fica dentro de features/home/state, registrado via
 * NgxsModule.forFeature() nas rotas da própria feature, e não em
 * core/store.
 *
 * Não está plugado no app.config.ts — hoje o projeto usa signals no
 * HomeDataService.
 */
// import { Injectable } from '@angular/core';
// import { State, Action, StateContext, Selector } from '@ngxs/store';
// import { HomeItem } from '../models/home-item.interface';
//
// export class LoadHomeItems {
//   static readonly type = '[Home] Load items';
// }
//
// export interface HomeStateModel {
//   items: HomeItem[];
//   loading: boolean;
//   error: boolean;
// }
//
// @State<HomeStateModel>({
//   name: 'home',
//   defaults: { items: [], loading: false, error: false },
// })
// @Injectable()
// export class HomeState {
//   @Selector()
//   static items(state: HomeStateModel): HomeItem[] {
//     return state.items;
//   }
// }

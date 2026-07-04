/**
 * EXEMPLO ilustrativo de como o LanguageService ficaria se um dia vocês
 * migrarem de signals para NgXs. Não está plugado no app.config.ts —
 * hoje o projeto usa signals, que já resolvem bem esse caso.
 *
 * Idioma é candidato a ficar em core/store (e não numa feature) porque é
 * um conceito global: qualquer feature futura pode precisar ler o idioma
 * ativo, não só a Home.
 *
 * npm install @ngxs/store
 */
// import { Injectable } from '@angular/core';
// import { State, Action, StateContext, Selector } from '@ngxs/store';
// import { AppLanguage, DEFAULT_LANGUAGE } from '../models/language.type';
//
// export class SetLanguage {
//   static readonly type = '[Language] Set';
//   constructor(public lang: AppLanguage) {}
// }
//
// export interface LanguageStateModel {
//   activeLang: AppLanguage;
// }
//
// @State<LanguageStateModel>({
//   name: 'language',
//   defaults: { activeLang: DEFAULT_LANGUAGE },
// })
// @Injectable()
// export class LanguageState {
//   @Selector()
//   static activeLang(state: LanguageStateModel): AppLanguage {
//     return state.activeLang;
//   }
//
//   @Action(SetLanguage)
//   setLanguage(ctx: StateContext<LanguageStateModel>, action: SetLanguage) {
//     ctx.patchState({ activeLang: action.lang });
//   }
// }

import 'zone.js/dist/zone'; //  Sintaxe explícita para evitar o erro ts(2882) // 🚀 OBRIGATÓRIO: Inicializa o contexto de execução para o Angular e NGXS
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

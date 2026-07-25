import { Component } from '@angular/core';
import { HomeComponent } from './features/home/components/home.component';
import { GlobalLoaderComponent } from './shared/components/global-loader/global-loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HomeComponent, GlobalLoaderComponent],
  template: `
    <!-- O Loader Global fica permanentemente injetado escutando alterações reativas do Store -->
    <app-global-loader />

    <!-- Renderiza a view da feature principal -->
    <app-home />
  `
})
export class AppComponent {}

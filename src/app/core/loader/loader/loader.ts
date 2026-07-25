import { Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { LoaderState } from '../loader.state';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loader.html',
  styleUrl: './loader.scss',
})
export class Loader {
  private store = inject(Store);

  // Seleciona o estado reativo do NGXS transformando-o em um Signal nativo
  protected isLoading = this.store.selectSignal(LoaderState.isLoading);
}

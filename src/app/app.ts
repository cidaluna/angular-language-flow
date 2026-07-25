import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { Loader } from './core/loader/loader/loader';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Loader],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('angular-language-flow');
}

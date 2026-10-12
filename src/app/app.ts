import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './layout/header/header';
import { TourGuide } from './shared/components/tour-guide/tour-guide';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, TourGuide],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('angular-language-flow');
}


import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard.component';
import { HistoryComponent } from './components/history.component';
import { BacktestComponent } from './components/backtest.component';
import { SimulationComponent } from './components/simulation.component';

type View = 'dashboard' | 'history' | 'backtest' | 'simulation';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent, HistoryComponent, BacktestComponent, SimulationComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  currentView = signal<View>('dashboard');
}

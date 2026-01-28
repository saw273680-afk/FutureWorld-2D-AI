
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './components/dashboard.component';
import { HistoryComponent } from './components/history.component';
import { BacktestComponent } from './components/backtest.component';
import { SimulationComponent } from './components/simulation.component';
import { SettingsComponent } from './components/settings.component';
import { AiChatComponent } from './components/ai-chat.component';

type View = 'dashboard' | 'history' | 'backtest' | 'simulation' | 'settings' | 'ai-chat';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DashboardComponent, HistoryComponent, BacktestComponent, SimulationComponent, SettingsComponent, AiChatComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  currentView = signal<View>('dashboard');
}

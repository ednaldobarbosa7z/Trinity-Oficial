import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="app-footer">
      <p>🎬 trinity &copy; 2026 - <span class="badge-beta">VERSÃO BETA</span></p>
    </footer>
  `,
  styles: [`
    .app-footer {
      background-color: #1e1e1e;
      color: #777;
      text-align: center;
      padding: 1.5rem;
      border-top: 1px solid #333;
      margin-top: auto; /* Empurra para baixo se usar flex */
      width: 100%;
    }
    .badge-beta {
      color: #ffc107;
      font-weight: bold;
      font-size: 0.8rem;
      border: 1px solid #ffc107;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 5px;
    }
  `]
})
export class FooterComponent { }
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppShellComponent } from '@shared/components/app-shell/app-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, AppShellComponent],
  template: `
    <app-shell class="h-full flex flex-col"></app-shell>
  `
})
export class AppComponent {}

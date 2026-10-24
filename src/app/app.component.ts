import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from 'src/app/components/toast-container/toast-container.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, ToastContainerComponent],
    templateUrl: './app.component.html'
})
export class AppComponent {
  title = 'TailwindAdmin Angular Admin Tempplate';
}

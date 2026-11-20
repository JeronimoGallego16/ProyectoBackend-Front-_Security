import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Informs authenticated users that they are not authorized to open a page.
 */
@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss'],
})
export class AccessDeniedComponent {}

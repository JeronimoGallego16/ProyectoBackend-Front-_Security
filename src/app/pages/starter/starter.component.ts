import { Component, ViewEncapsulation } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { AppTopCardsComponent } from 'src/app/components/top-cards/top-cards.component';
import { AppTopProjectsComponent } from 'src/app/components/top-projects/top-projects.component';

@Component({
  selector: 'app-starter',
  imports: [
    MaterialModule,
    AppTopCardsComponent,
    AppTopProjectsComponent
  ],
  templateUrl: './starter.component.html',
  encapsulation: ViewEncapsulation.None,
})
export class StarterComponent { }

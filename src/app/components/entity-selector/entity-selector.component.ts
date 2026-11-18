import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * Describes an entity option displayed by the shared selector.
 */
export interface EntitySelectorOption {
  /** Stable identifier emitted when the option is selected. */
  id: number | string;
  /** Primary label displayed for the entity. */
  label: string;
  /** Optional secondary information displayed below the label. */
  description?: string;
}

/**
 * Displays a selectable list of entities with a heading and empty state.
 */
@Component({
  selector: 'app-entity-selector',
  standalone: true,
  templateUrl: './entity-selector.component.html',
  styleUrls: ['./entity-selector.component.scss'],
})
export class EntitySelectorComponent {
  /** Heading displayed above the entity options. */
  @Input() public title = '';

  /** Entities available for selection. */
  @Input() public options: ReadonlyArray<EntitySelectorOption> = [];

  /** Identifier of the currently selected entity. */
  @Input() public selectedId: number | string | null = null;

  /** Message displayed when there are no entities to select. */
  @Input() public emptyMessage = 'No items available';

  /** Emits the identifier of the entity selected by the user. */
  @Output() public selectionChange = new EventEmitter<number | string>();
}

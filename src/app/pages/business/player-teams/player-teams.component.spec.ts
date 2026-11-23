import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { PlayerService } from 'src/app/services/business/player.service';
import { PlayerTeamService } from 'src/app/services/business/player-team.service';
import { TeamService } from 'src/app/services/business/team.service';
import { PlayerTeam } from 'src/app/models/business/player-team.model';
import { FeedbackCase } from 'src/app/models/feedback-case';
import { PlayerTeamsComponent } from './player-teams.component';

function dateOffset(offset: number): string {
  return new Date(Date.now() + offset * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function localDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function createComponent(
  playerTeamService: Partial<PlayerTeamService> = {},
  feedback: Partial<FeedbackHandlerService> = {},
): PlayerTeamsComponent {
  const route = {
    snapshot: {
      data: { context: 'team' },
      paramMap: { get: () => '12' },
    },
  } as unknown as ActivatedRoute;

  return new PlayerTeamsComponent(
    route,
    new FormBuilder(),
    {} as unknown as PlayerService,
    {} as unknown as TeamService,
    playerTeamService as PlayerTeamService,
    feedback as FeedbackHandlerService,
  );
}

describe('PlayerTeamsComponent retirement', () => {
  it('distinguishes a future retirement date from an effective retirement', () => {
    const assignment: PlayerTeam = {
      playerTeamId: 7,
      playerId: 4,
      teamId: 12,
      startDate: dateOffset(-2),
      endDate: null,
      playerName: 'Player',
      teamName: 'Team',
    };
    const retire = jasmine.createSpy().and.returnValue(of(assignment));
    const success = jasmine.createSpy();
    const component = createComponent({ retire }, { success });
    spyOn(component, 'loadData');

    component.pendingRetirement = assignment;
    component.retirementForm.setValue({ endDate: dateOffset(2) });
    component.retirePlayer();
    expect(success).toHaveBeenCalledWith(
      FeedbackCase.OK,
      `Retirement date updated to ${dateOffset(2)}. The player remains on the team until then.`,
    );

    component.pendingRetirement = assignment;
    component.retirementForm.setValue({ endDate: dateOffset(0) });
    component.retirePlayer();
    expect(success).toHaveBeenCalledWith(
      FeedbackCase.OK,
      'Player retired from the team.',
    );
  });

  it('shows retirement for current links and bounds the date by the contract', () => {
    const component = createComponent();
    const currentWithEndDate: PlayerTeam = {
      playerTeamId: 1,
      playerId: 4,
      teamId: 12,
      startDate: dateOffset(-5),
      endDate: dateOffset(5),
      playerName: 'Current Player',
      teamName: 'Current Team',
    };
    const ended: PlayerTeam = {
      playerTeamId: 2,
      playerId: 5,
      teamId: 12,
      startDate: dateOffset(-5),
      endDate: dateOffset(-1),
      playerName: 'Former Player',
      teamName: 'Current Team',
    };
    const notStarted: PlayerTeam = {
      playerTeamId: 3,
      playerId: 6,
      teamId: 12,
      startDate: dateOffset(1),
      endDate: dateOffset(5),
      playerName: 'Future Player',
      teamName: 'Current Team',
    };

    expect(component.actions[0].visible?.(currentWithEndDate)).toBe(true);
    expect(component.actions[0].visible?.(ended)).toBe(false);
    expect(component.actions[0].visible?.(notStarted)).toBe(false);
    expect(component.actions[1].visible?.(currentWithEndDate)).toBe(false);
    expect(component.actions[1].visible?.(ended)).toBe(false);
    expect(component.actions[1].visible?.(notStarted)).toBe(true);

    component.assignments = [currentWithEndDate, ended, notStarted];
    expect(component.assignmentRows.map((row) => row.status)).toEqual([
      'Current',
      'History',
      'Scheduled',
    ]);

    component.pendingRetirement = currentWithEndDate;
    expect(component.retirementFields[0].min).toEqual(
      localDate(currentWithEndDate.startDate),
    );
    expect(component.retirementFields[0].max).toEqual(
      localDate(currentWithEndDate.endDate!),
    );
  });

  it('requires confirmation before deleting the selected scheduled assignment', () => {
    const deleteScheduled = jasmine.createSpy().and.returnValue(of(undefined));
    const success = jasmine.createSpy();
    const component = createComponent({ deleteScheduled }, { success });
    spyOn(component, 'loadData');
    component.assignments = [{
      playerTeamId: 7,
      playerId: 4,
      teamId: 12,
      startDate: dateOffset(2),
      endDate: null,
      playerName: 'Player',
      teamName: 'Team',
    }];

    component.onCustomAction({
      action: 'Delete scheduled assignment',
      row: component.assignmentRows[0],
    });
    expect(deleteScheduled).not.toHaveBeenCalled();
    expect(component.pendingScheduledDeletion?.playerTeamId).toBe(7);

    component.deleteScheduledAssignment();
    expect(deleteScheduled).toHaveBeenCalledOnceWith(7);
    expect(component.pendingScheduledDeletion).toBeNull();
    expect(component.loadData).toHaveBeenCalled();
    expect(success).toHaveBeenCalled();
  });

  it('displays backend errors and keeps the confirmation open', () => {
    const deleteScheduled = jasmine.createSpy().and.returnValue(
      throwError(() => ({ status: 404, error: { message: 'Scheduled assignment not found' } })),
    );
    const error = jasmine.createSpy();
    const component = createComponent({ deleteScheduled }, { error });
    component.pendingScheduledDeletion = {
      playerTeamId: 7,
      playerId: 4,
      teamId: 12,
      startDate: dateOffset(2),
      endDate: null,
      playerName: 'Player',
      teamName: 'Team',
    };

    component.deleteScheduledAssignment();
    expect(error).toHaveBeenCalledWith('404', 'Scheduled assignment not found');
    expect(component.pendingScheduledDeletion?.playerTeamId).toBe(7);
  });
});

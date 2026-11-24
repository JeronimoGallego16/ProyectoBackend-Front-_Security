import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { MatchService } from 'src/app/services/business/match.service';
import { TeamService } from 'src/app/services/business/team.service';
import { TeamSportService } from 'src/app/services/business/team-sport.service';
import { FeedbackHandlerService } from 'src/app/services/feedback-handler.service';
import { PhaseService } from 'src/app/services/phase.service';
import { TournamentService } from 'src/app/services/tournament.service';
import { MatchesComponent } from './matches.component';

describe('MatchesComponent bracket team options', () => {
  it('limits local and visitor choices to the corresponding qualifiers', () => {
    const teams = [
      { teamId: 1, name: 'Team 1', category: 'Senior' },
      { teamId: 2, name: 'Team 2', category: 'Senior' },
      { teamId: 3, name: 'Team 3', category: 'Senior' },
      { teamId: 4, name: 'Team 4', category: 'Senior' },
    ];
    const phases = [
      {
        phaseId: 20,
        name: 'Semifinals',
        order: 2,
        tournamentId: 10,
        type: 'FINAL',
        isThirdPlace: false,
        expectedMatchCount: 2,
      },
      {
        phaseId: 21,
        name: 'Final',
        order: 3,
        tournamentId: 10,
        type: 'FINAL',
        isThirdPlace: true,
        expectedMatchCount: 1,
      },
    ];
    const matches = [
      {
        matchId: 1,
        phaseId: 20,
        bracketPosition: 1,
        homeTeamId: 1,
        awayTeamId: 2,
        homeScore: 3,
        awayScore: 1,
        state: 'FINISHED',
        resultRegistered: true,
        duration: '90 minutes',
      },
      {
        matchId: 2,
        phaseId: 20,
        bracketPosition: 2,
        homeTeamId: 3,
        awayTeamId: 4,
        homeScore: 1,
        awayScore: 2,
        state: 'FINISHED',
        resultRegistered: true,
        duration: '90 minutes',
      },
    ];
    const component = new MatchesComponent(
      new FormBuilder(),
      { findAll: () => of(matches) } as unknown as MatchService,
      { findAll: () => of(teams) } as unknown as TeamService,
      {
        findAll: () =>
          of(
            teams.map((team, index) => ({
              teamSportId: index + 1,
              teamId: team.teamId,
              sportId: 5,
            }))
          ),
      } as unknown as TeamSportService,
      {
        findAll: () =>
          of([
            {
              tournamentId: 10,
              name: 'Cup',
              sportId: 5,
              modality: 'League',
              startDate: '2026-10-01',
              endDate: '2026-10-30',
              status: 'OPEN',
              capacity: 8,
            },
          ]),
      } as unknown as TournamentService,
      {
        findByTournament: () => of(phases),
      } as unknown as PhaseService,
      {} as FeedbackHandlerService,
      {} as unknown as Router
    );

    component.ngOnInit();
    component.onCreateClick();
    component.matchForm.patchValue({
      phaseId: 21,
      bracketPosition: '1',
    });

    const homeField = component.fields.find(
      (field) => field.name === 'homeTeamId'
    );
    const awayField = component.fields.find(
      (field) => field.name === 'awayTeamId'
    );
    expect(homeField?.options?.map((option) => option.value)).toEqual([1]);
    expect(awayField?.options?.map((option) => option.value)).toEqual([4]);

    component.matchForm.get('isThirdPlace')?.setValue(true);

    expect(homeField?.options?.map((option) => option.value)).toEqual([2]);
    expect(awayField?.options?.map((option) => option.value)).toEqual([3]);
  });
});

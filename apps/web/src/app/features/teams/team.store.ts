import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  addEntity,
  removeEntity,
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { TeamMember, Invitation, BoardRole } from '@taskflow/shared-types';
import { pipe, switchMap, tap } from 'rxjs';
import { TeamService } from './team.service';

interface TeamState {
  invitations: Invitation[];
  selectedBoardId: string | null;
  generatedLink: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TeamState = {
  invitations: [],
  selectedBoardId: null,
  generatedLink: null,
  isLoading: false,
  error: null,
};

export const TeamStore = signalStore(
  { providedIn: 'root' },
  withEntities<TeamMember>(),
  withState(initialState),
  withComputed(({ entities }) => ({
    memberCount: computed(() => entities().length),
    hasMembers: computed(() => entities().length > 0),

    // Group members by role
    owners: computed(() => entities().filter((m) => m.role === 'OWNER')),
    admins: computed(() => entities().filter((m) => m.role === 'ADMIN')),
    members: computed(() => entities().filter((m) => m.role === 'MEMBER')),

    // Grouped members for display
    membersByRole: computed(() => {
      const all = entities();
      return {
        owners: all.filter((m) => m.role === 'OWNER'),
        admins: all.filter((m) => m.role === 'ADMIN'),
        members: all.filter((m) => m.role === 'MEMBER'),
      };
    }),
  })),
  withMethods((store, teamService = inject(TeamService)) => ({
    // Set board context
    setBoardId(boardId: string): void {
      patchState(store, { selectedBoardId: boardId, generatedLink: null });
    },

    // Clear generated link
    clearGeneratedLink(): void {
      patchState(store, { generatedLink: null });
    },

    // Clear error
    clearError(): void {
      patchState(store, { error: null });
    },

    // Load team members
    loadMembers: rxMethod<string>(
      pipe(
        tap((boardId) => patchState(store, { isLoading: true, error: null, selectedBoardId: boardId })),
        switchMap((boardId) =>
          teamService.getMembers(boardId).pipe(
            tapResponse({
              next: (members) => patchState(store, setAllEntities(members), { isLoading: false }),
              error: (err: Error) => patchState(store, { error: err.message, isLoading: false }),
            })
          )
        )
      )
    ),

    // Load invitations
    loadInvitations: rxMethod<string>(
      pipe(
        switchMap((boardId) =>
          teamService.getBoardInvitations(boardId).pipe(
            tapResponse({
              next: (invitations) => patchState(store, { invitations }),
              error: (err: Error) => patchState(store, { error: err.message }),
            })
          )
        )
      )
    ),

    // Create email invitation
    inviteByEmail: rxMethod<{ boardId: string; email: string; role: BoardRole }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ boardId, email, role }) =>
          teamService.createEmailInvitation(boardId, email, role).pipe(
            tapResponse({
              next: (invitation) =>
                patchState(store, (state) => ({
                  invitations: [...state.invitations, invitation],
                  isLoading: false,
                })),
              error: (err: Error) => patchState(store, { error: err.message, isLoading: false }),
            })
          )
        )
      )
    ),

    // Create shareable link invitation
    createInviteLink: rxMethod<{ boardId: string; role: BoardRole }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null, generatedLink: null })),
        switchMap(({ boardId, role }) =>
          teamService.createLinkInvitation(boardId, role).pipe(
            tapResponse({
              next: (invitation) => {
                const link = `${window.location.origin}/invite/${invitation.token}`;
                patchState(store, (state) => ({
                  invitations: [...state.invitations, invitation],
                  generatedLink: link,
                  isLoading: false,
                }));
              },
              error: (err: Error) => patchState(store, { error: err.message, isLoading: false }),
            })
          )
        )
      )
    ),

    // Update member role
    updateMemberRole: rxMethod<{ memberId: string; role: BoardRole }>(
      pipe(
        tap(() => patchState(store, { error: null })),
        switchMap(({ memberId, role }) =>
          teamService.updateRole(memberId, role).pipe(
            tapResponse({
              next: (updated) => patchState(store, updateEntity({ id: updated.id, changes: updated })),
              error: (err: Error) => patchState(store, { error: err.message }),
            })
          )
        )
      )
    ),

    // Remove member
    removeMember: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { error: null })),
        switchMap((memberId) =>
          teamService.removeMember(memberId).pipe(
            tapResponse({
              next: () => patchState(store, removeEntity(memberId)),
              error: (err: Error) => patchState(store, { error: err.message }),
            })
          )
        )
      )
    ),

    // Revoke invitation
    revokeInvitation: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { error: null })),
        switchMap((invitationId) =>
          teamService.revokeInvitation(invitationId).pipe(
            tapResponse({
              next: () =>
                patchState(store, (state) => ({
                  invitations: state.invitations.filter((i) => i.id !== invitationId),
                })),
              error: (err: Error) => patchState(store, { error: err.message }),
            })
          )
        )
      )
    ),

    // Accept invitation (for joining a board)
    acceptInvitation: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((token) =>
          teamService.acceptInvitation(token).pipe(
            tapResponse({
              next: (response) => {
                patchState(store, addEntity(response.teamMember), { isLoading: false });
              },
              error: (err: Error) => patchState(store, { error: err.message, isLoading: false }),
            })
          )
        )
      )
    ),
  }))
);

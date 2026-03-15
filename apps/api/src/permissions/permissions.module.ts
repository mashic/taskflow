import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { BoardPermissionGuard } from './permissions.guard';
import { OwnerPermissionStrategy } from './strategies/owner-permission.strategy';
import { AdminPermissionStrategy } from './strategies/admin-permission.strategy';
import { MemberPermissionStrategy } from './strategies/member-permission.strategy';
import { TeamsModule } from '../teams/teams.module';
import { BoardsModule } from '../boards/boards.module';
import { ListsModule } from '../lists/lists.module';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * Permissions Module
 * 
 * Provides role-based access control (RBAC) using Strategy pattern.
 * Each role (Owner, Admin, Member) has its own permission strategy.
 */
@Module({
  imports: [
    TeamsModule,
    BoardsModule,
    ListsModule,
    PrismaModule,
  ],
  providers: [
    // Permission strategies (one per role)
    OwnerPermissionStrategy,
    AdminPermissionStrategy,
    MemberPermissionStrategy,
    // Service that uses strategy map
    PermissionsService,
    // Guard that enforces permissions
    BoardPermissionGuard,
  ],
  exports: [
    PermissionsService,
    BoardPermissionGuard,
  ],
})
export class PermissionsModule {}

import { BoardRole } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateEmailInvitationDto {
  @IsString()
  @IsNotEmpty()
  boardId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(BoardRole)
  role: BoardRole;
}

export class CreateLinkInvitationDto {
  @IsString()
  @IsNotEmpty()
  boardId: string;

  @IsEnum(BoardRole)
  role: BoardRole;
}

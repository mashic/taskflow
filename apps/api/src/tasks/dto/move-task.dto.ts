import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class MoveTaskDto {
  @IsString()
  @IsNotEmpty()
  listId: string;

  @IsNumber()
  position: number;
}

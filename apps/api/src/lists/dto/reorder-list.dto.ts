import { IsNumber } from 'class-validator';

export class ReorderListDto {
  @IsNumber()
  position: number;
}

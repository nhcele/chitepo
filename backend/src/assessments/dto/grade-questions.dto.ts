import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDefined, IsUUID, ValidateNested } from 'class-validator';

export class GradeItemDto {
  @IsUUID()
  questionId: string;

  @IsDefined()
  answer: string | number;
}

export class GradeQuestionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => GradeItemDto)
  items: GradeItemDto[];
}

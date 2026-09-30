import { IsString, IsNotEmpty } from 'class-validator';

export class SubmitKnowledgeCheckAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsNotEmpty()
  answer: string | number;
}

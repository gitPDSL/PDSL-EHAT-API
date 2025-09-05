import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProjectUserDto } from './create-project-user.dto';
export class UpdateProjectUserDto extends PartialType(OmitType(CreateProjectUserDto, [])) { }
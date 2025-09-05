import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTimesheetStatusDto } from './create-timesheet-status.dto';
export class UpdateTimesheetStatusDto extends PartialType(OmitType(CreateTimesheetStatusDto, [])) { }
import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "src/modules/users/dto/user.dto";

export class RegisterUserDto extends PartialType(CreateUserDto,) { } 
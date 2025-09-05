import { ApiProperty } from "@nestjs/swagger";
export class MetaDto {
    @ApiProperty()
    static: string;
    @ApiProperty()
    timestamp: Date;
}
export class ApiResponseDto<T> {
    @ApiProperty()
    meta: MetaDto;
    @ApiProperty()
    data: T;
}
export class MetaErrorDto {
    @ApiProperty({ example: false })
    success: boolean;

    @ApiProperty({ example: 'Validation failed' })
    message: string;

    @ApiProperty({ example: null })
    data: any;

    @ApiProperty({ example: '/users' })
    path: string;

    @ApiProperty({ example: '2025-08-22T08:10:00.000Z' })
    timestamp: string;
}

export class ErrorResponseDto {
    @ApiProperty()
    meta: MetaErrorDto;
}
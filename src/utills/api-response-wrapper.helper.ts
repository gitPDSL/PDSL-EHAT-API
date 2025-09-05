import { applyDecorators, Type } from '@nestjs/common';
import { ApiBadRequestResponse, ApiExtraModels, ApiInternalServerErrorResponse, ApiOkResponse, ApiUnauthorizedResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto, ErrorResponseDto } from './api-response.dto';

export const ApiResponseWrapper = <TModel extends Type<any>>(model: TModel, isArray: boolean = false) => {
    return applyDecorators(
        ApiExtraModels(ApiResponseDto, ErrorResponseDto, model),
        ApiOkResponse({
            schema: {
                allOf: [
                    { $ref: getSchemaPath(ApiResponseDto) },
                    {
                        properties: {
                            data: isArray
                                ? { type: 'array', items: { $ref: getSchemaPath(model) } }
                                : { $ref: getSchemaPath(model) },
                        },
                    },
                ],
            },
        }),
        ApiBadRequestResponse({ schema: { $ref: getSchemaPath(ErrorResponseDto) } }),
        ApiUnauthorizedResponse({ schema: { $ref: getSchemaPath(ErrorResponseDto) } }),
        ApiInternalServerErrorResponse({
            schema: { $ref: getSchemaPath(ErrorResponseDto) },
        }),
    );
};

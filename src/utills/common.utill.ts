import { MoreThanOrEqual, MoreThan, LessThanOrEqual, LessThan, In, Not } from "typeorm";

export const QueryTransformTypeorm = (query: Record<string, any>, acc: any = null) => {
    acc = acc || query;
    Object.keys(query).forEach((key) => {
        if (query[key].includes('||'))
            acc[key] = query[key].split('||');
        else if (query[key].includes(','))
            acc[key] = In(query[key].split(','));
        else if (query[key].includes('>='))
            acc[key] = MoreThanOrEqual(Number(query[key].replace('>=', '')));
        else if (query[key].includes('>'))
            acc[key] = MoreThan(Number(query[key].replace('>', '')));
        else if (query[key].includes('<='))
            acc[key] = LessThanOrEqual(Number(query[key].replace('<=', '')));
        else if (query[key].includes('<'))
            acc[key] = LessThan(Number(query[key].replace('<', '')));
        else if (query[key].includes('!'))
            query[key] = Not(query[key].replace('!', ''));
        else
            acc[key] = query[key];
        return key;
    })
    return acc;
}
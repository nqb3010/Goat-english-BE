import _ from "lodash";

export const getInfoData = <T extends object>(
    { fields, data }: { fields: (keyof T)[], data: T | T[] }
): Partial<T> | Partial<T>[] => {
    if (!Array.isArray(fields) || fields.length === 0) {
        throw new Error("fields phải là một mảng và không được rỗng!");
    }
    if (Array.isArray(data)) {
        return data.map(item => _.pick(item, fields));
    }
    return _.pick(data, fields);
};

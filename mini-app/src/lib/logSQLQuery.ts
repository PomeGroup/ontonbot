import {Query} from 'drizzle-orm'; // Adjust the import based on your ORM
import {sql} from "drizzle-orm";

type SQLParams = unknown[];
//usage of logSQLQuery
//   // Get the SQL string and parameters
//   const { sql: sqlString, params:paraSql } = query.toSQL();
//   logSQLQuery( sqlString, paraSql);
export const logSQLQuery = (sql: string, params: SQLParams): void => {
    const fullQuery = sql.replace(/\$(\d+)/g, (substring: string, index: string): string => {
        const paramIndex = parseInt(index, 10) - 1;
        const param = params[paramIndex];
        if (typeof param === 'string') {
            return `'${param}'`;
        }
        return String(param);
    });

    console.log("*****query\n", fullQuery);
};



import {TeamRecord} from "../models/models.js";

/**
 * Parses an array of 3 win-loss records of the format "W-L" into an array of 6 integers.
 * The 3 records passed to this function should be overall, home, and away records, in that order.
 * @returns an array of 6 numbers representing the win-loss records of a team, so a team that
 * is 5-3 overall, 3-1 at home, and 2-2 away would be represented as [5, 3, 3, 1, 2, 2].
 */
export const parseRecords = (records: [TeamRecord, TeamRecord, TeamRecord]): number[] => {
    const returnTuple = [0, 0, 0, 0, 0, 0];
    let tupleIndex = 0;

    for (const record of records){
        const records = record.summary.split("-", 2);
        returnTuple[tupleIndex++] = parseInt(records[0]);
        returnTuple[tupleIndex++] = parseInt(records[1]);
    }

    return returnTuple;
};

/**
 * Parses a string representing the status of an event into one of three possible statuses.
 * @returns one of "STATUS_SCHEDULED", "STATUS_FINAL", or "STATUS_OTHER".
 */
export const parseEventStatus = (status_name: string): "STATUS_SCHEDULED" | "STATUS_FINAL" | "STATUS_OTHER" => {
    if (status_name !== "STATUS_SCHEDULED" && status_name !== "STATUS_FINAL"){
        return "STATUS_OTHER";
    }

    return status_name;
}
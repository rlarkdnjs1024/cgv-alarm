export async function sleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}

type LogType = "log" | "warn" | "error";
export function logTimestamp(logType: LogType = "log") {
    const now = new Date();
    const fullYear = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    const milliseconds = now.getMilliseconds();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    console[logType](`${fullYear}-${month}-${day} ${hour}:${minute}:${second}:${milliseconds}`);
}
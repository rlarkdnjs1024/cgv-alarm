import type {CgvResponse, MovieInfo, OpenDate, State} from "./type.js";
import {readFile, writeFile} from "node:fs/promises";
import "dotenv/config";
import {chromium} from "playwright";

type GetOpenDateListProps = { siteNo: string, movNo: string }
type GetOpenDateListOutput = {
    ok: true,
    data: string[]
} | {
    ok: false,
    error: string
};

export async function getOpenDateList({siteNo, movNo}: GetOpenDateListProps): Promise<GetOpenDateListOutput> {
    const url = new URL("https://cgv.co.kr/api/v1/booking/searchSiteScnscYmdListByMov");
    url.searchParams.set("siteNo", siteNo);
    url.searchParams.set("movNo", movNo);
    url.searchParams.set("coCd", "A420");

    let response;
    try {
        response = await fetch(url);
    } catch (e) {
        if (e instanceof Error) {
            return {
                ok: false,
                error: e.message
            }
        }
        return {
            ok: false,
            error: "Failed to fetch OpenDate"
        }
    }

    if (!response.ok) {
        return {
            ok: false,
            error: `Failed to fetch OpenDate: HTTP ${response.status}`
        }
    }

    let json: CgvResponse<OpenDate>;
    try {
        json = await response.json();
    } catch (e) {
        if (e instanceof Error) {
            return {
                ok: false,
                error: e.message
            }
        }
        return {
            ok: false,
            error: "Failed to parse json"
        }
    }

    const data = json.data.map(x => x.scnYmd)
    return {
        ok: true,
        data: data
    };
}


type GetMovieInfoWithDateProps = { siteNo: string, movNo: string, date: string }
type GetMovieInfoWithDateOutput = {
    ok: true,
    data: MovieInfo[]
} | {
    ok: false,
    error: string
};

export async function getMovieInfoWithDate({siteNo, movNo, date}: GetMovieInfoWithDateProps): Promise<GetMovieInfoWithDateOutput> {
    const url = new URL("https://cgv.co.kr/api/v1/booking/searchSchByMov");
    url.searchParams.set("siteNo", siteNo);
    url.searchParams.set("movNo", movNo);
    url.searchParams.set("scnYmd", date);
    url.searchParams.set("coCd", "A420");

    url.searchParams.set("rtctlScopCd", "08");

    let response;
    try {
        response = await fetch(url);
    } catch (e) {
        if (e instanceof Error) {
            return {
                ok: false,
                error: e.message
            }
        }
        return {
            ok: false,
            error: "Failed to fetch MovieInfo"
        }
    }

    if (!response.ok) {
        return {
            ok: false,
            error: `Failed to fetch MovieInfo: HTTP ${response.status}`
        }
    }

    let json: CgvResponse<MovieInfo>;
    try {
        json = await response.json();
    } catch (e) {
        if (e instanceof Error) {
            return {
                ok: false,
                error: e.message
            }
        }
        return {
            ok: false,
            error: "Failed to parse json"
        }
    }

    return {
        ok: true,
        data: json.data
    };
}

const STATE_FILE = "./state.json";

export async function readState() {
    try {
        const text = await readFile(STATE_FILE, "utf-8");
        return JSON.parse(text) as State;
    } catch {
        return null;
    }
}

export async function writeState(state: State) {
    await writeFile(STATE_FILE, JSON.stringify(state, null, 2))
}

export async function sendDiscordMessage(message: string) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL!;

    const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content: message,
        }),
    });

    if (!response.ok) {
        throw new Error(
            `Failed to send Discord message: HTTP ${response.status}`
        );
    }
}

export async function sleep(s: number) {
    return new Promise(resolve => setTimeout(resolve, s * 1000));
}

export function formatDesiredMessage(list: MovieInfo[]): string {
    const lines = list.map(x => {
        const date = `${x.scnYmd.slice(0, 4)}-${x.scnYmd.slice(4, 6)}-${x.scnYmd.slice(6, 8)}`;
        const startTime = `${x.scnsrtTm.slice(0, 2)}:${x.scnsrtTm.slice(2, 4)}`;
        const endTime = `${x.scnendTm.slice(0, 2)}:${x.scnendTm.slice(2, 4)}`;
        return `• ${date} ${startTime}~${endTime} (${x.expoScnsNm}) 잔여 ${x.frSeatCnt}/${x.stcnt}석`;
    });

    return `🎟️ 예매 가능한 회차 (${list.length}건)\n${lines.join("\n")}`;
}
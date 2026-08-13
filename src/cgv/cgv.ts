import type {CgvResponse, CgvResponsePrimitive, MovieInfo, OpenDate} from "./type.js";

function getErrorMessage(e: unknown, fallback: string): string {
    return e instanceof Error ? e.message : fallback;
}

type GetOpenDateListProps = { siteNo: string, movNo: string }
export async function getOpenDateList({siteNo, movNo}: GetOpenDateListProps): Promise<CgvResponse<string[]>> {
    const url = new URL("https://cgv.co.kr/api/v1/booking/searchSiteScnscYmdListByMov");
    url.searchParams.set("siteNo", siteNo);
    url.searchParams.set("movNo", movNo);
    url.searchParams.set("coCd", "A420");

    let response;
    try {
        response = await fetch(url);
    } catch (e) {
        return {
            ok: false,
            error: getErrorMessage(e, "Failed to fetch OpenDate")
        }
    }

    if (!response.ok) {
        return {
            ok: false,
            error: `Failed to fetch OpenDate: HTTP ${response.status}`
        }
    }

    let json: CgvResponsePrimitive<OpenDate>;
    try {
        json = await response.json();
    } catch (e) {
        return {
            ok: false,
            error: getErrorMessage(e, "Failed to parse json")
        }
    }

    const data = json.data.map(x => x.scnYmd)
    return {
        ok: true,
        data: data
    };
}


type GetMovieInfoWithDateProps = { siteNo: string, movNo: string, date: string }

export async function getMovieInfoWithDate({siteNo, movNo, date}: GetMovieInfoWithDateProps): Promise<CgvResponse<MovieInfo[]>> {
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
        return {
            ok: false,
            error: getErrorMessage(e, "Failed to fetch MovieInfo")
        }
    }

    if (!response.ok) {
        return {
            ok: false,
            error: `Failed to fetch MovieInfo: HTTP ${response.status}`
        }
    }

    let json: CgvResponsePrimitive<MovieInfo>;
    try {
        json = await response.json();
    } catch (e) {
        return {
            ok: false,
            error: getErrorMessage(e, "Failed to parse json")
        }
    }

    return {
        ok: true,
        data: json.data
    };
}

export function isNewDateOpen(prevLastOpenDate: string, newLastOpenDate: string) {
    return prevLastOpenDate < newLastOpenDate;
}
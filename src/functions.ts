import type {CgvResponse, MovieInfo, OpenDate} from "./type.js";

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
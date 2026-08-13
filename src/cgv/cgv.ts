import type {CgvResponsePrimitive, MovieInfo, OpenDate} from "./type.js";

type GetOpenDateListProps = { siteNo: string, movNo: string }
export async function getOpenDateList({siteNo, movNo}: GetOpenDateListProps): Promise<string[]> {
    const url = new URL("https://cgv.co.kr/api/v1/booking/searchSiteScnscYmdListByMov");
    url.searchParams.set("siteNo", siteNo);
    url.searchParams.set("movNo", movNo);
    url.searchParams.set("coCd", "A420");


    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch OpenDate: HTTP ${response.status}`);
    }

    const json: CgvResponsePrimitive<OpenDate> = await response.json();

    return json.data.map(x => x.scnYmd);
}


type GetMovieInfoWithDateProps = { siteNo: string, movNo: string, date: string }

export async function getMovieInfoWithDate({siteNo, movNo, date}: GetMovieInfoWithDateProps): Promise<MovieInfo[]> {
    const url = new URL("https://cgv.co.kr/api/v1/booking/searchSchByMov");
    url.searchParams.set("siteNo", siteNo);
    url.searchParams.set("movNo", movNo);
    url.searchParams.set("scnYmd", date);
    url.searchParams.set("coCd", "A420");

    url.searchParams.set("rtctlScopCd", "08");

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch MovieInfo: HTTP ${response.status}`);
    }

    const json: CgvResponsePrimitive<MovieInfo> = await response.json();
    return json.data;
}

export function isNewDateOpen(prevLastOpenDate: string, newLastOpenDate: string) {
    return prevLastOpenDate < newLastOpenDate;
}